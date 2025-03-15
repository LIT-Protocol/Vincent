// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";

/**
 * @title VincentAppViewFacet
 * @notice Provides view functions for accessing app-related data
 * @dev Read-only facet for the Vincent Diamond contract
 */
contract VincentAppViewFacet {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // Add error declarations here
    error AppNotRegistered(uint256 appId);
    error InvalidAppVersion(uint256 appId, uint256 appVersion);

    // ==================================================================================
    // Data Structures
    // ==================================================================================

    /**
     * @notice Represents basic app information including metadata and relationships
     * @dev Used for returning app data in view functions
     */
    struct App {
        string name;
        string description;
        address manager;
        uint256 latestVersion;
        address[] delegatees;
        string[] authorizedRedirectUris;
    }

    /**
     * @notice Represents a specific version of an app with all associated data
     * @dev Extends AppView with version-specific information
     */
    struct AppVersion {
        uint256 version; // Version number
        bool enabled; // Whether this version is enabled
        string[] toolIpfsCidHashes; // Tool IPFS CIDs for this version
        uint256[] delegatedAgentPkpTokenIds; // Delegated agent PKPs for this version
    }

    /**
     * @notice Represents an app with all of its versions
     * @dev Contains the basic app information and an array of all its versions
     */
    struct AppWithVersions {
        App app;
        AppVersion[] versions;
    }

    // ==================================================================================
    // App Registry and Enumeration Functions
    // ==================================================================================

    /**
     * @notice Returns the total count of registered apps
     * @return The current app ID counter value
     */
    function getTotalAppCount() external view returns (uint256) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.appIdCounter;
    }

    // ==================================================================================
    // App Data Retrieval Functions
    // ==================================================================================

    /**
     * @notice Retrieves detailed information about an app
     * @param appId ID of the app to retrieve
     * @return app Detailed view of the app
     */
    function getAppById(uint256 appId) public view returns (App memory app) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage storedApp = as_.appIdToApp[appId];

        app.name = storedApp.name;
        app.description = storedApp.description;
        app.manager = storedApp.manager;
        // App versions are 1-indexed, so we need to explicitly check if there's at least one version
        // If no versions, latestVersion should be 0
        app.latestVersion = storedApp.versionedApps.length > 0 ? storedApp.versionedApps.length : 0;
        app.delegatees = storedApp.delegatees.values();

        // Convert authorized redirect URIs from bytes32 hashes to strings
        uint256 redirectUriCount = storedApp.authorizedRedirectUris.length();
        app.authorizedRedirectUris = new string[](redirectUriCount);
        for (uint256 i = 0; i < redirectUriCount; i++) {
            bytes32 redirectUriHash = storedApp.authorizedRedirectUris.at(i);
            app.authorizedRedirectUris[i] = as_.authorizedRedirectUriHashToRedirectUri[redirectUriHash];
        }
    }

    /**
     * @notice Retrieves detailed information about a specific version of an app
     * @param appId ID of the app to retrieve
     * @param version Version number of the app to retrieve
     * @return app Basic app information
     * @return appVersion Version-specific information
     */
    function getAppVersion(uint256 appId, uint256 version)
        public
        view
        returns (App memory app, AppVersion memory appVersion)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage storedApp = as_.appIdToApp[appId];

        app = getAppById(appId);

        // App versions start at 1, but the appVersions array is 0-indexed
        VincentAppStorage.VersionedApp storage storedVersionedApp = storedApp.versionedApps[version - 1];

        appVersion.version = version;
        appVersion.enabled = storedVersionedApp.enabled;
        appVersion.delegatedAgentPkpTokenIds = storedVersionedApp.delegatedAgentPkps.values();

        VincentToolStorage.ToolStorage storage ts = VincentToolStorage.toolStorage();

        uint256 toolIpfsCidHashesLength = storedVersionedApp.toolIpfsCidHashes.length();
        appVersion.toolIpfsCidHashes = new string[](toolIpfsCidHashesLength);
        for (uint256 i = 0; i < toolIpfsCidHashesLength; i++) {
            appVersion.toolIpfsCidHashes[i] = ts.toolIpfsCidHashToIpfsCid[storedVersionedApp.toolIpfsCidHashes.at(i)];
        }
    }

    // ==================================================================================
    // Manager-Related Functions
    // ==================================================================================

    /**
     * @notice Retrieves all apps managed by a specific address with all their versions
     * @param manager Address of the manager
     * @return appsWithVersions Array of apps with all their versions managed by the specified address
     */
    function getAppsByManager(address manager) external view returns (AppWithVersions[] memory appsWithVersions) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        uint256[] memory appIds = as_.managerAddressToAppIds[manager].values();
        uint256 appCount = appIds.length;
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
     * @param delegatee Address of the delegatee
     * @return app Detailed view of the app
     */
    function getAppByDelegatee(address delegatee) external view returns (App memory app) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        uint256 appId = as_.delegateeAddressToAppId[delegatee];
        app = getAppById(appId);
    }

    // ==================================================================================
    // Domain and Redirect URI Functions
    // ==================================================================================

    /**
     * @notice Retrieves a redirect URI from its hash
     * @param redirectUriHash Hash of the redirect URI
     * @return redirectUri Redirect URI string
     */
    function getAuthorizedRedirectUriByHash(bytes32 redirectUriHash)
        external
        view
        returns (string memory redirectUri)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        return as_.authorizedRedirectUriHashToRedirectUri[redirectUriHash];
    }

    /**
     * @notice Retrieves authorized redirect URIs for a specific app
     * @param appId ID of the app
     * @return redirectUris Array of authorized redirect URI strings
     */
    function getAuthorizedRedirectUrisByAppId(uint256 appId) external view returns (string[] memory redirectUris) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // Get redirect URIs
        uint256 redirectUriCount = as_.appIdToApp[appId].authorizedRedirectUris.length();
        redirectUris = new string[](redirectUriCount);
        for (uint256 i = 0; i < redirectUriCount; i++) {
            redirectUris[i] =
                as_.authorizedRedirectUriHashToRedirectUri[as_.appIdToApp[appId].authorizedRedirectUris.at(i)];
        }
    }
}
