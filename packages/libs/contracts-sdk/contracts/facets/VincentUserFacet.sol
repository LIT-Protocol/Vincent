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
 *      and configuring ability policy parameters. This facet gives users granular control over which applications
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
     * @notice Permits an app version for a PKP token and optionally sets ability policy parameters
     * @dev This function allows a PKP owner to authorize a specific app version to use their PKP.
     *      If the PKP was previously authorized for a different version of the same app, that
     *      permission is revoked and replaced with the new version. It ensures that all the registered Abilities are provided but Policies can be optional.
     *
     * @param pkpTokenId The token ID of the PKP to permit the app version for
     * @param appId The ID of the app to permit
     * @param appVersion The version of the app to permit
     * @param abilityIpfsCids Array of IPFS CIDs for abilities to configure
     * @param policyIpfsCids 2D array mapping abilities to their policies
     * @param policyParameterValues 2D array mapping parameter names to their CBOR2 encoded values
     */
    function permitAppVersion(
        uint256 pkpTokenId,
        uint40 appId,
        uint24 appVersion,
        string[] calldata abilityIpfsCids,
        string[][] calldata policyIpfsCids,
        bytes[][] calldata policyParameterValues
    )
        external
        appNotDeleted(appId)
        onlyRegisteredAppVersion(appId, appVersion)
        appEnabled(appId, appVersion)
        onlyPkpOwner(pkpTokenId)
    {
        uint256 abilityCount = abilityIpfsCids.length;

        if (abilityCount == 0 || policyIpfsCids.length == 0 || policyParameterValues.length == 0) {
            revert LibVincentUserFacet.InvalidInput();
        }

        if (abilityCount != policyIpfsCids.length || abilityCount != policyParameterValues.length) {
            revert LibVincentUserFacet.AbilitiesAndPoliciesLengthMismatch();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
        uint24 currentPermittedAppVersion = agentStorage.permittedAppVersion[appId];

        if (currentPermittedAppVersion == appVersion) {
            revert LibVincentUserFacet.AppVersionAlreadyPermitted(pkpTokenId, appId, appVersion);
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.AppVersion storage newAppVersion =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        if (newAppVersion.abilityIpfsCidHashes.length() != abilityCount) {
            revert LibVincentUserFacet.NotAllRegisteredAbilitiesProvided(appId, appVersion);
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

        // Add the app ID to the User's historical permitted apps set (never removed)
        // .add will not add the app ID again if it is already registered
        agentStorage.allPermittedApps.add(appId);

        // Set the new permitted app version
        agentStorage.permittedAppVersion[appId] = appVersion;

        // Store this version as the last permitted version for potential re-permitting
        agentStorage.lastPermittedVersion[appId] = appVersion;

        // Add pkpTokenId to the User's registered agent PKPs
        // .add will not add the PKP Token ID again if it is already registered
        if (us_.userAddressToRegisteredAgentPkps[msg.sender].add(pkpTokenId)) {
            emit LibVincentUserFacet.NewUserAgentPkpRegistered(msg.sender, pkpTokenId);
        }

        emit LibVincentUserFacet.AppVersionPermitted(pkpTokenId, appId, appVersion);

        _setAbilityPolicyParameters(
            appId, pkpTokenId, appVersion, abilityIpfsCids, policyIpfsCids, policyParameterValues
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
    function unPermitAppVersion(uint256 pkpTokenId, uint40 appId, uint24 appVersion)
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

        // Store the version as last permitted before removing (for potential re-permitting)
        // This handles existing permitted Apps before the lastPermittedVersion tracking was added
        us_.agentPkpTokenIdToAgentStorage[pkpTokenId].lastPermittedVersion[appId] = appVersion;

        // Remove the App Version from the User's Permitted App Versions
        us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId] = 0;

        // Remove the app from the User's permitted apps set
        us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedApps.remove(appId);

        // Add the App ID to the User's historical permitted apps set
        // This ensures apps permitted before the allPermittedApps tracking was added are captured
        us_.agentPkpTokenIdToAgentStorage[pkpTokenId].allPermittedApps.add(appId);

        emit LibVincentUserFacet.AppVersionUnPermitted(pkpTokenId, appId, appVersion);
    }

    /**
     * @notice Re-permits a previously unpermitted app with its last permitted version
     * @dev This function allows a PKP owner to quickly re-authorize an app that was previously unpermitted,
     *      using the last version that was permitted. The app must have been previously permitted
     *      (exists in allPermittedApps) and the last permitted version must still be enabled.
     *
     * @param pkpTokenId The token ID of the PKP to re-permit the app for
     * @param appId The ID of the app to re-permit
     */
    function rePermitApp(uint256 pkpTokenId, uint40 appId) external appNotDeleted(appId) onlyPkpOwner(pkpTokenId) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];

        // Check if app is currently permitted
        if (agentStorage.permittedApps.contains(appId)) {
            revert LibVincentUserFacet.AppVersionAlreadyPermitted(
                pkpTokenId, appId, agentStorage.permittedAppVersion[appId]
            );
        }

        // Check if app was ever permitted (exists in allPermittedApps)
        if (!agentStorage.allPermittedApps.contains(appId)) {
            revert LibVincentUserFacet.AppNeverPermitted(pkpTokenId, appId, 0);
        }

        // Get the last permitted version
        // Note: lastPermittedVersion should never be 0 here because:
        // - If app is currently permitted, we already reverted above
        // - If app was unpermitted, unPermitAppVersion sets lastPermittedVersion
        uint24 lastPermittedVersion = agentStorage.lastPermittedVersion[appId];

        // Check if the last permitted version is still enabled
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.AppVersion storage appVersion =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(lastPermittedVersion)];

        if (!appVersion.enabled) {
            revert LibVincentUserFacet.AppVersionNotEnabled(appId, lastPermittedVersion);
        }

        // Re-permit the app with the last permitted version
        appVersion.delegatedAgentPkps.add(pkpTokenId);
        agentStorage.permittedApps.add(appId);
        agentStorage.permittedAppVersion[appId] = lastPermittedVersion;

        emit LibVincentUserFacet.AppVersionRePermitted(pkpTokenId, appId, lastPermittedVersion);
    }

    /**
     * @notice Sets ability policy parameters for a specific app version
     * @dev This function allows configuring policy parameters for abilities associated with an app.
     *      It validates that the abilities, policies, and parameters exist in the app version before
     *      storing parameter values. This is the public entry point for setting parameters without
     *      changing app version permissions. Even a single Ability Policy can be updated. Also use to remove existing policies by setting them to zero from the client.
     *
     * @param pkpTokenId The token ID of the PKP to set parameters for
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param abilityIpfsCids Array of IPFS CIDs for abilities to configure
     * @param policyIpfsCids 2D array mapping abilities to their policies
     * @param policyParameterValues 2D array mapping parameter names to their values
     */
    function setAbilityPolicyParameters(
        uint256 pkpTokenId,
        uint40 appId,
        uint24 appVersion,
        string[] calldata abilityIpfsCids,
        string[][] calldata policyIpfsCids,
        bytes[][] calldata policyParameterValues
    ) external onlyRegisteredAppVersion(appId, appVersion) onlyPkpOwner(pkpTokenId) {
        // Allowing the User to update the Policies for Apps even if they're deleted or disabled since these flags can be toggled anytime by the App Manager so we don't want to block the User from updating the Policies.
        if (abilityIpfsCids.length == 0 || policyIpfsCids.length == 0 || policyParameterValues.length == 0) {
            revert LibVincentUserFacet.InvalidInput();
        }

        if (abilityIpfsCids.length != policyIpfsCids.length || abilityIpfsCids.length != policyParameterValues.length) {
            revert LibVincentUserFacet.AbilitiesAndPoliciesLengthMismatch();
        }

        // Check if the User has permitted the current app version
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
        uint24 currentPermittedAppVersion = agentStorage.permittedAppVersion[appId];

        if (currentPermittedAppVersion != appVersion) {
            revert LibVincentUserFacet.AppVersionNotPermitted(pkpTokenId, appId, appVersion);
        }

        _setAbilityPolicyParameters(
            appId, pkpTokenId, appVersion, abilityIpfsCids, policyIpfsCids, policyParameterValues
        );
    }

    /**
     * @notice Associates policy parameters with abilities for a given app version
     * @dev This internal function ensures that the provided abilities, policies, and parameters are valid,
     *      then stores their corresponding values in user storage. It's called by permitAppVersion and
     *      setAbilityPolicyParameters to avoid code duplication.
     *
     * @param appId The ID of the app for which policies are being set
     * @param pkpTokenId The PKP token ID for the Agent's PKP (Programmable Key Pair)
     * @param appVersion The version of the app where the Abilities and Policies are registered
     * @param abilityIpfsCids Array of IPFS CIDs representing the abilities being configured
     * @param policyIpfsCids 2D array where each ability maps to a list of policies stored on IPFS
     * @param policyParameterValues 2D array of parameter values matching each parameter name for a policy
     */
    function _setAbilityPolicyParameters(
        uint40 appId,
        uint256 pkpTokenId,
        uint24 appVersion,
        string[] calldata abilityIpfsCids,
        string[][] calldata policyIpfsCids,
        bytes[][] calldata policyParameterValues
    ) internal {
        // Step 1: Validate input array lengths to prevent mismatches.
        uint256 abilityCount = abilityIpfsCids.length;

        // Step 2: Fetch necessary storage references.
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        VincentAppStorage.AppVersion storage versionedApp =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        // Step 3: Loop over each ability to process its associated policies and parameters.
        for (uint256 i = 0; i < abilityCount; i++) {
            string memory abilityIpfsCid = abilityIpfsCids[i]; // Cache calldata value

            // Validate ability IPFS CID is not empty
            if (bytes(abilityIpfsCid).length == 0) {
                revert LibVincentUserFacet.EmptyAbilityIpfsCid();
            }

            // Check nested array lengths at policy level
            uint256 policyCount = policyIpfsCids[i].length;
            if (policyCount != policyParameterValues[i].length) {
                revert LibVincentUserFacet.PolicyArrayLengthMismatch(i, policyCount, policyParameterValues[i].length);
            }

            bytes32 hashedAbilityIpfsCid = keccak256(abi.encodePacked(abilityIpfsCid));

            // Step 3.1: Validate that the ability exists in the specified app version. This works since we ensured that all the Abilities were unique during registration via EnumebrableSet.
            if (!versionedApp.abilityIpfsCidHashes.contains(hashedAbilityIpfsCid)) {
                revert LibVincentUserFacet.AbilityNotRegisteredForAppVersion(appId, appVersion, abilityIpfsCid);
            }

            // Check for duplicate ability IPFS CIDs
            for (uint256 k = i + 1; k < abilityCount; k++) {
                if (keccak256(abi.encodePacked(abilityIpfsCids[k])) == hashedAbilityIpfsCid) {
                    revert LibVincentUserFacet.DuplicateAbilityIpfsCid(appId, appVersion, abilityIpfsCids[k]);
                }
            }

            // Step 3.2: Access storage locations for ability policies.
            EnumerableSet.Bytes32Set storage abilityPolicyIpfsCidHashes =
                versionedApp.abilityIpfsCidHashToAbilityPolicyIpfsCidHashes[hashedAbilityIpfsCid];

            mapping(bytes32 => bytes) storage abilityPolicyParameterValues = us_.agentPkpTokenIdToAgentStorage[pkpTokenId]
                .abilityPolicyParameterValues[appId][appVersion][hashedAbilityIpfsCid];

            // Step 4: Iterate through each policy associated with the ability.
            for (uint256 j = 0; j < policyCount; j++) {
                string memory policyIpfsCid = policyIpfsCids[i][j]; // Cache calldata value

                // Validate policy IPFS CID is not empty
                if (bytes(policyIpfsCid).length == 0) {
                    revert LibVincentUserFacet.EmptyPolicyIpfsCid();
                }

                bytes32 hashedAbilityPolicy = keccak256(abi.encodePacked(policyIpfsCid));

                // Step 4.1: Validate that the policy is registered for the ability. This works since we ensured that all the Policies were unique during registration via EnumebrableSet.
                if (!abilityPolicyIpfsCidHashes.contains(hashedAbilityPolicy)) {
                    revert LibVincentUserFacet.AbilityPolicyNotRegisteredForAppVersion(
                        appId, appVersion, abilityIpfsCid, policyIpfsCid
                    );
                }

                // Check for duplicate ability policy IPFS CIDs
                for (uint256 k = j + 1; k < policyCount; k++) {
                    if (keccak256(abi.encodePacked(policyIpfsCids[i][k])) == hashedAbilityPolicy) {
                        revert LibVincentUserFacet.DuplicateAbilityPolicyIpfsCid(
                            appId, appVersion, abilityIpfsCid, policyIpfsCids[i][k]
                        );
                    }
                }

                // Step 5: Store the policy parameter metadata
                abilityPolicyParameterValues[hashedAbilityPolicy] = policyParameterValues[i][j];

                emit LibVincentUserFacet.AbilityPolicyParametersSet(
                    pkpTokenId,
                    appId,
                    appVersion,
                    hashedAbilityIpfsCid,
                    hashedAbilityPolicy,
                    policyParameterValues[i][j]
                );
            }
        }
    }
}
