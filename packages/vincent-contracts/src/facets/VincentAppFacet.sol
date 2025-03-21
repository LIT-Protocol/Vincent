// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";

/**
 * @title VincentAppFacet
 * @notice A facet of the Vincent Diamond that manages application registration and configuration
 * @dev This contract allows registration of apps, app versions, redirect URIs, and delegatees
 */
contract VincentAppFacet is VincentBase {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /**
     * @notice Emitted when a new app is registered
     * @param appId Unique identifier for the newly registered app
     * @param manager Address of the app manager
     */
    event NewAppRegistered(uint256 indexed appId, address indexed manager);

    /**
     * @notice Emitted when a new app version is registered
     * @param appId ID of the app for which a new version is registered
     * @param appVersion Version number of the newly registered app version
     * @param manager Address of the app manager who registered the new version
     */
    event NewAppVersionRegistered(uint256 indexed appId, uint256 indexed appVersion, address indexed manager);

    /**
     * @notice Emitted when an app version's enabled status is changed
     * @param appId ID of the app
     * @param appVersion Version number of the app being enabled/disabled
     * @param enabled New enabled status of the app version
     */
    event AppEnabled(uint256 indexed appId, uint256 indexed appVersion, bool indexed enabled);

    /**
     * @notice Emitted when a new authorized redirect URI is added to an app
     * @param appId ID of the app
     * @param hashedRedirectUri The keccak256 hash of the redirect URI that was added.
     *                          Original value can be retrieved using VincentAppViewFacet
     */
    event AuthorizedRedirectUriAdded(uint256 indexed appId, bytes32 indexed hashedRedirectUri);

    /**
     * @notice Emitted when an authorized redirect URI is removed from an app
     * @param appId ID of the app
     * @param hashedRedirectUri The keccak256 hash of the redirect URI that was removed.
     *                          Original value can be retrieved using VincentAppViewFacet
     */
    event AuthorizedRedirectUriRemoved(uint256 indexed appId, bytes32 indexed hashedRedirectUri);

    /**
     * @notice Emitted when a new delegatee is added to an app
     * @param appId ID of the app
     * @param delegatee Address of the delegatee added to the app
     */
    event DelegateeAdded(uint256 indexed appId, address indexed delegatee);

    /**
     * @notice Emitted when a delegatee is removed from an app
     * @param appId ID of the app
     * @param delegatee Address of the delegatee removed from the app
     */
    event DelegateeRemoved(uint256 indexed appId, address indexed delegatee);

    /**
     * @notice Emitted when a new tool is registered
     * @param toolIpfsCidHash The keccak256 hash of the tool's IPFS CID that was registered
     */
    event NewToolRegistered(bytes32 indexed toolIpfsCidHash);

    /**
     * @notice Error thrown when a non-manager attempts to modify an app
     * @param appId ID of the app being modified
     * @param msgSender Address that attempted the unauthorized modification
     */
    error NotAppManager(uint256 appId, address msgSender);

    /**
     * @notice Error thrown when tool and policy array lengths don't match
     * @dev This ensures each tool has appropriate policy configurations
     */
    error ToolsAndPoliciesLengthMismatch();

    /**
     * @notice Error thrown when attempting to register a delegatee already associated with an app
     * @dev Delegatees are unique to apps and cannot be used with multiple apps simultaneously
     * @param appId ID of the app the delegatee is already registered to
     * @param delegatee Address of the delegatee that is already registered
     */
    error DelegateeAlreadyRegisteredToApp(uint256 appId, address delegatee);

    /**
     * @notice Error thrown when trying to remove a delegatee not registered to the specified app
     * @param appId ID of the app from which removal was attempted
     * @param delegatee Address of the delegatee that is not registered to the app
     */
    error DelegateeNotRegisteredToApp(uint256 appId, address delegatee);

    /**
     * @notice Error thrown when trying to remove a redirect URI not registered to the app
     * @param appId ID of the app
     * @param redirectUri The redirect URI that is not registered
     */
    error RedirectUriNotRegisteredToApp(uint256 appId, string redirectUri);

    /**
     * @notice Error thrown when no redirect URIs are provided during app registration
     * @dev At least one redirect URI is required for app registration
     */
    error NoRedirectUrisProvided();

    /**
     * @notice Error thrown when trying to remove the last redirect URI of an app
     * @param appId ID of the app
     */
    error CannotRemoveLastRedirectUri(uint256 appId);

    /**
     * @notice Error thrown when trying to set app version enabled status to its current status
     * @param appId ID of the app
     * @param appVersion Version number of the app
     * @param enabled Current enabled status
     */
    error AppVersionAlreadyInRequestedState(uint256 appId, uint256 appVersion, bool enabled);

    /**
     * @notice Error thrown when trying to add a redirect URI that already exists for the app
     * @param appId ID of the app
     * @param redirectUri The redirect URI that already exists
     */
    error RedirectUriAlreadyAuthorizedForApp(uint256 appId, string redirectUri);

    /**
     * @notice Error thrown when trying to use an empty policy IPFS CID
     * @param appId ID of the app
     * @param toolIndex Index of the tool in the tools array
     */
    error EmptyPolicyIpfsCidNotAllowed(uint256 appId, uint256 toolIndex);

    /**
     * @notice Error thrown when a tool IPFS CID is empty
     * @param appId ID of the app
     * @param toolIndex Index of the tool in the tools array
     */
    error EmptyToolIpfsCidNotAllowed(uint256 appId, uint256 toolIndex);

    /**
     * @notice Error thrown when app name is empty
     */
    error EmptyAppNameNotAllowed();

    /**
     * @notice Error thrown when app description is empty
     */
    error EmptyAppDescriptionNotAllowed();

    /**
     * @notice Error thrown when a redirect URI is empty
     */
    error EmptyRedirectUriNotAllowed();

    /**
     * @notice Error thrown when a delegatee address is the zero address
     */
    error ZeroAddressDelegateeNotAllowed();

    /**
     * @notice Error thrown when no tools are provided during app version registration
     * @param appId ID of the app
     */
    error NoToolsProvided(uint256 appId);

    /**
     * @notice Error thrown when no policies are provided for a tool
     * @param appId ID of the app
     * @param toolIndex Index of the tool with no policies
     */
    error NoPoliciesProvidedForTool(uint256 appId, uint256 toolIndex);

    /**
     * @notice Error thrown when a policy parameter name is empty
     * @param appId ID of the app
     * @param toolIndex Index of the tool in the tools array
     * @param policyIndex Index of the policy in the policies array
     * @param paramIndex Index of the parameter in the parameters array
     */
    error EmptyParameterNameNotAllowed(uint256 appId, uint256 toolIndex, uint256 policyIndex, uint256 paramIndex);

    /**
     * @notice Modifier to restrict function access to the app manager only
     * @param appId ID of the app
     */
    modifier onlyAppManager(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (as_.appIdToApp[appId].manager != msg.sender) revert NotAppManager(appId, msg.sender);
        _;
    }

    /**
     * @notice Register a new application with initial version, tools, and policies
     * @dev This function combines app registration and first version registration in one call
     * @param name Name of the application
     * @param description Description of the application
     * @param authorizedRedirectUris List of authorized redirect URIs for the application
     * @param delegatees List of delegatee addresses for the application
     * @param toolIpfsCids Array of IPFS CIDs representing the tools associated with this app
     * @param toolPolicies 2D array mapping each tool to its associated policies
     * @param toolPolicyParameterNames 3D array mapping each policy to its parameter names
     * @param toolPolicyParameterTypes 3D array mapping each policy parameter to its type
     * @return newAppId The ID of the newly registered app
     * @return newAppVersion The version number of the newly registered app version (always 1 for new apps)
     */
    function registerApp(
        string calldata name,
        string calldata description,
        string[] calldata authorizedRedirectUris,
        address[] calldata delegatees,
        string[] calldata toolIpfsCids,
        string[][] calldata toolPolicies,
        string[][][] calldata toolPolicyParameterNames,
        VincentAppStorage.ParameterType[][][] calldata toolPolicyParameterTypes
    ) external returns (uint256 newAppId, uint256 newAppVersion) {
        newAppId = _registerApp(name, description, authorizedRedirectUris, delegatees);
        emit NewAppRegistered(newAppId, msg.sender);

        newAppVersion = _registerNextAppVersion(
            newAppId, toolIpfsCids, toolPolicies, toolPolicyParameterNames, toolPolicyParameterTypes
        );
        emit NewAppVersionRegistered(newAppId, newAppVersion, msg.sender);
    }

    /**
     * @notice Register a new version of an existing application
     * @dev Only the app manager can register new versions of an existing app
     * @param appId ID of the app for which to register a new version
     * @param toolIpfsCids Array of IPFS CIDs representing the tools associated with this version
     * @param toolPolicies 2D array mapping each tool to its associated policies
     * @param toolPolicyParameterNames 3D array mapping each policy to its parameter names
     * @param toolPolicyParameterTypes 3D array mapping each policy parameter to its type
     * @return newAppVersion The version number of the newly registered app version
     */
    function registerNextAppVersion(
        uint256 appId,
        string[] calldata toolIpfsCids,
        string[][] calldata toolPolicies,
        string[][][] calldata toolPolicyParameterNames,
        VincentAppStorage.ParameterType[][][] calldata toolPolicyParameterTypes
    ) external onlyAppManager(appId) onlyRegisteredApp(appId) returns (uint256 newAppVersion) {
        newAppVersion = _registerNextAppVersion(
            appId, toolIpfsCids, toolPolicies, toolPolicyParameterNames, toolPolicyParameterTypes
        );

        emit NewAppVersionRegistered(appId, newAppVersion, msg.sender);
    }

    /**
     * @notice Enable or disable a specific app version
     * @dev Only the app manager can change the enabled status of an app version
     * @param appId ID of the app
     * @param appVersion Version number of the app to enable/disable
     * @param enabled Whether to enable (true) or disable (false) the app version
     */
    function enableAppVersion(uint256 appId, uint256 appVersion, bool enabled)
        external
        onlyAppManager(appId)
        onlyRegisteredAppVersion(appId, appVersion)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // Cache the versioned app to avoid duplicate storage reads
        VincentAppStorage.VersionedApp storage versionedApp =
            as_.appIdToApp[appId].versionedApps[getVersionedAppIndex(appVersion)];

        // Revert if trying to set to the same status
        if (versionedApp.enabled == enabled) {
            revert AppVersionAlreadyInRequestedState(appId, appVersion, enabled);
        }

        versionedApp.enabled = enabled;
        emit AppEnabled(appId, appVersion, enabled);
    }

    /**
     * @notice Add a new authorized redirect URI to an app
     * @dev Only the app manager can add redirect URIs
     * @param appId ID of the app
     * @param redirectUri The redirect URI to add
     */
    function addAuthorizedRedirectUri(uint256 appId, string calldata redirectUri)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        // Check that the redirect URI is not empty
        if (bytes(redirectUri).length == 0) {
            revert EmptyRedirectUriNotAllowed();
        }

        _addAuthorizedRedirectUri(VincentAppStorage.appStorage(), appId, redirectUri);
    }

    /**
     * @notice Remove an authorized redirect URI from an app
     * @dev Only the app manager can remove redirect URIs
     * @param appId ID of the app
     * @param redirectUri The redirect URI to remove
     */
    function removeAuthorizedRedirectUri(uint256 appId, string calldata redirectUri)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        bytes32 hashedRedirectUri = keccak256(abi.encodePacked(redirectUri));

        if (!as_.appIdToApp[appId].authorizedRedirectUris.contains(hashedRedirectUri)) {
            revert RedirectUriNotRegisteredToApp(appId, redirectUri);
        }

        // Check if this is the last redirect URI
        if (as_.appIdToApp[appId].authorizedRedirectUris.length() == 1) {
            revert CannotRemoveLastRedirectUri(appId);
        }

        as_.appIdToApp[appId].authorizedRedirectUris.remove(hashedRedirectUri);

        emit AuthorizedRedirectUriRemoved(appId, hashedRedirectUri);
    }

    /**
     * @notice Add a new delegatee to an app
     * @dev Only the app manager can add delegatees. A delegatee can only be associated with one app at a time.
     * @param appId ID of the app
     * @param delegatee Address of the delegatee to add
     */
    function addDelegatee(uint256 appId, address delegatee) external onlyAppManager(appId) onlyRegisteredApp(appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // Check that the delegatee is not the zero address
        if (delegatee == address(0)) {
            revert ZeroAddressDelegateeNotAllowed();
        }

        // Check if the delegatee is already registered to any app
        uint256 delegateeAppId = as_.delegateeAddressToAppId[delegatee];
        if (delegateeAppId != 0) {
            revert DelegateeAlreadyRegisteredToApp(delegateeAppId, delegatee);
        }

        as_.appIdToApp[appId].delegatees.add(delegatee);

        as_.delegateeAddressToAppId[delegatee] = appId;

        emit DelegateeAdded(appId, delegatee);
    }

    /**
     * @notice Remove a delegatee from an app
     * @dev Only the app manager can remove delegatees
     * @param appId ID of the app
     * @param delegatee Address of the delegatee to remove
     */
    function removeDelegatee(uint256 appId, address delegatee)
        external
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        if (as_.delegateeAddressToAppId[delegatee] != appId) revert DelegateeNotRegisteredToApp(appId, delegatee);

        as_.appIdToApp[appId].delegatees.remove(delegatee);
        as_.delegateeAddressToAppId[delegatee] = 0;

        emit DelegateeRemoved(appId, delegatee);
    }

    /**
     * @notice Internal function to register a new app
     * @dev Sets up the basic app structure and associates redirect URIs and delegatees
     * @param name Name of the application
     * @param description Description of the application
     * @param authorizedRedirectUris List of authorized redirect URIs for the application
     * @param delegatees List of delegatee addresses for the application
     * @return newAppId The ID of the newly registered app
     */
    function _registerApp(
        string calldata name,
        string calldata description,
        string[] calldata authorizedRedirectUris,
        address[] calldata delegatees
    ) internal returns (uint256 newAppId) {
        // Validate app name and description are not empty
        if (bytes(name).length == 0) {
            revert EmptyAppNameNotAllowed();
        }

        if (bytes(description).length == 0) {
            revert EmptyAppDescriptionNotAllowed();
        }

        // Require at least one authorized redirect URI
        if (authorizedRedirectUris.length == 0) {
            revert NoRedirectUrisProvided();
        }

        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        newAppId = ++as_.appIdCounter;

        // Add the app to the manager's list of apps
        as_.managerAddressToAppIds[msg.sender].add(newAppId);

        // Register the app
        VincentAppStorage.App storage app = as_.appIdToApp[newAppId];
        app.manager = msg.sender;
        app.name = name;
        app.description = description;

        for (uint256 i = 0; i < authorizedRedirectUris.length; i++) {
            // Check that the redirect URI is not empty
            if (bytes(authorizedRedirectUris[i]).length == 0) {
                revert EmptyRedirectUriNotAllowed();
            }
            _addAuthorizedRedirectUri(as_, newAppId, authorizedRedirectUris[i]);
        }

        // Add the delegatees to the app
        for (uint256 i = 0; i < delegatees.length; i++) {
            // Check that the delegatee is not the zero address
            if (delegatees[i] == address(0)) {
                revert ZeroAddressDelegateeNotAllowed();
            }

            uint256 existingAppId = as_.delegateeAddressToAppId[delegatees[i]];
            if (existingAppId != 0) {
                revert DelegateeAlreadyRegisteredToApp(existingAppId, delegatees[i]);
            }

            app.delegatees.add(delegatees[i]);

            as_.delegateeAddressToAppId[delegatees[i]] = newAppId;
        }
    }

    /**
     * @dev Registers a new version of an app, associating tools and policies with it.
     * This function ensures that all provided tools, policies, and parameters are correctly stored
     * and linked to the new app version.
     *
     * @notice This function is used internally to register a new app version and its associated tools and policies.
     * @notice App versions are enabled by default when registered.
     *
     * @param appId The ID of the app for which a new version is being registered.
     * @param toolIpfsCids An array of IPFS CIDs representing the tools associated with this version.
     * @param toolPolicies A 2D array mapping each tool to a list of associated policies.
     * @param toolPolicyParameterNames A 3D array mapping each policy to a list of associated parameter names.
     * @param toolPolicyParameterTypes A 3D array mapping each policy parameter to its type.
     * @return newAppVersion The newly created version number for the app.
     */
    function _registerNextAppVersion(
        uint256 appId,
        string[] calldata toolIpfsCids,
        string[][] calldata toolPolicies,
        string[][][] calldata toolPolicyParameterNames,
        VincentAppStorage.ParameterType[][][] calldata toolPolicyParameterTypes
    ) internal returns (uint256 newAppVersion) {
        // Step 1: Check that at least one tool is provided
        if (toolIpfsCids.length == 0) {
            revert NoToolsProvided(appId);
        }

        // Step 2: Validate input array lengths to ensure all tools have corresponding policies and parameters.
        uint256 toolCount = toolIpfsCids.length;
        if (
            toolCount != toolPolicies.length || toolCount != toolPolicyParameterNames.length
                || toolCount != toolPolicyParameterTypes.length
        ) {
            revert ToolsAndPoliciesLengthMismatch();
        }

        // Step 3: Fetch necessary storage references.
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];
        VincentToolStorage.ToolStorage storage ts = VincentToolStorage.toolStorage();

        // Step 4: Create a new app version.
        app.versionedApps.push();
        newAppVersion = app.versionedApps.length;

        VincentAppStorage.VersionedApp storage versionedApp = app.versionedApps[getVersionedAppIndex(newAppVersion)];
        versionedApp.enabled = true; // App versions are enabled by default

        // Store this once outside the loop instead of repeatedly accessing it
        EnumerableSet.Bytes32Set storage toolIpfsCidHashes = versionedApp.toolIpfsCidHashes;

        // Step 5: Iterate through each tool to register it with the new app version.
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = toolIpfsCids[i]; // Cache calldata value

            // Validate tool IPFS CID is not empty
            if (bytes(toolIpfsCid).length == 0) {
                revert EmptyToolIpfsCidNotAllowed(appId, i);
            }

            bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Step 5.1: Register the tool IPFS CID globally if it hasn't been added already.
            if (!toolIpfsCidHashes.contains(hashedToolCid)) {
                toolIpfsCidHashes.add(hashedToolCid);

                // First check if the tool is already registered in global storage
                // before trying to register it again
                if (bytes(ts.ipfsCidHashToIpfsCid[hashedToolCid]).length == 0) {
                    ts.ipfsCidHashToIpfsCid[hashedToolCid] = toolIpfsCid;
                    emit NewToolRegistered(hashedToolCid);
                }
                // If tool is already registered globally, just continue
                // without trying to register it again
            }

            // Step 5.2: Fetch the tool policies storage for this tool.
            VincentAppStorage.ToolPolicies storage toolPoliciesStorage =
                versionedApp.toolIpfsCidHashToToolPolicies[hashedToolCid];

            // Step 6: Iterate through policies linked to this tool.
            uint256 policyCount = toolPolicies[i].length;

            for (uint256 j = 0; j < policyCount; j++) {
                string memory policyIpfsCid = toolPolicies[i][j]; // Cache calldata value

                // Validate non-empty policy IPFS CID
                if (bytes(policyIpfsCid).length == 0) {
                    revert EmptyPolicyIpfsCidNotAllowed(appId, i);
                }

                bytes32 hashedToolPolicy = keccak256(abi.encodePacked(policyIpfsCid));

                // Step 6.1: Add the policy hash to the ToolPolicies
                toolPoliciesStorage.policyIpfsCidHashes.add(hashedToolPolicy);

                // Step 6.2: Store the policy IPFS CID globally if it's not already stored.
                if (bytes(ts.ipfsCidHashToIpfsCid[hashedToolPolicy]).length == 0) {
                    ts.ipfsCidHashToIpfsCid[hashedToolPolicy] = policyIpfsCid;
                }

                // Create a new Policy storage structure for this policy in the current app version
                VincentAppStorage.Policy storage policy =
                    toolPoliciesStorage.policyIpfsCidHashToPolicy[hashedToolPolicy];

                // Step 7: Get the Policy parameter name hashes for this policy
                EnumerableSet.Bytes32Set storage policyParameterNameHashes = policy.policyParameterNameHashes;

                // Step 8: Iterate through policy parameters.
                uint256 paramCount = toolPolicyParameterNames[i][j].length;

                for (uint256 k = 0; k < paramCount; k++) {
                    string memory paramName = toolPolicyParameterNames[i][j][k]; // Cache calldata value

                    // Check for empty parameter name
                    if (bytes(paramName).length == 0) {
                        revert EmptyParameterNameNotAllowed(appId, i, j, k);
                    }

                    bytes32 hashedPolicyParameterName = keccak256(abi.encodePacked(paramName));

                    // Step 8.1: Register the policy parameter.
                    policyParameterNameHashes.add(hashedPolicyParameterName);

                    // Step 8.2: Store the parameter name if not already stored.
                    if (bytes(ts.policyParameterNameHashToName[hashedPolicyParameterName]).length == 0) {
                        ts.policyParameterNameHashToName[hashedPolicyParameterName] = paramName;
                    }

                    // Step 8.3: Store the parameter type
                    VincentAppStorage.ParameterType paramType = toolPolicyParameterTypes[i][j][k];
                    policy.policyParameterNameHashToType[hashedPolicyParameterName] = paramType;
                }
            }
        }
    }

    /**
     * @notice Internal function to add an authorized redirect URI to an app
     * @dev Registers the redirect URI and links it to the app
     * @param appId ID of the app
     * @param redirectUri The redirect URI to add
     */
    function _addAuthorizedRedirectUri(
        VincentAppStorage.AppStorage storage appStorage,
        uint256 appId,
        string calldata redirectUri
    ) internal {
        bytes32 hashedRedirectUri = keccak256(abi.encodePacked(redirectUri));

        // If the redirect URI was not added (already exists), revert
        if (!appStorage.appIdToApp[appId].authorizedRedirectUris.add(hashedRedirectUri)) {
            revert RedirectUriAlreadyAuthorizedForApp(appId, redirectUri);
        }

        appStorage.authorizedRedirectUriHashToRedirectUri[hashedRedirectUri] = redirectUri;

        emit AuthorizedRedirectUriAdded(appId, hashedRedirectUri);
    }
}
