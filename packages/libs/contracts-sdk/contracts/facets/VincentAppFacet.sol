// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../VincentBase.sol";
import "../libs/LibVincentAppFacet.sol";

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
     * @title AppVersionTools
     * @notice Structure containing tools and policies for an app version
     * @dev Used when registering a new app version
     * @param toolIpfsCids Array of IPFS CIDs pointing to tool metadata
     * @param toolPolicies 2D array of policy identifiers for each tool
     */
    struct AppVersionTools {
        string[] toolIpfsCids;
        string[][] toolPolicies;
    }

    /**
     * @notice Modifier to restrict function access to the app manager only
     * @param appId ID of the app
     */
    modifier onlyAppManager(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (as_.appIdToApp[appId].manager != msg.sender) revert LibVincentAppFacet.NotAppManager(appId, msg.sender);
        _;
    }

    /**
     * @notice Register a new application with initial version, tools, and policies
     * @dev This function combines app registration and first version registration in one call
     * @param appId The ID of the app to register
     * @param delegatees List of addresses authorized to act on behalf of the app
     * @param versionTools Tools and policies for the app version
     */
    function registerApp(uint256 appId, address[] calldata delegatees, AppVersionTools calldata versionTools)
        external returns (uint256 newAppVersion)
    {
        if (appId == 0) {
            revert LibVincentAppFacet.ZeroAppIdNotAllowed();
        }

        _registerApp(appId, delegatees);
        emit LibVincentAppFacet.NewAppRegistered(appId, msg.sender);

        newAppVersion = _registerNextAppVersion(appId, versionTools);
        emit LibVincentAppFacet.NewAppVersionRegistered(appId, newAppVersion, msg.sender);
    }

    /**
     * @notice Register a new version of an existing application
     * @dev Only the app manager can register new versions of an existing app
     * @param appId ID of the app for which to register a new version
     * @param versionTools Tools and policies for the app version
     * @return newAppVersion The version number of the newly registered app version
     */
    function registerNextAppVersion(uint256 appId, AppVersionTools calldata versionTools)
        external
        appNotDeleted(appId)
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
        returns (uint256 newAppVersion)
    {
        newAppVersion = _registerNextAppVersion(appId, versionTools);

        emit LibVincentAppFacet.NewAppVersionRegistered(appId, newAppVersion, msg.sender);
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
        appNotDeleted(appId)
        onlyAppManager(appId)
        onlyRegisteredAppVersion(appId, appVersion)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // Cache the versioned app to avoid duplicate storage reads
        VincentAppStorage.AppVersion storage versionedApp =
            as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)];

        // Revert if trying to set to the same status
        if (versionedApp.enabled == enabled) {
            revert LibVincentAppFacet.AppVersionAlreadyInRequestedState(appId, appVersion, enabled);
        }

        versionedApp.enabled = enabled;
        emit LibVincentAppFacet.AppEnabled(appId, appVersion, enabled);
    }

    /**
     * @notice Add a new delegatee to an app
     * @dev Only the app manager can add delegatees. A delegatee can only be associated with one app at a time.
     * @param appId ID of the app
     * @param delegatee Address of the delegatee to add
     */
    function addDelegatee(uint256 appId, address delegatee)
        external
        appNotDeleted(appId)
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        // Check that the delegatee is not the zero address
        if (delegatee == address(0)) {
            revert LibVincentAppFacet.ZeroAddressDelegateeNotAllowed();
        }

        // Check if the delegatee is already registered to any app
        uint256 delegateeAppId = as_.delegateeAddressToAppId[delegatee];
        if (delegateeAppId != 0) {
            revert LibVincentAppFacet.DelegateeAlreadyRegisteredToApp(delegateeAppId, delegatee);
        }

        as_.appIdToApp[appId].delegatees.add(delegatee);

        as_.delegateeAddressToAppId[delegatee] = appId;

        emit LibVincentAppFacet.DelegateeAdded(appId, delegatee);
    }

    /**
     * @notice Remove a delegatee from an app
     * @dev Only the app manager can remove delegatees
     * @param appId ID of the app
     * @param delegatee Address of the delegatee to remove
     */
    function removeDelegatee(uint256 appId, address delegatee)
        external
        appNotDeleted(appId)
        onlyAppManager(appId)
        onlyRegisteredApp(appId)
    {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        if (as_.delegateeAddressToAppId[delegatee] != appId) {
            revert LibVincentAppFacet.DelegateeNotRegisteredToApp(appId, delegatee);
        }

        as_.appIdToApp[appId].delegatees.remove(delegatee);
        as_.delegateeAddressToAppId[delegatee] = 0;

        emit LibVincentAppFacet.DelegateeRemoved(appId, delegatee);
    }

    /**
     * @notice Delete an application by setting its isDeleted flag to true
     * @dev Only the app manager can delete an app
     * @param appId ID of the app to delete
     */
    function deleteApp(uint256 appId) external appNotDeleted(appId) onlyAppManager(appId) onlyRegisteredApp(appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];

        // Check if the app is already undeleted
        if (app.isDeleted) {
            revert LibVincentAppFacet.AppAlreadyDeleted(appId);
        }

        app.isDeleted = true;
        emit LibVincentAppFacet.AppDeleted(appId);
    }

    /**
     * @notice Undeletes an app by setting its isDeleted flag to false
     * @dev Only the app manager can undelete an app
     * @param appId ID of the app to undelete
     */
    function undeleteApp(uint256 appId) external onlyAppManager(appId) onlyRegisteredApp(appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];

        if (!app.isDeleted) {
            revert LibVincentAppFacet.AppAlreadyUndeleted(appId);
        }

        app.isDeleted = false;
        emit LibVincentAppFacet.AppUndeleted(appId);
    }

    /**
     * @notice Internal function to register a new app
     * @dev Sets up the basic app structure and associates delegatees
     * @param appId The ID of the app to register
     * @param delegatees List of addresses authorized to act on behalf of the app
     */
    function _registerApp(uint256 appId, address[] calldata delegatees) internal {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();

        if (as_.appIdToApp[appId].manager != address(0)) {
            revert LibVincentAppFacet.AppAlreadyRegistered(appId);
        }

        // Add the app to the manager's list of apps
        as_.managerAddressToAppIds[msg.sender].add(appId);

        // Register the app
        VincentAppStorage.App storage app = as_.appIdToApp[appId];
        app.manager = msg.sender;

        // Add the delegatees to the app
        for (uint256 i = 0; i < delegatees.length; i++) {
            // Check that the delegatee is not the zero address
            if (delegatees[i] == address(0)) {
                revert LibVincentAppFacet.ZeroAddressDelegateeNotAllowed();
            }

            uint256 existingAppId = as_.delegateeAddressToAppId[delegatees[i]];
            if (existingAppId != 0) {
                revert LibVincentAppFacet.DelegateeAlreadyRegisteredToApp(existingAppId, delegatees[i]);
            }

            app.delegatees.add(delegatees[i]);

            as_.delegateeAddressToAppId[delegatees[i]] = appId;
        }
    }

    /**
     * @dev Registers a new version of an app, associating tools and policies with it.
     * This function ensures that all provided tools, policies, and parameters are correctly stored
     * and linked to the new app version. Also ensures that no duplicate tool or policy IPFS CIDs are added.
     *
     * @notice This function is used internally to register a new app version and its associated tools and policies.
     * @notice App versions are enabled by default when registered.
     *
     * @param appId The ID of the app for which a new version is being registered.
     * @param versionTools An AppVersionTools struct containing the tools, policies, and parameters for the new app version.
     * @return newAppVersion The newly created version number for the app.
     */
    function _registerNextAppVersion(uint256 appId, AppVersionTools calldata versionTools)
        internal
        returns (uint256 newAppVersion)
    {
        // Step 1: Check that at least one tool is provided
        if (versionTools.toolIpfsCids.length == 0) {
            revert LibVincentAppFacet.NoToolsProvided(appId);
        }

        // Check array lengths at top level
        uint256 toolCount = versionTools.toolIpfsCids.length;
        if (toolCount != versionTools.toolPolicies.length) {
            revert LibVincentAppFacet.ToolArrayDimensionMismatch(
                toolCount,
                versionTools.toolPolicies.length
            );
        }

        // Step 2: Fetch necessary storage references.
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        VincentAppStorage.App storage app = as_.appIdToApp[appId];
        VincentLitActionStorage.LitActionStorage storage ls = VincentLitActionStorage.litActionStorage();

        // Step 3: Create a new app version.
        app.appVersions.push();
        newAppVersion = app.appVersions.length;

        VincentAppStorage.AppVersion storage versionedApp = app.appVersions[getAppVersionIndex(newAppVersion)];
        versionedApp.enabled = true; // App versions are enabled by default

        // Store this once outside the loop instead of repeatedly accessing it
        EnumerableSet.Bytes32Set storage toolIpfsCidHashes = versionedApp.toolIpfsCidHashes;

        // Step 6: Iterate through each tool to register it with the new app version.
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = versionTools.toolIpfsCids[i]; // Cache calldata value

            // Validate tool IPFS CID is not empty
            if (bytes(toolIpfsCid).length == 0) {
                revert LibVincentAppFacet.EmptyToolIpfsCidNotAllowed(appId, i);
            }

            bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Step 6.1: Register the tool IPFS CID globally if it hasn't been added already.
            if (!toolIpfsCidHashes.add(hashedToolCid)) {
                revert LibVincentAppFacet.DuplicateToolIpfsCidNotAllowed(appId, i);
            }

            // First check if the tool is already registered in global storage
            // before trying to register it again
            if (bytes(ls.ipfsCidHashToIpfsCid[hashedToolCid]).length == 0) {
                ls.ipfsCidHashToIpfsCid[hashedToolCid] = toolIpfsCid;
                emit LibVincentAppFacet.NewLitActionRegistered(hashedToolCid);
            }

            // Step 7: Iterate through policies linked to this tool.
            uint256 policyCount = versionTools.toolPolicies[i].length;

            for (uint256 j = 0; j < policyCount; j++) {
                string memory policyIpfsCid = versionTools.toolPolicies[i][j]; // Cache calldata value

                // Validate non-empty policy IPFS CID
                if (bytes(policyIpfsCid).length == 0) {
                    revert LibVincentAppFacet.EmptyPolicyIpfsCidNotAllowed(appId, j);
                }

                bytes32 hashedToolPolicy = keccak256(abi.encodePacked(policyIpfsCid));
                EnumerableSet.Bytes32Set storage toolPolicyIpfsCidHashes = versionedApp.toolIpfsCidHashToToolPolicyIpfsCidHashes[hashedToolCid];

                // Step 7.1: Add the policy hash to the ToolPolicies
                if (!toolPolicyIpfsCidHashes.add(hashedToolPolicy)) {
                    revert LibVincentAppFacet.DuplicateToolPolicyIpfsCidNotAllowed(appId, i, j);
                }

                // Step 7.3: Store the policy IPFS CID globally if it's not already stored.
                if (bytes(ls.ipfsCidHashToIpfsCid[hashedToolPolicy]).length == 0) {
                    ls.ipfsCidHashToIpfsCid[hashedToolPolicy] = policyIpfsCid;
                    emit LibVincentAppFacet.NewLitActionRegistered(hashedToolPolicy);
                }
            }
        }
    }
}