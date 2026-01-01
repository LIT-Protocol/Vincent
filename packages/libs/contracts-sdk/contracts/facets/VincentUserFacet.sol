// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";
import "../libs/LibVincentUserFacet.sol";

/**
 * @title VincentUserFacet
 * @notice Handles user management for Vincent, allowing users to register agent addresses and manage app permissions
 * @dev Part of Vincent Diamond contract, providing user-facing functionality for permitting app versions
 *      and configuring ability policy parameters. This facet gives users granular control over which applications
 *      their agent addresses can interact with and how those applications are configured.
 */
contract VincentUserFacet is VincentBase {
    using VincentUserStorage for VincentUserStorage.UserStorage;
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @notice Permits an app version for an agent and optionally sets ability policy parameters
     * @dev This function allows an agent owner to authorize a specific app version to use their agent.
     *      If the agent was previously authorized for a different version of the same app, that
     *      permission is revoked and replaced with the new version. It ensures that all the registered Abilities are provided but Policies can be optional.
     *
     * @param userAddress The address of the user that the agent is acting on behalf of
     * @param appId The ID of the app to permit the agent to use
     * @param appVersion The version of the app to permit the agent to use
     * @param abilityIpfsCids Array of IPFS CIDs for abilities to configure
     * @param policyIpfsCids 2D array mapping abilities to their policies
     * @param policyParameterValues 2D array mapping parameter names to their CBOR2 encoded values for the abilities
     */
    function permitAppVersion(
        address userAddress,
        address pkpSigner,
        uint256 pkpSignerPubKey,
        uint40 appId,
        uint24 appVersion,
        string[] calldata abilityIpfsCids,
        string[][] calldata policyIpfsCids,
        bytes[][] calldata policyParameterValues
    ) external appNotDeleted(appId) onlyRegisteredAppVersion(appId, appVersion) appEnabled(appId, appVersion) {
        uint256 abilityCount = abilityIpfsCids.length;

        if (userAddress == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        if (pkpSigner == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        if (pkpSignerPubKey == 0) {
            revert LibVincentUserFacet.ZeroPkpSignerPubKeyNotAllowed();
        }

        if (abilityCount == 0 || policyIpfsCids.length == 0 || policyParameterValues.length == 0) {
            revert LibVincentUserFacet.InvalidInput();
        }

        if (abilityCount != policyIpfsCids.length || abilityCount != policyParameterValues.length) {
            revert LibVincentUserFacet.AbilitiesAndPoliciesLengthMismatch();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        VincentUserStorage.AgentStorage storage agentStorage = us_.agentAddressToAgentStorage[msg.sender];

        if (agentStorage.permittedAppId != 0 && agentStorage.permittedAppId != appId) {
            revert LibVincentUserFacet.DifferentAppAlreadyPermitted(msg.sender, appId);
        }

        if (agentStorage.permittedAppVersion == appVersion) {
            revert LibVincentUserFacet.AppVersionAlreadyPermitted(msg.sender, appId, appVersion);
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.AppVersion storage newAppVersion =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        if (newAppVersion.abilityIpfsCidHashes.length() != abilityCount) {
            revert LibVincentUserFacet.NotAllRegisteredAbilitiesProvided(appId, appVersion);
        }

        // Check if User has permitted a previous app version,
        // if so, remove the agent address from the previous AppVersion's delegated agent addresses
        // before continuing with permitting the new app version
        if (agentStorage.permittedAppVersion != 0) {
            // Get currently permitted AppVersion
            VincentAppStorage.AppVersion storage previousAppVersion = as_.appIdToApp[agentStorage.permittedAppId].appVersions[
                getAppVersionIndex(agentStorage.permittedAppVersion)
            ];

            // Remove the agent address from the previous AppVersion's delegated agent addresses
            previousAppVersion.delegatedAgentAddresses.remove(msg.sender);

            emit LibVincentUserFacet.AppVersionUnPermitted(
                msg.sender,
                agentStorage.permittedAppId,
                agentStorage.permittedAppVersion,
                agentStorage.pkpSigner,
                agentStorage.pkpSignerPubKey
            );
        }

        // Add the agent address to the app version's delegated agent addresses
        newAppVersion.delegatedAgentAddresses.add(msg.sender);

        agentStorage.pkpSigner = pkpSigner;
        agentStorage.pkpSignerPubKey = pkpSignerPubKey;
        agentStorage.permittedAppId = appId;
        agentStorage.permittedAppVersion = appVersion;

        // Add agent address to the User's registered agent addresses
        // .add will not add the agent address again if it is already registered
        if (us_.userAddressToRegisteredAgentAddresses[userAddress].add(msg.sender)) {
            // Set the reverse mapping from agent address to user address
            us_.registeredAgentAddressToUserAddress[msg.sender] = userAddress;
            emit LibVincentUserFacet.NewAgentRegistered(userAddress, msg.sender, pkpSigner, pkpSignerPubKey);
        }

        emit LibVincentUserFacet.AppVersionPermitted(msg.sender, appId, appVersion, pkpSigner, pkpSignerPubKey);

        _setAbilityPolicyParameters(appId, appVersion, abilityIpfsCids, policyIpfsCids, policyParameterValues);
    }

    /**
     * @notice Revokes permission for an agent to use a specific app version
     * @dev This function removes authorization for an agent to interact with an app version.
     *      The agent is removed from the app version's delegated agent addresses list and the
     *      app is removed from the agent's permitted app set.
     *
     * @param appId The ID of the app to unpermit
     * @param appVersion The version of the app to unpermit
     */
    function unPermitAppVersion(uint40 appId, uint24 appVersion) external onlyRegisteredAppVersion(appId, appVersion) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentUserStorage.AgentStorage storage agentStorage = us_.agentAddressToAgentStorage[msg.sender];

        if (agentStorage.permittedAppVersion != appVersion) {
            revert LibVincentUserFacet.AppVersionNotPermitted(msg.sender, appId, appVersion);
        }

        // Remove the agent address from the App's Delegated Agent addresses
        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.appStorage()
            .appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)].delegatedAgentAddresses
            .remove(msg.sender);

        // Store the app id, version and pkp signer as last permitted before removing (for potential re-permitting)
        agentStorage.lastPermittedAppId = appId;
        agentStorage.lastPermittedAppVersion = appVersion;
        agentStorage.lastPermittedPkpSigner = agentStorage.pkpSigner;
        agentStorage.lastPermittedPkpSignerPubKey = agentStorage.pkpSignerPubKey;

        // Remove the App Version from the User's Permitted App
        agentStorage.permittedAppVersion = 0;
        agentStorage.permittedAppId = 0;
        agentStorage.pkpSigner = address(0);
        agentStorage.pkpSignerPubKey = 0;

        emit LibVincentUserFacet.AppVersionUnPermitted(
            msg.sender,
            appId,
            appVersion,
            agentStorage.lastPermittedPkpSigner,
            agentStorage.lastPermittedPkpSignerPubKey
        );
    }

    /**
     * @notice Re-permits a previously unpermitted app with its last permitted version
     * @dev This function allows an agent to quickly re-authorize an app that was previously unpermitted,
     *      using the last version that was permitted. The app must have been previously permitted
     *      and the last permitted version must still be enabled.
     *
     * @param appId The ID of the app to re-permit
     */
    function rePermitApp(uint40 appId) external appNotDeleted(appId) {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentUserStorage.AgentStorage storage agentStorage = us_.agentAddressToAgentStorage[msg.sender];

        // Check if app is currently permitted
        if (agentStorage.permittedAppId == appId) {
            revert LibVincentUserFacet.AppVersionAlreadyPermitted(msg.sender, appId, agentStorage.permittedAppVersion);
        }

        if (agentStorage.permittedAppId != 0) {
            revert LibVincentUserFacet.DifferentAppAlreadyPermitted(msg.sender, appId);
        }

        // Check if app was ever permitted (exists in allPermittedApps)
        if (agentStorage.lastPermittedAppId != appId) {
            // AppNeverPermitted is not technically true if the user permitted app 1, unpermitted,
            // then permitted app 2, unpermitted, then re-permitted app 1. In this case, the last permitted app is app 2.
            revert LibVincentUserFacet.AppNeverPermitted(msg.sender, appId, 0);
        }

        // Get the last permitted version
        // Note: lastPermittedAppVersion should never be 0 here because:
        // - If app is currently permitted, we already reverted above
        // - If app was unpermitted, unPermitAppVersion sets lastPermittedAppVersion

        // Check if the last permitted version is still enabled
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.AppVersion storage appVersion =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(agentStorage.lastPermittedAppVersion)];

        if (!appVersion.enabled) {
            revert LibVincentUserFacet.AppVersionNotEnabled(appId, agentStorage.lastPermittedAppVersion);
        }

        // Re-permit the app with the last permitted version
        appVersion.delegatedAgentAddresses.add(msg.sender);
        agentStorage.permittedAppId = appId;
        agentStorage.permittedAppVersion = agentStorage.lastPermittedAppVersion;
        agentStorage.pkpSigner = agentStorage.lastPermittedPkpSigner;
        agentStorage.pkpSignerPubKey = agentStorage.lastPermittedPkpSignerPubKey;

        // Clear the last permitted values since they're now currently permitted
        delete agentStorage.lastPermittedAppId;
        delete agentStorage.lastPermittedAppVersion;
        delete agentStorage.lastPermittedPkpSigner;
        delete agentStorage.lastPermittedPkpSignerPubKey;

        emit LibVincentUserFacet.AppVersionRePermitted(
            msg.sender,
            appId,
            agentStorage.permittedAppVersion,
            agentStorage.pkpSigner,
            agentStorage.pkpSignerPubKey
        );
    }

    /**
     * @notice Sets ability policy parameters for a specific app version
     * @dev This function allows configuring policy parameters for abilities associated with an app.
     *      It validates that the abilities, policies, and parameters exist in the app version before
     *      storing parameter values. This is the public entry point for setting parameters without
     *      changing app version permissions. Even a single Ability Policy can be updated. Also use to remove existing policies by setting them to zero from the client.
     *
     * @param appId The ID of the app
     * @param appVersion The version of the app
     * @param abilityIpfsCids Array of IPFS CIDs for abilities to configure
     * @param policyIpfsCids 2D array mapping abilities to their policies
     * @param policyParameterValues 2D array mapping parameter names to their values
     */
    function setAbilityPolicyParameters(
        uint40 appId,
        uint24 appVersion,
        string[] calldata abilityIpfsCids,
        string[][] calldata policyIpfsCids,
        bytes[][] calldata policyParameterValues
    ) external onlyRegisteredAppVersion(appId, appVersion) {
        // Allowing the User to update the Policies for Apps even if they're deleted or disabled since these flags can be toggled anytime by the App Manager so we don't want to block the User from updating the Policies.
        if (abilityIpfsCids.length == 0 || policyIpfsCids.length == 0 || policyParameterValues.length == 0) {
            revert LibVincentUserFacet.InvalidInput();
        }

        if (abilityIpfsCids.length != policyIpfsCids.length || abilityIpfsCids.length != policyParameterValues.length) {
            revert LibVincentUserFacet.AbilitiesAndPoliciesLengthMismatch();
        }

        // Check if the User has permitted the current app version
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentUserStorage.AgentStorage storage agentStorage = us_.agentAddressToAgentStorage[msg.sender];

        if (agentStorage.permittedAppVersion != appVersion) {
            revert LibVincentUserFacet.AppVersionNotPermitted(msg.sender, appId, appVersion);
        }

        _setAbilityPolicyParameters(appId, appVersion, abilityIpfsCids, policyIpfsCids, policyParameterValues);
    }

    /**
     * @notice Associates policy parameters with abilities for a given app version
     * @dev This internal function ensures that the provided abilities, policies, and parameters are valid,
     *      then stores their corresponding values in user storage. It's called by permitAppVersion and
     *      setAbilityPolicyParameters to avoid code duplication.
     *
     * @param appId The ID of the app for which policies are being set
     * @param appVersion The version of the app where the Abilities and Policies are registered
     * @param abilityIpfsCids Array of IPFS CIDs representing the abilities being configured
     * @param policyIpfsCids 2D array where each ability maps to a list of policies stored on IPFS
     * @param policyParameterValues 2D array of parameter values matching each parameter name for a policy
     */
    function _setAbilityPolicyParameters(
        uint40 appId,
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

            mapping(bytes32 => bytes) storage abilityPolicyParameterValues = us_.agentAddressToAgentStorage[msg.sender].abilityPolicyParameterValues[
                appId
            ][appVersion][hashedAbilityIpfsCid];

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
                    msg.sender,
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
