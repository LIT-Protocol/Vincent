// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";

/**
 * @title VincentAppViewFacet
 * @notice Provides view functions for accessing app-related data in the Vincent ecosystem
 * @dev Read-only facet for the Vincent Diamond contract that exposes methods to query
 *      registered apps, their versions, tools, policies, and related metadata
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
     * @notice Thrown when trying to access a redirect URI that doesn't exist
     * @param redirectUriHash The hash of the redirect URI that was not found
     */
    error RedirectUriNotFound(bytes32 redirectUriHash);

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
     * @notice Thrown when an app has no redirect URIs configured
     * @param appId The ID of the app with no redirect URIs
     */
    error NoAuthorizedRedirectUrisFoundForApp(uint256 appId);

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
     * @param name Human-readable name of the app
     * @param description Detailed description of the app
     * @param manager Address of the account that manages this app
     * @param latestVersion The most recent version number of this app
     * @param delegatees Array of addresses that are delegated to act on behalf of this app
     * @param authorizedRedirectUris Array of redirect URIs authorized for this app
     */
    struct App {
        uint256 id;
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
     * @param version Version number (1-indexed)
     * @param enabled Flag indicating if this version is currently enabled
     * @param delegatedAgentPkpTokenIds Array of Agent PKP token IDs that have permitted this version
     * @param tools Array of tools with their associated policies for this version
     */
    struct AppVersion {
        uint256 version;
        bool enabled;
        uint256[] delegatedAgentPkpTokenIds;
        Tool[] tools;
    }

    /**
     * @notice Represents a tool with its associated policies
     * @dev Used for returning tool data in view functions
     * @param toolIpfsCid IPFS CID of the tool's Lit Action
     * @param policies Array of policies associated with this tool
     */
    struct Tool {
        string toolIpfsCid;
        Policy[] policies;
    }

    /**
     * @notice Represents policy information including parameters
     * @dev Used for returning policy data in view functions
     * @param policyIpfsCid IPFS CID pointing to the policy's Lit Action
     * @param parameterNames Array of parameter names defined for this policy
     * @param parameterTypes Array of parameter types defined for this policy
     */
    struct Policy {
        string policyIpfsCid;
        string[] parameterNames;
        VincentAppStorage.ParameterType[] parameterTypes;
    }

    // ==================================================================================
    // App Registry and Enumeration Functions
    // ==================================================================================

    /**
     * @notice Returns the total count of registered apps
     * @dev Returns the current app ID counter value, which represents the total number of apps that have been registered
     * @return The total number of apps registered in the system
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
     * @dev Fetches app data from storage and formats it into the App struct
     * @param appId ID of the app to retrieve
     * @return app Detailed view of the app containing its metadata and relationships
     */
    function getAppById(uint256 appId) public view onlyRegisteredApp(appId) returns (App memory app) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage storedApp = as_.appIdToApp[appId];

        app.id = appId;
        app.name = storedApp.name;
        app.description = storedApp.description;
        app.manager = storedApp.manager;
        // App versions are 1-indexed, so the array length corresponds directly to the latest version number
        app.latestVersion = storedApp.versionedApps.length;
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
     * @dev Fetches basic app data and version-specific information from storage
     * @param appId ID of the app to retrieve
     * @param version Version number of the app to retrieve (1-indexed)
     * @return app Basic app information
     * @return appVersion Version-specific information including tools and policies
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
        VincentAppStorage.VersionedApp storage storedVersionedApp =
            storedApp.versionedApps[getVersionedAppIndex(version)];

        // Step 4: Set basic version information
        appVersion.version = version;
        appVersion.enabled = storedVersionedApp.enabled;
        appVersion.delegatedAgentPkpTokenIds = storedVersionedApp.delegatedAgentPkps.values();

        // Step 5: Prepare to access tool data
        VincentToolStorage.ToolStorage storage ts = VincentToolStorage.toolStorage();

        // Step 6: Get the number of tools for this version
        uint256 toolIpfsCidHashesLength = storedVersionedApp.toolIpfsCidHashes.length();

        // Step 7: Initialize the tools array with the appropriate size
        appVersion.tools = new Tool[](toolIpfsCidHashesLength);

        // Step 8: Iterate through each tool for this version
        for (uint256 i = 0; i < toolIpfsCidHashesLength; i++) {
            // Step 8.1: Get the tool hash and resolve to the actual IPFS CID
            bytes32 toolIpfsCidHash = storedVersionedApp.toolIpfsCidHashes.at(i);
            string memory toolIpfsCid = ts.ipfsCidHashToIpfsCid[toolIpfsCidHash];

            // Step 8.2: Set the tool IPFS CID in the return structure
            appVersion.tools[i].toolIpfsCid = toolIpfsCid;

            // Step 9: Get the policies for this specific tool
            VincentAppStorage.ToolPolicies storage toolPolicies =
                storedVersionedApp.toolIpfsCidHashToToolPolicies[toolIpfsCidHash];
            uint256 policyCount = toolPolicies.policyIpfsCidHashes.length();

            // Step 9.1: Initialize the policies array for this tool
            appVersion.tools[i].policies = new Policy[](policyCount);

            // Step 10: Iterate through each policy for this tool
            for (uint256 j = 0; j < policyCount; j++) {
                // Step 10.1: Get the policy hash and resolve to the actual IPFS CID
                bytes32 policyIpfsCidHash = toolPolicies.policyIpfsCidHashes.at(j);
                string memory policyIpfsCid = ts.ipfsCidHashToIpfsCid[policyIpfsCidHash];

                // Step 10.2: Set the policy IPFS CID in the return structure
                appVersion.tools[i].policies[j].policyIpfsCid = policyIpfsCid;

                // Step 11: Get the policy data to access parameters
                VincentAppStorage.Policy storage policy = toolPolicies.policyIpfsCidHashToPolicy[policyIpfsCidHash];

                // Step 12: Get and process the policy parameter names and types
                EnumerableSet.Bytes32Set storage policyParamNameHashes = policy.policyParameterNameHashes;
                uint256 paramCount = policyParamNameHashes.length();

                // Step 12.1: Initialize the parameter names and types arrays
                appVersion.tools[i].policies[j].parameterNames = new string[](paramCount);
                appVersion.tools[i].policies[j].parameterTypes = new VincentAppStorage.ParameterType[](paramCount);

                // Step 12.2: Iterate through each parameter name
                for (uint256 k = 0; k < paramCount; k++) {
                    // Step 12.2.1: Get the parameter name hash
                    bytes32 paramNameHash = policyParamNameHashes.at(k);

                    // Step 12.2.2: Get and set the parameter name
                    appVersion.tools[i].policies[j].parameterNames[k] = ts.policyParameterNameHashToName[paramNameHash];

                    // Step 12.2.3: Get and set the parameter type
                    appVersion.tools[i].policies[j].parameterTypes[k] =
                        policy.policyParameterNameHashToType[paramNameHash];
                }
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

    // ==================================================================================
    // Domain and Redirect URI Functions
    // ==================================================================================

    /**
     * @notice Retrieves a redirect URI from its hash
     * @dev Converts a redirect URI hash back to its original string value
     * @param redirectUriHash Hash of the redirect URI to look up
     * @return redirectUri Original redirect URI string corresponding to the hash
     */
    function getAuthorizedRedirectUriByHash(bytes32 redirectUriHash)
        external
        view
        returns (string memory redirectUri)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        redirectUri = as_.authorizedRedirectUriHashToRedirectUri[redirectUriHash];

        // Check if the redirect URI exists
        if (bytes(redirectUri).length == 0) {
            revert RedirectUriNotFound(redirectUriHash);
        }

        return redirectUri;
    }

    /**
     * @notice Retrieves authorized redirect URIs for a specific app
     * @dev Looks up all redirect URI hashes for an app and converts them to string values
     * @param appId ID of the app to query
     * @return redirectUris Array of authorized redirect URI strings for the specified app
     */
    function getAuthorizedRedirectUrisByAppId(uint256 appId)
        external
        view
        onlyRegisteredApp(appId)
        returns (string[] memory redirectUris)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // Get redirect URIs
        uint256 redirectUriCount = as_.appIdToApp[appId].authorizedRedirectUris.length();

        // Check if the app has no redirect URIs
        if (redirectUriCount == 0) {
            revert NoAuthorizedRedirectUrisFoundForApp(appId);
        }

        redirectUris = new string[](redirectUriCount);
        for (uint256 i = 0; i < redirectUriCount; i++) {
            redirectUris[i] =
                as_.authorizedRedirectUriHashToRedirectUri[as_.appIdToApp[appId].authorizedRedirectUris.at(i)];
        }
    }
}
