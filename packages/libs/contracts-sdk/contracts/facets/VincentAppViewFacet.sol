// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";

/**
 * @title VincentAppViewFacet
 * @notice Provides view functions for accessing app-related data in the Vincent ecosystem
 * @dev Read-only facet for the Vincent Diamond contract that exposes methods to query
 *      registered apps, their versions, abilities, policies, and related metadata
 */
contract VincentAppViewFacet is VincentBase {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /**
     * @notice Thrown when trying to access a delegatee that is not registered with any app
     * @param delegatee The address of the delegatee that is not registered
     */
    error DelegateeNotRegistered(address delegatee);

    /**
     * @notice Thrown when trying to query by a zero address
     */
    error ZeroAddressNotAllowed();

    /**
     * @notice Thrown when no apps are found for the specified manager
     * @param manager The address of the manager with no apps
     */
    error NoAppsFoundForManager(address manager);

    /**
     * @notice Thrown when the offset and limit are invalid
     */
    error InvalidOffsetOrLimit();

    // ==================================================================================
    // Data Structures
    // ==================================================================================

    /**
     * @notice Represents an app with all of its versions
     * @dev Contains the basic app information and an array of all its versions
     * @param app The basic app information
     * @param versions Array of all versions of the app
     */
    struct AppWithVersions {
        App app;
        AppVersion[] versions;
    }

    /**
     * @notice Represents basic app information including metadata and relationships
     * @dev Used for returning app data in view functions
     * @param id Unique identifier for the app
     * @param isDeleted Flag indicating if the app is deleted
     * @param manager Address of the account that manages this app
     * @param latestVersion The most recent version number of this app
     * @param delegatees Array of addresses that are delegated to act on behalf of this app
     */
    struct App {
        uint256 id;
        bool isDeleted;
        address manager;
        uint256 latestVersion;
        address[] delegatees;
    }

    /**
     * @notice Represents a specific version of an app with all associated data
     * @dev Extends AppView with version-specific information
     * @param version Version number (1-indexed)
     * @param enabled Flag indicating if this version is currently enabled
     * @param delegatedAgentPkpTokenIds Array of Agent PKP token IDs that have permitted this version
     * @param abilities Array of abilities with their associated policies for this version
     */
    struct AppVersion {
        uint256 version;
        bool enabled;
        uint256[] delegatedAgentPkpTokenIds;
        Ability[] abilities;
    }

    /**
     * @notice Represents an ability with its associated policies
     * @dev Used for returning ability data in view functions
     * @param abilityIpfsCid IPFS CID of the ability's Lit Action
     * @param policies Array of policies associated with this ability
     */
    struct Ability {
        string abilityIpfsCid;
        string[] policyIpfsCids;
    }

    // ==================================================================================
    // App Data Retrieval Functions
    // ==================================================================================

    /**
     * @notice Retrieves detailed information about an app
     * @dev Fetches app data from storage and formats it into the App struct
     * @dev This function will revert if the app isn't registered
     * @param appId ID of the app to retrieve
     * @return app Detailed view of the app containing its metadata and relationships
     */
    function getAppById(uint256 appId) public view onlyRegisteredApp(appId) returns (App memory app) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage storedApp = as_.appIdToApp[appId];

        app.id = appId;
        app.isDeleted = storedApp.isDeleted;
        app.manager = storedApp.manager;
        // App versions are 1-indexed, so the array length corresponds directly to the latest version number
        app.latestVersion = storedApp.appVersions.length;
        app.delegatees = storedApp.delegatees.values();
    }

    /**
     * @notice Retrieves the delegatedAgentPkpTokenIds with an offset and limit
     * @param appId ID of the app to retrieve
     * @param version Version number of the app to retrieve (1-indexed)
     * @param offset The offset of the first token ID to retrieve
     * @param limit The maximum number of token IDs to retrieve
     * @return delegatedAgentPkpTokenIds Array of delegated agent PKP token IDs
     */
    function getDelegatedAgentPkpTokenIds(uint256 appId, uint256 version, uint256 offset, uint256 limit) external view onlyRegisteredAppVersion(appId, version) returns (uint256[] memory delegatedAgentPkpTokenIds) {
        VincentAppStorage.AppVersion storage versionedApp =
            VincentAppStorage.appStorage().appIdToApp[appId].appVersions[getAppVersionIndex(version)];

        if (limit == 0 || offset + limit > versionedApp.delegatedAgentPkps.length()) {
            revert InvalidOffsetOrLimit();
        }

        delegatedAgentPkpTokenIds = new uint256[](limit);
        for (uint256 i = 0; i < limit; i++) {
            delegatedAgentPkpTokenIds[i] = versionedApp.delegatedAgentPkps.at(offset + i);
        }
    }

    /**
     * @notice Retrieves detailed information about a specific version of an app
     * @dev Fetches basic app data and version-specific information from storage
     * @param appId ID of the app to retrieve
     * @param version Version number of the app to retrieve (1-indexed)
     * @return app Basic app information
     * @return appVersion Version-specific information including abilities and policies
     */
    function getAppVersion(uint256 appId, uint256 version)
        public
        view
        onlyRegisteredAppVersion(appId, version)
        returns (App memory app, AppVersion memory appVersion)
    {
        // Step 1: Access storage and get app data
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage storedApp = as_.appIdToApp[appId];

        // Step 2: Retrieve basic app information
        app = getAppById(appId);

        // Step 3: Retrieve the specific version data
        VincentAppStorage.AppVersion storage storedVersionedApp =
            storedApp.appVersions[getAppVersionIndex(version)];

        // Step 4: Set basic version information
        appVersion.version = version;
        appVersion.enabled = storedVersionedApp.enabled;
        appVersion.delegatedAgentPkpTokenIds = storedVersionedApp.delegatedAgentPkps.values();

        // Step 5: Prepare to access ability data
        VincentLitActionStorage.LitActionStorage storage ls = VincentLitActionStorage.litActionStorage();

        // Step 6: Get the number of abilities for this version
        uint256 abilityIpfsCidHashesLength = storedVersionedApp.abilityIpfsCidHashes.length();

        // Step 7: Initialize the abilities array with the appropriate size
        appVersion.abilities = new Ability[](abilityIpfsCidHashesLength);

        // Step 8: Iterate through each ability for this version
        for (uint256 i = 0; i < abilityIpfsCidHashesLength; i++) {
            // Step 8.1: Get the ability hash and resolve to the actual IPFS CID
            bytes32 abilityIpfsCidHash = storedVersionedApp.abilityIpfsCidHashes.at(i);
            string memory abilityIpfsCid = ls.ipfsCidHashToIpfsCid[abilityIpfsCidHash];

            // Step 8.2: Set the ability IPFS CID in the return structure
            appVersion.abilities[i].abilityIpfsCid = abilityIpfsCid;

            // Step 9: Get the policies for this specific ability
            EnumerableSet.Bytes32Set storage abilityPolicyIpfsCidHashes =
                storedVersionedApp.abilityIpfsCidHashToAbilityPolicyIpfsCidHashes[abilityIpfsCidHash];
            uint256 policyCount = abilityPolicyIpfsCidHashes.length();

            // Step 9.1: Initialize the policies array for this ability
            appVersion.abilities[i].policyIpfsCids = new string[](policyCount);

            // Step 10: Iterate through each policy for this ability
            for (uint256 j = 0; j < policyCount; j++) {
                // Step 10.1: Get the policy hash and resolve to the actual IPFS CID
                bytes32 policyIpfsCidHash = abilityPolicyIpfsCidHashes.at(j);
                string memory policyIpfsCid = ls.ipfsCidHashToIpfsCid[policyIpfsCidHash];

                // Step 10.2: Set the policy IPFS CID in the return structure
                appVersion.abilities[i].policyIpfsCids[j] = policyIpfsCid;
            }
        }
    }

    // ==================================================================================
    // Manager-Related Functions
    // ==================================================================================

    /**
     * @notice Retrieves all apps managed by a specific address with all their versions
     * @dev Finds all apps associated with the manager address and loads their complete data including versions
     * @param manager Address of the manager to query
     * @return appsWithVersions Array of apps with all their versions managed by the specified address
     */
    function getAppsByManager(address manager) external view returns (AppWithVersions[] memory appsWithVersions) {
        // Check for zero address
        if (manager == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        uint256[] memory appIds = as_.managerAddressToAppIds[manager].values();
        uint256 appCount = appIds.length;

        // Check if the manager has any apps
        if (appCount == 0) {
            revert NoAppsFoundForManager(manager);
        }

        appsWithVersions = new AppWithVersions[](appCount);

        for (uint256 i = 0; i < appCount; i++) {
            // Get the app view
            App memory app = getAppById(appIds[i]);
            appsWithVersions[i].app = app;

            // Get all versions for this app
            uint256 versionCount = app.latestVersion;

            // Only create version arrays for apps that have versions
            if (versionCount > 0) {
                appsWithVersions[i].versions = new AppVersion[](versionCount);

                for (uint256 j = 0; j < versionCount; j++) {
                    // Versions are 1-indexed in the contract
                    uint256 versionNumber = j + 1;
                    (, appsWithVersions[i].versions[j]) = getAppVersion(appIds[i], versionNumber);
                }
            } else {
                // For apps with no versions, initialize an empty array
                appsWithVersions[i].versions = new AppVersion[](0);
            }
        }
    }

    // ==================================================================================
    // Delegatee-Related Functions
    // ==================================================================================

    /**
     * @notice Retrieves the app by a delegatee address
     * @dev Looks up the app ID associated with a delegatee address and returns the app data
     * @param delegatee Address of the delegatee
     * @return app Detailed view of the app the delegatee is associated with
     */
    function getAppByDelegatee(address delegatee) external view returns (App memory app) {
        // Check for zero address
        if (delegatee == address(0)) {
            revert ZeroAddressNotAllowed();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        uint256 appId = as_.delegateeAddressToAppId[delegatee];

        // If appId is 0, delegatee is not associated with any app, revert
        if (appId == 0) {
            revert DelegateeNotRegistered(delegatee);
        }

        // Otherwise, get the app data
        app = getAppById(appId);
    }
}
