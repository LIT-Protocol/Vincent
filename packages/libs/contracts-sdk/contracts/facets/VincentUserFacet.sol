// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";
import "../libs/LibVincentUserFacet.sol";

/**
 * @title VincentUserFacet
 * @notice Handles user management for Vincent, allowing users to register PKP tokens as agents and manage app permissions
 * @dev Part of Vincent Diamond contract, providing user-facing functionality for permitting app versions
 *      and configuring tool policy parameters. This facet gives users granular control over which applications
 *      their agent PKPs can interact with and how those applications are configured.
 */
contract VincentUserFacet is VincentBase {
    using VincentUserStorage for VincentUserStorage.UserStorage;
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /**
     * @notice Modifier to verify that the caller is the owner of the specified PKP
     * @param pkpTokenId The token ID of the PKP
     */
    modifier onlyPkpOwner(uint256 pkpTokenId) {
        if (pkpTokenId == 0) {
            revert LibVincentUserFacet.ZeroPkpTokenId();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        try us_.PKP_NFT_FACET.ownerOf(pkpTokenId) returns (address owner) {
            if (owner != msg.sender) revert LibVincentUserFacet.NotPkpOwner(pkpTokenId, msg.sender);
        } catch {
            revert LibVincentUserFacet.PkpTokenDoesNotExist(pkpTokenId);
        }

        _;
    }

    /**
     * @notice Permits an app version for a PKP token and optionally sets tool policy parameters
     * @dev This function allows a PKP owner to authorize a specific app version to use their PKP.
     *      If the PKP was previously authorized for a different version of the same app, that
     *      permission is revoked and replaced with the new version. It ensures that all the registered Tools are provided but Policies can be optional.
     *
     * @param pkpTokenId The token ID of the PKP to permit the app version for
     * @param appId The ID of the app to permit
     * @param appVersion The version of the app to permit
     * @param toolIpfsCids Array of IPFS CIDs for tools to configure
     * @param policyIpfsCids 2D array mapping tools to their policies
     * @param policyParameterValues 2D array mapping parameter names to their CBOR2 encoded values
     */
    function permitAppVersion(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        bytes[][] calldata policyParameterValues
    ) external appNotDeleted(appId) onlyRegisteredAppVersion(appId, appVersion) appEnabled(appId, appVersion) onlyPkpOwner(pkpTokenId) {
        uint256 toolCount = toolIpfsCids.length;

        if (toolCount == 0 || policyIpfsCids.length == 0 || policyParameterValues.length == 0) {
            revert LibVincentUserFacet.InvalidInput();
        }

        if (
            toolCount != policyIpfsCids.length || toolCount != policyParameterValues.length
        ) {
            revert LibVincentUserFacet.ToolsAndPoliciesLengthMismatch();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
        uint256 currentPermittedAppVersion = agentStorage.permittedAppVersion[appId];

        if (currentPermittedAppVersion == appVersion) {
            revert LibVincentUserFacet.AppVersionAlreadyPermitted(pkpTokenId, appId, appVersion);
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.AppVersion storage newAppVersion =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        if (newAppVersion.toolIpfsCidHashes.length() != toolCount) {
            revert LibVincentUserFacet.NotAllRegisteredToolsProvided(appId, appVersion);
        }

        // Check if User has permitted a previous app version,
        // if so, remove the PKP Token ID from the previous AppVersion's delegated agent PKPs
        // before continuing with permitting the new app version
        if (currentPermittedAppVersion != 0) {
            // Get currently permitted AppVersion
            VincentAppStorage.AppVersion storage previousAppVersion =
                as_.appIdToApp[appId].appVersions[getAppVersionIndex(currentPermittedAppVersion)];

            // Remove the PKP Token ID from the previous AppVersion's delegated agent PKPs
            previousAppVersion.delegatedAgentPkps.remove(pkpTokenId);

            emit LibVincentUserFacet.AppVersionUnPermitted(pkpTokenId, appId, currentPermittedAppVersion);
        }

        // Add the PKP Token ID to the app version's delegated agent PKPs
        newAppVersion.delegatedAgentPkps.add(pkpTokenId);

        // Add the app ID to the User's permitted apps set
        // .add will not add the app ID again if it is already registered
        agentStorage.permittedApps.add(appId);

        // Set the new permitted app version
        agentStorage.permittedAppVersion[appId] = appVersion;

        // Add pkpTokenId to the User's registered agent PKPs
        // .add will not add the PKP Token ID again if it is already registered
        if (us_.userAddressToRegisteredAgentPkps[msg.sender].add(pkpTokenId)) {
            emit LibVincentUserFacet.NewUserAgentPkpRegistered(msg.sender, pkpTokenId);
        }

        emit LibVincentUserFacet.AppVersionPermitted(pkpTokenId, appId, appVersion);

        _setToolPolicyParameters(
            appId, pkpTokenId, appVersion, toolIpfsCids, policyIpfsCids, policyParameterValues
        );
    }

    /**
     * @notice Revokes permission for a PKP to use a specific app version
     * @dev This function removes authorization for a PKP to interact with an app version.
     *      The PKP is removed from the app version's delegated agent PKPs list and the
     *      app is removed from the PKP's permitted apps set.
     *
     * @param pkpTokenId The token ID of the PKP to revoke permission for
     * @param appId The ID of the app to unpermit
     * @param appVersion The version of the app to unpermit
     */
    function unPermitAppVersion(uint256 pkpTokenId, uint256 appId, uint256 appVersion)
        external
        onlyPkpOwner(pkpTokenId)
        onlyRegisteredAppVersion(appId, appVersion)
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        if (us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId] != appVersion) {
            revert LibVincentUserFacet.AppVersionNotPermitted(pkpTokenId, appId, appVersion);
        }

        // Remove the PKP Token ID from the App's Delegated Agent PKPs
        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.appStorage().appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)]
            .delegatedAgentPkps
            .remove(pkpTokenId);

        // Remove the App Version from the User's Permitted App Versions
        us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId] = 0;

        // Remove the app from the User's permitted apps set
        us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedApps.remove(appId);

        emit LibVincentUserFacet.AppVersionUnPermitted(pkpTokenId, appId, appVersion);
    }

    /**
     * @notice Sets tool policy parameters for a specific app version
     * @dev This function allows configuring policy parameters for tools associated with an app.
     *      It validates that the tools, policies, and parameters exist in the app version before
     *      storing parameter values. This is the public entry point for setting parameters without
     *      changing app version permissions. Even a single Tool Policy can be updated. Also use to remove existing policies by setting them to zero from the client.
     *
     * @param pkpTokenId The token ID of the PKP to set parameters for
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param toolIpfsCids Array of IPFS CIDs for tools to configure
     * @param policyIpfsCids 2D array mapping tools to their policies
     * @param policyParameterValues 2D array mapping parameter names to their values
     */
    function setToolPolicyParameters(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        bytes[][] calldata policyParameterValues
    ) external onlyRegisteredAppVersion(appId, appVersion) onlyPkpOwner(pkpTokenId) {
        // Allowing the User to update the Policies for Apps even if they're deleted or disabled since these flags can be toggled anytime by the App Manager so we don't want to block the User from updating the Policies.
        if (toolIpfsCids.length == 0 || policyIpfsCids.length == 0 || policyParameterValues.length == 0) {
            revert LibVincentUserFacet.InvalidInput();
        }

        if (
            toolIpfsCids.length != policyIpfsCids.length || toolIpfsCids.length != policyParameterValues.length
        ) {
            revert LibVincentUserFacet.ToolsAndPoliciesLengthMismatch();
        }

        // Check if the User has permitted the current app version
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
        uint256 currentPermittedAppVersion = agentStorage.permittedAppVersion[appId];

        if (currentPermittedAppVersion != appVersion) {
            revert LibVincentUserFacet.AppVersionNotPermitted(pkpTokenId, appId, appVersion);
        }

        _setToolPolicyParameters(
            appId, pkpTokenId, appVersion, toolIpfsCids, policyIpfsCids, policyParameterValues
        );
    }

    /**
     * @notice Associates policy parameters with tools for a given app version
     * @dev This internal function ensures that the provided tools, policies, and parameters are valid,
     *      then stores their corresponding values in user storage. It's called by permitAppVersion and
     *      setToolPolicyParameters to avoid code duplication.
     *
     * @param appId The ID of the app for which policies are being set
     * @param pkpTokenId The PKP token ID for the Agent's PKP (Programmable Key Pair)
     * @param appVersion The version of the app where the Tools and Policies are registered
     * @param toolIpfsCids Array of IPFS CIDs representing the tools being configured
     * @param policyIpfsCids 2D array where each tool maps to a list of policies stored on IPFS
     * @param policyParameterValues 2D array of parameter values matching each parameter name for a policy
     */
    function _setToolPolicyParameters(
        uint256 appId,
        uint256 pkpTokenId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        bytes[][] calldata policyParameterValues
    ) internal {
        // Step 1: Validate input array lengths to prevent mismatches.
        uint256 toolCount = toolIpfsCids.length;

        // Step 2: Fetch necessary storage references.
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        VincentAppStorage.AppVersion storage versionedApp =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        // Step 3: Loop over each tool to process its associated policies and parameters.
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = toolIpfsCids[i]; // Cache calldata value

            // Validate tool IPFS CID is not empty
            if (bytes(toolIpfsCid).length == 0) {
                revert LibVincentUserFacet.EmptyToolIpfsCid();
            }

            // Check nested array lengths at policy level
            uint256 policyCount = policyIpfsCids[i].length;
            if (policyCount != policyParameterValues[i].length) {
                revert LibVincentUserFacet.PolicyArrayLengthMismatch(
                    i, policyCount, policyParameterValues[i].length
                );
            }

            bytes32 hashedToolIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Step 3.1: Validate that the tool exists in the specified app version. This works since we ensured that all the Tools were unique during registration via EnumebrableSet.
            if (!versionedApp.toolIpfsCidHashes.contains(hashedToolIpfsCid)) {
                revert LibVincentUserFacet.ToolNotRegisteredForAppVersion(appId, appVersion, toolIpfsCid);
            }

            // Check for duplicate tool IPFS CIDs
            for (uint256 k = i + 1; k < toolCount; k++) {
                if (keccak256(abi.encodePacked(toolIpfsCids[k])) == hashedToolIpfsCid) {
                    revert LibVincentUserFacet.DuplicateToolIpfsCid(appId, appVersion, toolIpfsCids[k]);
                }
            }

            // Step 3.2: Access storage locations for tool policies.
            EnumerableSet.Bytes32Set storage toolPolicyIpfsCidHashes =
                versionedApp.toolIpfsCidHashToToolPolicyIpfsCidHashes[hashedToolIpfsCid];

            mapping(bytes32 => bytes) storage toolPolicyParameterValues =
                us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyParameterValues[appId][appVersion][hashedToolIpfsCid];

            // Step 4: Iterate through each policy associated with the tool.
            for (uint256 j = 0; j < policyCount; j++) {
                string memory policyIpfsCid = policyIpfsCids[i][j]; // Cache calldata value

                // Validate policy IPFS CID is not empty
                if (bytes(policyIpfsCid).length == 0) {
                    revert LibVincentUserFacet.EmptyPolicyIpfsCid();
                }

                bytes32 hashedToolPolicy = keccak256(abi.encodePacked(policyIpfsCid));

                // Step 4.1: Validate that the policy is registered for the tool. This works since we ensured that all the Policies were unique during registration via EnumebrableSet.
                if (!toolPolicyIpfsCidHashes.contains(hashedToolPolicy)) {
                    revert LibVincentUserFacet.ToolPolicyNotRegisteredForAppVersion(
                        appId, appVersion, toolIpfsCid, policyIpfsCid
                    );
                }

                // Check for duplicate tool policy IPFS CIDs
                for (uint256 k = j + 1; k < policyCount; k++) {
                    if (keccak256(abi.encodePacked(policyIpfsCids[i][k])) == hashedToolPolicy) {
                        revert LibVincentUserFacet.DuplicateToolPolicyIpfsCid(appId, appVersion, toolIpfsCid, policyIpfsCids[i][k]);
                    }
                }

                // Step 5: Store the policy parameter metadata
                toolPolicyParameterValues[hashedToolPolicy] = policyParameterValues[i][j];

                emit LibVincentUserFacet.ToolPolicyParametersSet(
                    pkpTokenId, appId, appVersion, hashedToolIpfsCid, hashedToolPolicy, policyParameterValues[i][j]
                );
            }
        }
    }
}