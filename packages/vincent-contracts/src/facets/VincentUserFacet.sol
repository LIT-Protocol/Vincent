// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";

contract VincentUserFacet is VincentBase {
    using VincentUserStorage for VincentUserStorage.UserStorage;
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    event NewUserAgentPkpRegistered(address indexed userAddress, uint256 indexed pkpTokenId);
    event AppVersionPermitted(uint256 indexed pkpTokenId, uint256 indexed appId, uint256 indexed appVersion);
    event AppVersionUnPermitted(uint256 indexed pkpTokenId, uint256 indexed appId, uint256 indexed appVersion);
    event ToolPolicyParameterSet(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed appVersion,
        bytes32 hashedToolIpfsCid,
        bytes32 hashedPolicyParameterName
    );
    event ToolPolicyParameterRemoved(
        uint256 indexed pkpTokenId,
        uint256 indexed appId,
        uint256 indexed appVersion,
        bytes32 hashedToolIpfsCid,
        bytes32 hashedPolicyParameterName
    );

    error NotPkpOwner(uint256 pkpTokenId, address msgSender);
    error AppVersionAlreadyPermitted(uint256 pkpTokenId, uint256 appId, uint256 appVersion);
    error AppVersionNotPermitted(uint256 pkpTokenId, uint256 appId, uint256 appVersion);
    error AppVersionNotEnabled(uint256 appId, uint256 appVersion);
    error ToolsAndPoliciesLengthMismatch();
    error ToolNotRegisteredForAppVersion(uint256 appId, uint256 appVersion, bytes32 hashedToolIpfsCid);
    error ToolPolicyNotRegisteredForAppVersion(
        uint256 appId, uint256 appVersion, bytes32 hashedToolIpfsCid, bytes32 hashedToolPolicy
    );
    error PolicyParameterNameNotRegisteredForAppVersion(
        uint256 appId, uint256 appVersion, bytes32 hashedToolIpfsCid, bytes32 hashedPolicyParameterName
    );

    modifier onlyPkpOwner(uint256 pkpTokenId) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        if (us_.PKP_NFT_FACET.ownerOf(pkpTokenId) != msg.sender) revert NotPkpOwner(pkpTokenId, msg.sender);
        _;
    }

    function permitAppVersion(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames,
        string[][][] calldata policyParameterValues
    ) external onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) onlyRegisteredAppVersion(appId, appVersion) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
        uint256 currentPermittedAppVersion = agentStorage.permittedAppVersion[appId];

        if (currentPermittedAppVersion == appVersion) {
            revert AppVersionAlreadyPermitted(pkpTokenId, appId, appVersion);
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.VersionedApp storage newVersionedApp = as_.appIdToApp[appId].versionedApps[appVersion - 1];

        // Check if the App Manager has disabled the App
        if (!newVersionedApp.enabled) revert AppVersionNotEnabled(appId, appVersion);

        // Check if User has permitted a previous app version,
        // if so, remove the PKP Token ID from the previous VersionedApp's delegated agent PKPs
        // before continuing with permitting the new app version
        if (currentPermittedAppVersion != 0) {
            // Get currently permitted VersionedApp
            VincentAppStorage.VersionedApp storage previousVersionedApp =
                as_.appIdToApp[appId].versionedApps[currentPermittedAppVersion - 1];

            // Remove the PKP Token ID from the previous VersionedApp's delegated agent PKPs
            previousVersionedApp.delegatedAgentPkps.remove(pkpTokenId);

            emit AppVersionUnPermitted(pkpTokenId, appId, currentPermittedAppVersion);
        }

        // Add the PKP Token ID to the app version's delegated agent PKPs
        newVersionedApp.delegatedAgentPkps.add(pkpTokenId);

        // Set the new permitted app version
        agentStorage.permittedAppVersion[appId] = appVersion;

        // Add the app ID to the User's permitted apps set
        // .add will not add the app ID again if it is already registered
        agentStorage.permittedApps.add(appId);

        // Add pkpTokenId to the User's registered agent PKPs
        // .add will not add the PKP Token ID again if it is already registered
        if (us_.userAddressToRegisteredAgentPkps[msg.sender].add(pkpTokenId)) {
            emit NewUserAgentPkpRegistered(msg.sender, pkpTokenId);
        }

        emit AppVersionPermitted(pkpTokenId, appId, appVersion);

        // Save some gas by not calling the setToolPolicyParameters function if there are no tool policy parameters to set
        if (toolIpfsCids.length > 0) {
            _setToolPolicyParameters(
                appId, pkpTokenId, appVersion, toolIpfsCids, policyIpfsCids, policyParameterNames, policyParameterValues
            );
        }
    }

    function unPermitAppVersion(uint256 pkpTokenId, uint256 appId, uint256 appVersion)
        external
        onlyPkpOwner(pkpTokenId)
        onlyRegisteredApp(appId)
        onlyRegisteredAppVersion(appId, appVersion)
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        if (us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId] != appVersion) {
            revert AppVersionNotPermitted(pkpTokenId, appId, appVersion);
        }

        // Remove the PKP Token ID from the App's Delegated Agent PKPs
        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.appStorage().appIdToApp[appId].versionedApps[appVersion - 1].delegatedAgentPkps.remove(
            pkpTokenId
        );

        // Remove the App Version from the User's Permitted App Versions
        us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId] = 0;

        // Remove the app from the User's permitted apps set
        us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedApps.remove(appId);

        // Emit the AppVersionUnPermitted event
        emit AppVersionUnPermitted(pkpTokenId, appId, appVersion);
    }

    function setToolPolicyParameters(
        uint256 pkpTokenId,
        uint256 appId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames,
        string[][][] calldata policyParameterValues
    ) public onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) onlyRegisteredAppVersion(appId, appVersion) {
        _setToolPolicyParameters(
            appId, pkpTokenId, appVersion, toolIpfsCids, policyIpfsCids, policyParameterNames, policyParameterValues
        );
    }

    /**
     * @dev Removes policy parameters associated with tools for a given app version.
     * This function verifies that the tools and policies exist before removing their parameters
     * from user storage.
     *
     * @notice This function is used to remove policy parameters from a tool associated with an app version.
     *
     * @param appId The ID of the app from which policy parameters are being removed.
     * @param pkpTokenId The PKP token ID for the Agent's PKP (Programmable Key Pair).
     * @param appVersion The version of the app where the policies were applied.
     * @param toolIpfsCids An array of IPFS CIDs representing the tools from which policies should be removed.
     * @param policyIpfsCids A 2D array mapping each tool to a list of policy IPFS CIDs to be removed.
     * @param policyParameterNames A 3D array mapping each policy to a list of associated parameter names to be removed.
     */
    function removeToolPolicyParameters(
        uint256 appId,
        uint256 pkpTokenId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames
    ) external onlyPkpOwner(pkpTokenId) onlyRegisteredApp(appId) onlyRegisteredAppVersion(appId, appVersion) {
        // Step 1: Validate input array lengths to ensure they are consistent.
        uint256 toolCount = toolIpfsCids.length;
        if (toolCount != policyIpfsCids.length || toolCount != policyParameterNames.length) {
            revert ToolsAndPoliciesLengthMismatch();
        }

        // Step 2: Fetch necessary storage references.
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        // Step 3: Iterate over each tool to process its policies and remove parameters.
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = toolIpfsCids[i]; // Cache calldata value
            bytes32 hashedToolIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Step 3.1: Validate that the tool exists for the specified app version.
            VincentAppStorage.VersionedApp storage versionedApp = as_.appIdToApp[appId].versionedApps[appVersion - 1];
            if (!versionedApp.toolIpfsCidHashes.contains(hashedToolIpfsCid)) {
                revert ToolNotRegisteredForAppVersion(appId, appVersion, hashedToolIpfsCid);
            }

            // Step 3.2: Fetch the tool policies to check if policies exist.
            EnumerableSet.Bytes32Set storage toolPolicyIpfsCidHashes =
                versionedApp.toolIpfsCidHashToPolicyIpfsCidHashes[hashedToolIpfsCid];

            // Step 3.3: Access the tool policy storage for the PKP owner.
            VincentUserStorage.ToolPolicyStorage storage toolStorage =
                us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyStorage[appId][hashedToolIpfsCid];

            // Step 4: Iterate through each policy associated with the tool.
            uint256 policyCount = policyIpfsCids[i].length;
            for (uint256 j = 0; j < policyCount; j++) {
                string memory policyIpfsCid = policyIpfsCids[i][j]; // Cache calldata value
                bytes32 hashedPolicyId = keccak256(abi.encodePacked(policyIpfsCid));

                // Step 4.1: Verify that the policy exists before attempting removal.
                if (!toolPolicyIpfsCidHashes.contains(hashedPolicyId)) {
                    revert ToolPolicyNotRegisteredForAppVersion(appId, appVersion, hashedToolIpfsCid, hashedPolicyId);
                }

                // Step 4.2: Access the policy parameters storage.
                VincentUserStorage.PolicyParametersStorage storage policyParams =
                    toolStorage.policyIpfsCidHashToPolicyParametersStorage[hashedPolicyId];

                // Step 5: Iterate through parameters and remove them.
                uint256 paramCount = policyParameterNames[i][j].length;
                for (uint256 k = 0; k < paramCount; k++) {
                    string memory paramName = policyParameterNames[i][j][k]; // Cache calldata value
                    bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(paramName));

                    // Step 5.1: Only remove the parameter if it exists.
                    if (policyParams.policyParameterNameHashes.contains(hashedPolicyParameterName)) {
                        policyParams.policyParameterNameHashes.remove(hashedPolicyParameterName);
                        delete policyParams.policyParameterNameHashToValue[hashedPolicyParameterName];

                        // Step 5.2: Emit an event to record the removal of the policy parameter.
                        emit ToolPolicyParameterRemoved(
                            pkpTokenId, appId, appVersion, hashedToolIpfsCid, hashedPolicyParameterName
                        );
                    }
                }

                // Check if there are any parameters left for this policy
                if (policyParams.policyParameterNameHashes.length() == 0) {
                    // If no parameters left, remove the policy from the set of policies with parameters
                    toolStorage.policyIpfsCidHashesWithParameters.remove(hashedPolicyId);
                }
            }
        }
    }

    /**
     * @dev Associates policy parameters with tools for a given app version.
     * This function ensures that the provided tools, policies, and parameters are valid,
     * then stores their corresponding values in user storage.
     *
     * @notice This function is called internally to set policy parameters for a user's tool.
     *
     * @param appId The ID of the app for which policies are being set.
     * @param pkpTokenId The PKP token ID for the Agent's PKP (Programmable Key Pair).
     * @param appVersion The version of the app where the Tools and Policies are registered.
     * @param toolIpfsCids Array of IPFS CIDs representing the tools being configured.
     * @param policyIpfsCids 2D array where each tool maps to a list of policies stored on IPFS.
     * @param policyParameterNames 3D array where each policy maps to a list of parameter names.
     * @param policyParameterValues 3D array of parameter values matching each parameter name for a policy.
     */
    function _setToolPolicyParameters(
        uint256 appId,
        uint256 pkpTokenId,
        uint256 appVersion,
        string[] calldata toolIpfsCids,
        string[][] calldata policyIpfsCids,
        string[][][] calldata policyParameterNames,
        string[][][] calldata policyParameterValues
    ) internal {
        // Step 1: Validate input array lengths to prevent mismatches.
        uint256 toolCount = toolIpfsCids.length;
        if (
            toolCount != policyIpfsCids.length || toolCount != policyParameterNames.length
                || toolCount != policyParameterValues.length
        ) {
            revert ToolsAndPoliciesLengthMismatch();
        }

        // Step 2: Fetch necessary storage references.
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        // Step 3: Loop over each tool to process its associated policies and parameters.
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = toolIpfsCids[i]; // Cache calldata value
            bytes32 hashedToolIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Step 3.1: Validate that the tool exists in the specified app version.
            VincentAppStorage.VersionedApp storage versionedApp = as_.appIdToApp[appId].versionedApps[appVersion - 1];
            if (!versionedApp.toolIpfsCidHashes.contains(hashedToolIpfsCid)) {
                revert ToolNotRegisteredForAppVersion(appId, appVersion, hashedToolIpfsCid);
            }

            // Step 3.2: Access storage locations for tool policies.
            EnumerableSet.Bytes32Set storage toolPolicyIpfsCidHashes =
                versionedApp.toolIpfsCidHashToPolicyIpfsCidHashes[hashedToolIpfsCid];

            VincentUserStorage.ToolPolicyStorage storage userToolPolicyStorage =
                us_.agentPkpTokenIdToAgentStorage[pkpTokenId].toolPolicyStorage[appId][hashedToolIpfsCid];

            // Step 4: Iterate through each policy associated with the tool.
            uint256 policyCount = policyIpfsCids[i].length;
            for (uint256 j = 0; j < policyCount; j++) {
                string memory policyIpfsCid = policyIpfsCids[i][j]; // Cache calldata value
                bytes32 hashedToolPolicy = keccak256(abi.encodePacked(policyIpfsCid));

                // Step 4.1: Validate that the policy is registered for the tool.
                if (!toolPolicyIpfsCidHashes.contains(hashedToolPolicy)) {
                    revert ToolPolicyNotRegisteredForAppVersion(appId, appVersion, hashedToolIpfsCid, hashedToolPolicy);
                }

                // Step 4.2: Access storage for policy parameters.
                VincentUserStorage.PolicyParametersStorage storage policyParametersStorage =
                    userToolPolicyStorage.policyIpfsCidHashToPolicyParametersStorage[hashedToolPolicy];

                // Step 5: Iterate through each parameter associated with the policy.
                uint256 paramCount = policyParameterNames[i][j].length;
                for (uint256 k = 0; k < paramCount; k++) {
                    string memory paramName = policyParameterNames[i][j][k]; // Cache calldata value
                    bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(paramName));

                    // Step 5.1: Ensure that the parameter is valid for the specified policy.
                    if (
                        !versionedApp.policyIpfsCidHashToParameterNameHashes[hashedToolPolicy].contains(
                            hashedPolicyParameterName
                        )
                    ) {
                        revert PolicyParameterNameNotRegisteredForAppVersion(
                            appId, appVersion, hashedToolIpfsCid, hashedPolicyParameterName
                        );
                    }

                    // Step 5.2: Store the parameter name if not already added.
                    policyParametersStorage.policyParameterNameHashes.add(hashedPolicyParameterName);

                    // Step 5.3: Set the parameter value.
                    policyParametersStorage.policyParameterNameHashToValue[hashedPolicyParameterName] =
                        policyParameterValues[i][j][k];

                    // Step 5.5: Add the policy hash to the set of policies with parameters.
                    userToolPolicyStorage.policyIpfsCidHashesWithParameters.add(hashedToolPolicy);

                    // Step 5.6: Emit an event for tracking.
                    emit ToolPolicyParameterSet(
                        pkpTokenId, appId, appVersion, hashedToolIpfsCid, hashedPolicyParameterName
                    );
                }
            }
        }
    }
}
