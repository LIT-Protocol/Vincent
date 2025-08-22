// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";

/**
 * @title VincentUserViewFacet
 * @dev View functions for user-related data stored in the VincentUserStorage
 */
contract VincentUserViewFacet is VincentBase {
    using VincentUserStorage for VincentUserStorage.UserStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    uint256 public constant AGENT_PAGE_SIZE = 50;

    /**
     * @notice Thrown when a PKP is not permitted for a specific app version
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @param appVersion The app version
     */
    error PkpNotPermittedForAppVersion(uint256 pkpTokenId, uint40 appId, uint24 appVersion);

    /**
     * @notice Thrown when a policy parameter is not set for a PKP
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @param appVersion The app version
     * @param policyIpfsCid The policy IPFS CID
     * @param parameterName The parameter name
     */
    error PolicyParameterNotSetForPkp(
        uint256 pkpTokenId, uint40 appId, uint24 appVersion, string policyIpfsCid, string parameterName
    );

    /**
     * @notice Thrown when a delegatee is not associated with any app
     * @param delegatee The delegatee address
     */
    error DelegateeNotAssociatedWithApp(address delegatee);

    /**
     * @notice Thrown when an invalid PKP token ID is provided
     */
    error InvalidPkpTokenId();

    /**
     * @notice Thrown when an invalid app ID is provided
     */
    error InvalidAppId();

    /**
     * @notice Thrown when an empty ability IPFS CID is provided
     * @notice Thrown when an empty ability IPFS CID is provided
     */
    error EmptyAbilityIpfsCid();

    /**
     * @notice Thrown when a zero address is provided
     */
    error ZeroAddressNotAllowed();

    /**
     * @notice Thrown when no registered PKPs are found for a user
     * @param userAddress The user address
     */
    error NoRegisteredPkpsFound(address userAddress);

    // Struct to hold the result of ability execution validation and policy retrieval
    struct AbilityExecutionValidation {
        bool isPermitted; // Whether the delegatee is permitted to use the PKP to execute the ability
        uint40 appId; // The ID of the app associated with the delegatee
        uint24 appVersion; // The permitted app version
        PolicyWithParameters[] policies; // All policies with their parameters
    }

    // Struct to represent an ability with all its policies and parameters
    struct AbilityWithPolicies {
        string abilityIpfsCid; // The IPFS CID of the ability
        PolicyWithParameters[] policies; // All policies associated with this ability and their parameters
    }

    // Struct to represent a policy with its parameters
    struct PolicyWithParameters {
        string policyIpfsCid;
        bytes policyParameterValues;
    }

    /**
     * @notice Represents permitted app information for a PKP
     * @dev Contains app ID, permitted version, and whether that version is enabled
     * @param appId The ID of the permitted app
     * @param version The permitted version of the app
     * @param versionEnabled Whether the permitted version is currently enabled
     */
    struct PermittedApp {
        uint40 appId;
        uint24 version;
        bool versionEnabled;
    }

    /**
     * @notice Represents the result for a single PKP's complete app data
     * @dev Contains both currently permitted apps and historical unpermitted apps with their last permitted versions
     * @param pkpTokenId The PKP token ID
     * @param permittedApps Array of currently permitted apps with full details
     * @param historicalApps Array of previously permitted apps with their last permitted versions and enabled status
     */
    struct PkpPermittedApps {
        uint256 pkpTokenId;
        PermittedApp[] permittedApps;
        PermittedApp[] historicalApps;
    }

    /**
     * @dev Gets all PKP tokens that are registered as agents in the system with pagination support
     * @param userAddress The address of the user to query
     * @param offset The offset of the first PKP token ID to retrieve
     * @return An array of PKP token IDs that are registered as agents
     */
    function getAllRegisteredAgentPkps(address userAddress, uint256 offset) external view returns (uint256[] memory) {
        if (userAddress == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        EnumerableSet.UintSet storage pkpSet = us_.userAddressToRegisteredAgentPkps[userAddress];
        uint256 length = pkpSet.length();

        if (length == 0) {
            revert NoRegisteredPkpsFound(userAddress);
        }

        if (offset >= length) {
            revert InvalidOffset(offset, length);
        }

        uint256 end = offset + AGENT_PAGE_SIZE;
        if (end > length) {
            end = length;
        }

        uint256 resultCount = end - offset;
        uint256[] memory pkps = new uint256[](resultCount);

        for (uint256 i = offset; i < end; i++) {
            pkps[i - offset] = pkpSet.at(i);
        }

        return pkps;
    }

    /**
     * @notice Gets app version information for a specific app and PKP token
     * @dev Returns the app version (either currently permitted or last permitted) and whether it's currently active
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @return version The app version (current if permitted, last if unpermitted)
     * @return isCurrentlyPermitted Whether this version is currently permitted (true) or historical (false)
     * @return versionEnabled Whether the app version is currently enabled by the app manager
     */
    function getPermittedAppVersionForPkp(uint256 pkpTokenId, uint40 appId)
        external
        view
        appNotDeleted(appId)
        returns (uint24 version, bool isCurrentlyPermitted, bool versionEnabled)
    {
        // Check for invalid PKP token ID and app ID
        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        if (appId == 0) {
            revert InvalidAppId();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
        
        version = agentStorage.permittedAppVersion[appId];
        isCurrentlyPermitted = agentStorage.permittedApps.contains(appId);
        
        if (version > 0) {
            versionEnabled = as_.appIdToApp[appId].appVersions[getAppVersionIndex(version)].enabled;
        } else {
            versionEnabled = false;
        }
        
        return (version, isCurrentlyPermitted, versionEnabled);
    }

    /**
     * @notice Retrieves permitted apps for multiple PKPs with pagination and optional historical data
     * @dev Takes an array of PKP token IDs and returns currently permitted apps and optionally historical apps
     * @param pkpTokenIds Array of PKP token IDs to query
     * @param offset The offset of the first app to retrieve for each PKP
     * @param includeHistorical Whether to include historical apps that are no longer permitted
     * @return results Array of PkpPermittedApps structs with split permitted/historical data
     */
    function getPermittedAppsForPkps(
        uint256[] memory pkpTokenIds, 
        uint256 offset,
        bool includeHistorical
    )
        public 
        view 
        returns (PkpPermittedApps[] memory results) 
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        
        results = new PkpPermittedApps[](pkpTokenIds.length);
        
        for (uint256 i = 0; i < pkpTokenIds.length; i++) {
            uint256 pkpTokenId = pkpTokenIds[i];
            
            if (pkpTokenId == 0) {
                revert InvalidPkpTokenId();
            }
            
            VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
            EnumerableSet.UintSet storage allApps = agentStorage.allPermittedApps;
            EnumerableSet.UintSet storage permittedApps = agentStorage.permittedApps;
            
            // Choose which set to iterate over based on includeHistorical flag
            EnumerableSet.UintSet storage appsToIterate = includeHistorical ? allApps : permittedApps;
            uint256 appCount = appsToIterate.length();
            
            // Separate permitted and historical apps (exclude deleted apps from both)
            PermittedApp[] memory tempPermittedApps = new PermittedApp[](appCount);
            PermittedApp[] memory tempHistoricalApps = includeHistorical ? new PermittedApp[](appCount) : new PermittedApp[](0);
            uint256 permittedCount = 0;
            uint256 historicalCount = 0;
            
            for (uint256 j = 0; j < appCount; j++) {
                uint40 appId = uint40(appsToIterate.at(j));
                if (!as_.appIdToApp[appId].isDeleted) {
                    // This is a redundant check when includeHistorical is false,
                    // but this check requires minimal gas/effort
                    if (permittedApps.contains(appId)) {
                        // Add to permitted apps with full details
                        uint24 version = agentStorage.permittedAppVersion[appId];
                        bool enabled = as_.appIdToApp[appId].appVersions[getAppVersionIndex(version)].enabled;
                        tempPermittedApps[permittedCount] = PermittedApp({
                            appId: appId,
                            version: version,
                            versionEnabled: enabled
                        });
                        permittedCount++;
                    } else if (includeHistorical) {
                        // Add to historical apps with last permitted version info (only if requested)
                        uint24 lastVersion = agentStorage.permittedAppVersion[appId];
                        bool enabled = as_.appIdToApp[appId].appVersions[getAppVersionIndex(lastVersion)].enabled;
                        tempHistoricalApps[historicalCount] = PermittedApp({
                            appId: appId,
                            version: lastVersion,
                            versionEnabled: enabled
                        });
                        historicalCount++;
                    }
                }
            }
            
            // Apply pagination separately to permitted and historical apps
            
            // Paginate permitted apps
            uint256 permittedStart = offset;
            uint256 permittedEnd = offset + AGENT_PAGE_SIZE;
            if (permittedStart >= permittedCount) {
                // Offset beyond available permitted apps
                results[i].permittedApps = new PermittedApp[](0);
            } else {
                if (permittedEnd > permittedCount) {
                    permittedEnd = permittedCount;
                }
                uint256 permittedResultCount = permittedEnd - permittedStart;
                results[i].permittedApps = new PermittedApp[](permittedResultCount);
                for (uint256 k = 0; k < permittedResultCount; k++) {
                    results[i].permittedApps[k] = tempPermittedApps[permittedStart + k];
                }
            }
            
            // Paginate historical apps (only if requested)
            if (includeHistorical) {
                uint256 historicalStart = offset;
                uint256 historicalEnd = offset + AGENT_PAGE_SIZE;
                if (historicalStart >= historicalCount) {
                    // Offset beyond available historical apps
                    results[i].historicalApps = new PermittedApp[](0);
                } else {
                    if (historicalEnd > historicalCount) {
                        historicalEnd = historicalCount;
                    }
                    uint256 historicalResultCount = historicalEnd - historicalStart;
                    results[i].historicalApps = new PermittedApp[](historicalResultCount);
                    for (uint256 k = 0; k < historicalResultCount; k++) {
                        results[i].historicalApps[k] = tempHistoricalApps[historicalStart + k];
                    }
                }
            } else {
                // Return empty historical apps array when not requested
                results[i].historicalApps = new PermittedApp[](0);
            }
            
            results[i].pkpTokenId = pkpTokenId;
        }
    }

    /**
     * @dev Gets all permitted abilities, policies, and policy parameters for a specific app and PKP
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @return abilities An array of abilities with their policies and parameters
     */
    function getAllAbilitiesAndPoliciesForApp(uint256 pkpTokenId, uint40 appId)
        external
        view
        returns (AbilityWithPolicies[] memory abilities)
    {
        // Check for invalid PKP token ID and app ID
        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        if (appId == 0) {
            revert InvalidAppId();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        if (as_.appIdToApp[appId].isDeleted) {
            revert AppHasBeenDeleted(appId);
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();

        // Get the permitted app version for this PKP and app
        uint24 appVersion = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];

        // If no version is permitted (appVersion == 0), return an empty array
        if (appVersion == 0) {
            return new AbilityWithPolicies[](0);
        }

        // Get the app version
        VincentAppStorage.AppVersion storage versionedApp =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        // Get all ability hashes for this app version
        bytes32[] memory abilityHashes = versionedApp.abilityIpfsCidHashes.values();
        uint256 abilityCount = abilityHashes.length;

        // Create the result array
        abilities = new AbilityWithPolicies[](abilityCount);

        // For each ability, get its policies and parameters
        for (uint256 i = 0; i < abilityCount; i++) {
            bytes32 abilityHash = abilityHashes[i];
            abilities[i] = _getAbilityWithPolicies(abilityHash, pkpTokenId, appId, appVersion, versionedApp, us_, ls_);
        }

        return abilities;
    }

    /**
     * @dev Validates if a delegatee is permitted to execute an ability with a PKP and returns all relevant policies
     * @param delegatee The address of the delegatee
     * @param pkpTokenId The PKP token ID
     * @param abilityIpfsCid The IPFS CID of the ability
     * @return validation A struct containing validation result and policy information
     */
    function validateAbilityExecutionAndGetPolicies(address delegatee, uint256 pkpTokenId, string calldata abilityIpfsCid)
        external
        view
        returns (AbilityExecutionValidation memory validation)
    {
        // Check for invalid inputs
        if (delegatee == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        if (bytes(abilityIpfsCid).length == 0) {
            revert EmptyAbilityIpfsCid();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();

        // Initialize the validation result
        validation.isPermitted = false;

        // Get the app ID that the delegatee belongs to
        uint40 appId = as_.delegateeAddressToAppId[delegatee];
        validation.appId = appId;

        // If appId is 0, delegatee is not associated with any app
        if (appId == 0) {
            revert DelegateeNotAssociatedWithApp(delegatee);
        }

        if (as_.appIdToApp[appId].isDeleted) {
            revert AppHasBeenDeleted(appId);
        }

        // Hash the ability IPFS CID once to avoid repeated hashing
        bytes32 hashedAbilityIpfsCid = keccak256(abi.encodePacked(abilityIpfsCid));

        // Get the permitted app version for this PKP and app
        VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
        uint24 appVersion = agentStorage.permittedAppVersion[appId];

        // If no version is permitted (appVersion == 0) or app is not currently permitted, return early with isPermitted = false
        if (appVersion == 0 || !agentStorage.permittedApps.contains(appId)) {
            return validation;
        }

        validation.appVersion = appVersion;

        // Check if the app version is enabled and the ability is registered for this app version
        VincentAppStorage.AppVersion storage versionedApp =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        if (!versionedApp.enabled || !versionedApp.abilityIpfsCidHashes.contains(hashedAbilityIpfsCid)) {
            return validation;
        }

        // If we've reached here, the ability is permitted
        validation.isPermitted = true;

        // Get all policies registered for this ability in the app version
        EnumerableSet.Bytes32Set storage abilityPolicyIpfsCidHashes =
            versionedApp.abilityIpfsCidHashToAbilityPolicyIpfsCidHashes[hashedAbilityIpfsCid];

        // Get all policy hashes for this ability from the app version
        bytes32[] memory allPolicyHashes = abilityPolicyIpfsCidHashes.values();
        uint256 policyCount = allPolicyHashes.length;

        // Create the policies array
        validation.policies = new PolicyWithParameters[](policyCount);

        // Get the ability policy storage for this PKP, app, app version, and ability
        mapping(bytes32 => bytes) storage abilityPolicyParameterValues =
            us_.agentPkpTokenIdToAgentStorage[pkpTokenId].abilityPolicyParameterValues[appId][appVersion][hashedAbilityIpfsCid];

        // For each policy, get all its parameters
        for (uint256 i = 0; i < policyCount; i++) {
            bytes32 policyHash = allPolicyHashes[i];

            // Get the policy IPFS CID
            validation.policies[i].policyIpfsCid = ls_.ipfsCidHashToIpfsCid[policyHash];
            validation.policies[i].policyParameterValues = abilityPolicyParameterValues[policyHash];
        }

        return validation;
    }

         /**
     * @dev Internal function to get an ability with its policies and parameters
     * @param abilityHash The hash of the ability IPFS CID
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @param appVersion The app version
     * @param versionedApp The versioned app storage
     * @param us_ The user storage
     * @param ls_ The lit action storage
     * @return abilityWithPolicies The ability with its policies and parameters
     */
    function _getAbilityWithPolicies(
        bytes32 abilityHash,
        uint256 pkpTokenId,
        uint40 appId,
        uint24 appVersion,
        VincentAppStorage.AppVersion storage versionedApp,
        VincentUserStorage.UserStorage storage us_,
        VincentLitActionStorage.LitActionStorage storage ls_
    ) internal view returns (AbilityWithPolicies memory abilityWithPolicies) {
        // Get the ability IPFS CID
        abilityWithPolicies.abilityIpfsCid = ls_.ipfsCidHashToIpfsCid[abilityHash];

        // Get all policies registered for this ability in the app version
        EnumerableSet.Bytes32Set storage abilityPolicyIpfsCidHashes =
            versionedApp.abilityIpfsCidHashToAbilityPolicyIpfsCidHashes[abilityHash];

        // Get all policy hashes for this ability from the app version
        bytes32[] memory allPolicyHashes = abilityPolicyIpfsCidHashes.values();
        uint256 policyCount = allPolicyHashes.length;

        // Create the policies array for this ability
        abilityWithPolicies.policies = new PolicyWithParameters[](policyCount);

        // Get the ability policy storage for this PKP, app, and ability
        mapping(bytes32 => bytes) storage abilityPolicyParameterValues =
            us_.agentPkpTokenIdToAgentStorage[pkpTokenId].abilityPolicyParameterValues[appId][appVersion][abilityHash];

        // For each policy, get all its parameters
        for (uint256 i = 0; i < policyCount; i++) {
            bytes32 policyHash = allPolicyHashes[i];
            abilityWithPolicies.policies[i].policyIpfsCid = ls_.ipfsCidHashToIpfsCid[policyHash];
            abilityWithPolicies.policies[i].policyParameterValues = abilityPolicyParameterValues[policyHash];
        }
    }

}
