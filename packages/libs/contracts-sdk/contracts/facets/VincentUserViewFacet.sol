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
     * @param isDeleted Whether the app has been deleted
     */
    struct PermittedApp {
        uint40 appId;
        uint24 version;
        bool versionEnabled;
        bool isDeleted;
    }

    /**
     * @notice Represents unpermitted app information for a PKP
     * @dev Contains app ID, last permitted version, and whether that version is enabled
     * @param appId The ID of the unpermitted app
     * @param previousPermittedVersion The last permitted version before unpermitting
     * @param versionEnabled Whether the previous permitted version is currently enabled
     * @param isDeleted Whether the app has been deleted
     */
    struct UnpermittedApp {
        uint40 appId;
        uint24 previousPermittedVersion;
        bool versionEnabled;
        bool isDeleted;
    }

    /**
     * @notice Represents the result for a single PKP's permitted app data
     * @dev Contains currently permitted apps with their version details
     * @param pkpTokenId The PKP token ID
     * @param permittedApps Array of currently permitted apps with full details
     */
    struct PkpPermittedApps {
        uint256 pkpTokenId;
        PermittedApp[] permittedApps;
    }

    /**
     * @notice Represents the result for a single PKP's unpermitted app data
     * @dev Contains previously permitted apps that are now unpermitted
     * @param pkpTokenId The PKP token ID
     * @param unpermittedApps Array of unpermitted apps with their last permitted version details
     */
    struct PkpUnpermittedApps {
        uint256 pkpTokenId;
        UnpermittedApp[] unpermittedApps;
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
     * @dev Gets the permitted app version for a specific app and PKP token, even if the app has been deleted
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @return The permitted app version for the PKP token and app
     */
    function getPermittedAppVersionForPkp(uint256 pkpTokenId, uint40 appId) external view returns (uint24) {
        // Check for invalid PKP token ID and app ID
        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        if (appId == 0) {
            revert InvalidAppId();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        return us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];
    }

    /**
     * @notice Gets the last permitted app version for a specific app and PKP token
     * @dev Returns the last version that was permitted before unpermitting, or 0 if never permitted
     * @param pkpTokenId The PKP token ID
     * @param appId The app ID
     * @return The last permitted app version
     */
    function getLastPermittedAppVersionForPkp(uint256 pkpTokenId, uint40 appId) external view returns (uint24) {
        // Check for invalid PKP token ID and app ID
        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        if (appId == 0) {
            revert InvalidAppId();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        return us_.agentPkpTokenIdToAgentStorage[pkpTokenId].lastPermittedVersion[appId];
    }

    /**
     * @notice DEPRECATED: Use {getPermittedAppsForPkps} instead. This function will be removed in future releases.
     * @dev Gets all app IDs that have permissions for a specific PKP token, including deleted apps, with pagination support.
     * @dev Migration guidance: Replace calls to this function with {getPermittedAppsForPkps}, which returns both app IDs and their permitted versions for a PKP token. Update your code to handle the new return type and logic as needed.
     * @param pkpTokenId The PKP token ID
     * @param offset The offset of the first app ID to retrieve
     * @return An array of app IDs that have permissions for the PKP token (including deleted apps)
     */
    function getAllPermittedAppIdsForPkp(uint256 pkpTokenId, uint256 offset) external view returns (uint40[] memory) {
        if (pkpTokenId == 0) {
            revert InvalidPkpTokenId();
        }

        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();

        EnumerableSet.UintSet storage permittedAppSet = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedApps;
        uint256 permittedAppCount = permittedAppSet.length();

        if (permittedAppCount == 0) {
            return new uint40[](0);
        }

        if (offset >= permittedAppCount) {
            revert InvalidOffset(offset, permittedAppCount);
        }

        uint256 end = offset + AGENT_PAGE_SIZE;
        if (end > permittedAppCount) {
            end = permittedAppCount;
        }

        uint256 resultCount = end - offset;
        uint40[] memory result = new uint40[](resultCount);

        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = uint40(permittedAppSet.at(i));
        }

        return result;
    }

    /**
     * @notice Retrieves permitted apps for multiple PKPs with pagination
     * @dev Takes an array of PKP token IDs and returns currently permitted apps with their version details
     * @param pkpTokenIds Array of PKP token IDs to query
     * @param offset The offset of the first app to retrieve for each PKP
     * @param pageSize The maximum number of apps to return per PKP
     * @return results Array of PkpPermittedApps structs containing permitted app data
     */
    function getPermittedAppsForPkps(uint256[] memory pkpTokenIds, uint256 offset, uint256 pageSize)
        external
        view
        returns (PkpPermittedApps[] memory results)
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        results = new PkpPermittedApps[](pkpTokenIds.length);

        for (uint256 i; i < pkpTokenIds.length; i++) {
            uint256 pkpTokenId = pkpTokenIds[i];

            if (pkpTokenId == 0) {
                revert InvalidPkpTokenId();
            }

            VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
            EnumerableSet.UintSet storage permittedApps = agentStorage.permittedApps;
            uint256 appCount = permittedApps.length();

            // Collect all permitted apps including deleted ones
            PermittedApp[] memory tempPermittedApps = new PermittedApp[](appCount);

            for (uint256 j; j < appCount; j++) {
                uint40 appId = uint40(permittedApps.at(j));
                // Get version details for the permitted app
                uint24 version = agentStorage.permittedAppVersion[appId];
                bool enabled = as_.appIdToApp[appId].appVersions[getAppVersionIndex(version)].enabled;
                bool isDeleted = as_.appIdToApp[appId].isDeleted;
                tempPermittedApps[j] =
                    PermittedApp({appId: appId, version: version, versionEnabled: enabled, isDeleted: isDeleted});
            }

            // Apply pagination
            uint256 resultCount;
            if (offset < appCount) {
                uint256 end = offset + pageSize > appCount ? appCount : offset + pageSize;
                resultCount = end - offset;
            }

            results[i].permittedApps = new PermittedApp[](resultCount);
            for (uint256 k; k < resultCount; k++) {
                results[i].permittedApps[k] = tempPermittedApps[offset + k];
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
     * @dev Checks if a delegatee is permitted to execute an ability with a PKP
     * @param delegatee The address of the delegatee
     * @param pkpTokenId The PKP token ID
     * @param abilityIpfsCid The IPFS CID of the ability
     * @return isPermitted Whether the delegatee is permitted to execute the ability
     */
    function isDelegateePermitted(address delegatee, uint256 pkpTokenId, string calldata abilityIpfsCid)
        external
        view
        returns (bool isPermitted)
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

        // Get the app ID that the delegatee belongs to
        uint40 appId = as_.delegateeAddressToAppId[delegatee];

        // If appId is 0, delegatee is not associated with any app
        if (appId == 0) {
            revert DelegateeNotAssociatedWithApp(delegatee);
        }

        if (as_.appIdToApp[appId].isDeleted) {
            revert AppHasBeenDeleted(appId);
        }

        // Hash the ability IPFS CID
        bytes32 hashedAbilityIpfsCid = keccak256(abi.encodePacked(abilityIpfsCid));

        // Get the permitted app version for this PKP and app
        uint24 appVersion = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];

        // If no version is permitted (appVersion == 0), return false
        if (appVersion == 0) {
            return false;
        }

        // Check if the app version is enabled and the ability is registered for this app version
        VincentAppStorage.AppVersion storage versionedApp =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        // Return true only if version is enabled AND ability is registered
        return versionedApp.enabled && versionedApp.abilityIpfsCidHashes.contains(hashedAbilityIpfsCid);
    }

    /**
     * @dev Validates if a delegatee is permitted to execute an ability with a PKP and returns all relevant policies
     * @param delegatee The address of the delegatee
     * @param pkpTokenId The PKP token ID
     * @param abilityIpfsCid The IPFS CID of the ability
     * @return validation A struct containing validation result and policy information
     */
    function validateAbilityExecutionAndGetPolicies(
        address delegatee,
        uint256 pkpTokenId,
        string calldata abilityIpfsCid
    ) external view returns (AbilityExecutionValidation memory validation) {
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
        uint24 appVersion = us_.agentPkpTokenIdToAgentStorage[pkpTokenId].permittedAppVersion[appId];

        // If no version is permitted (appVersion == 0), return early with isPermitted = false
        if (appVersion == 0) {
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
        mapping(bytes32 => bytes) storage abilityPolicyParameterValues = us_.agentPkpTokenIdToAgentStorage[pkpTokenId]
        .abilityPolicyParameterValues[appId][appVersion][hashedAbilityIpfsCid];

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
     * @notice Retrieves unpermitted apps for multiple PKPs with pagination
     * @dev Returns apps that are in allPermittedApps but not in permittedApps (previously permitted, now unpermitted)
     * @param pkpTokenIds Array of PKP token IDs to query
     * @param offset The offset of the first app to retrieve for each PKP
     * @return results Array of PkpUnpermittedApps structs containing unpermitted app data
     */
    function getUnpermittedAppsForPkps(uint256[] memory pkpTokenIds, uint256 offset)
        public
        view
        returns (PkpUnpermittedApps[] memory results)
    {
        VincentUserStorage.UserStorage storage us_ = VincentUserStorage.userStorage();
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        results = new PkpUnpermittedApps[](pkpTokenIds.length);

        for (uint256 i; i < pkpTokenIds.length; i++) {
            uint256 pkpTokenId = pkpTokenIds[i];

            if (pkpTokenId == 0) {
                revert InvalidPkpTokenId();
            }

            results[i].pkpTokenId = pkpTokenId;

            VincentUserStorage.AgentStorage storage agentStorage = us_.agentPkpTokenIdToAgentStorage[pkpTokenId];
            uint256 allAppCount = agentStorage.allPermittedApps.length();

            // Collect all unpermitted apps including deleted ones
            UnpermittedApp[] memory tempUnpermittedApps = new UnpermittedApp[](allAppCount);
            uint256 unpermittedCount;

            for (uint256 j; j < allAppCount; j++) {
                uint40 appId = uint40(agentStorage.allPermittedApps.at(j));
                if (!agentStorage.permittedApps.contains(appId)) {
                    uint24 lastPermittedVersion = agentStorage.lastPermittedVersion[appId];
                    bool enabled = as_.appIdToApp[appId].appVersions[getAppVersionIndex(lastPermittedVersion)].enabled;
                    bool isDeleted = as_.appIdToApp[appId].isDeleted;

                    tempUnpermittedApps[unpermittedCount] = UnpermittedApp({
                        appId: appId,
                        previousPermittedVersion: lastPermittedVersion,
                        versionEnabled: enabled,
                        isDeleted: isDeleted
                    });
                    unpermittedCount++;
                }
            }

            // Apply pagination
            uint256 resultCount;
            if (offset < unpermittedCount) {
                uint256 end = offset + AGENT_PAGE_SIZE > unpermittedCount ? unpermittedCount : offset + AGENT_PAGE_SIZE;
                resultCount = end - offset;
            }

            results[i].unpermittedApps = new UnpermittedApp[](resultCount);
            for (uint256 k; k < resultCount; k++) {
                results[i].unpermittedApps[k] = tempUnpermittedApps[offset + k];
            }
        }
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
