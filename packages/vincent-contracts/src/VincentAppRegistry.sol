// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./VincentTypes.sol";

contract VincentAppRegistry {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.UintSet;

    uint256 private appIdCounter;
    uint256 private roleIdCounter;

    EnumerableSet.AddressSet private registeredManagers;
    EnumerableSet.UintSet private registeredApps;
    EnumerableSet.UintSet private registeredRoles;

    // App Manager to registered apps
    mapping(address => EnumerableSet.UintSet) private managerToApps;

    // App ID to App
    mapping(uint256 => VincentTypes.App) private apps;

    // App Manager to App ID to Delegatees
    mapping(address => mapping(uint256 => EnumerableSet.AddressSet)) private managerToAppToDelegatees;
    // Delegatee to App Manager
    mapping(uint256 => mapping(address => address)) private appToDelegateeToManager;

    // Role ID to App Role
    mapping(uint256 => VincentTypes.Role) private roleIdToRole;

    /// @notice Maps hashed tool CIDs to their original IPFS CID strings
    mapping(bytes32 => string) hashedToolCidToOriginalCid;
    /// @notice Maps hashed parameter names to their original string names
    mapping(bytes32 => string) hashedParameterNameToOriginalName;

    event ManagerRegistered(address indexed manager);
    event AppRegistered(uint256 indexed appId, address indexed manager);
    event AppEnabled(uint256 indexed appId);
    event AppDisabled(uint256 indexed appId);
    event RoleRegistered(uint256 indexed appId, uint256 indexed roleId, uint256 version);
    event RoleUpdated(uint256 indexed appId, uint256 indexed roleId, uint256 version);
    error NotAppManager(uint256 appId);
    error AppNotRegistered(uint256 appId);
    error InvalidDelegatee(address delegatee);
    error ToolArraysLengthMismatch();
    error ToolParameterLengthMismatch(uint256 toolIndex);
    error RoleNotRegistered(uint256 appId, uint256 roleId);

    modifier onlyAppManager(uint256 appId) {
        if (apps[appId].manager != msg.sender) revert NotAppManager(appId);
        _;
    }
    
    /**
     * App Controls
     */

    function registerApp() external returns (uint256 appId) {
        appId = appIdCounter++;

        // Add the manager to the list of registered managerToApps
        // if they are not already in the list
        if (!registeredManagers.contains(msg.sender)) {
            registeredManagers.add(msg.sender);
            emit ManagerRegistered(msg.sender);
        }

        // Add the app to the list of registered apps
        registeredApps.add(appId);

        // Add the app to the manager's list of apps
        managerToApps[msg.sender].add(appId);

        // Register the app
        VincentTypes.App storage app = apps[appId];
        app.manager = msg.sender;
        app.enabled = false;

        emit AppRegistered(appId, msg.sender);
    }

    function enableApp(uint256 appId) external onlyAppManager(appId) {
        if (!registeredApps.contains(appId)) revert AppNotRegistered(appId);

        apps[appId].enabled = true;

        emit AppEnabled(appId);
    }

    function disableApp(uint256 appId) external onlyAppManager(appId) {
        if (!registeredApps.contains(appId)) revert AppNotRegistered(appId);

        apps[appId].enabled = false;

        emit AppDisabled(appId);
    }

    /**
     * App Manager Controls
     */

    function addDelegatee(uint256 appId, address delegatee) external onlyAppManager(appId) {
        if (delegatee == address(0)) revert InvalidDelegatee(delegatee);
        if (!registeredApps.contains(appId)) revert AppNotRegistered(appId);

        managerToAppToDelegatees[msg.sender][appId].add(delegatee);
        appToDelegateeToManager[appId][delegatee] = msg.sender;
    }

    function removeDelegatee(uint256 appId, address delegatee) external onlyAppManager(appId) {
        if (!managerToAppToDelegatees[msg.sender][appId].contains(delegatee)) revert InvalidDelegatee(delegatee);

        managerToAppToDelegatees[msg.sender][appId].remove(delegatee);
        appToDelegateeToManager[appId][delegatee] = address(0);
    }

    /**
     * App Role Controls
     */

    function registerRole(
        uint256 appId,
        string calldata name,
        string calldata description,
        string[] calldata toolIpfsCids,
        string[][] calldata parameterNames
    ) external returns (uint256 roleId) {
        if (!registeredApps.contains(appId)) revert AppNotRegistered(appId);
        if (toolIpfsCids.length != parameterNames.length) {
            revert ToolArraysLengthMismatch();
        }

        roleId = roleIdCounter++;
        VincentTypes.Role storage newRole = roleIdToRole[roleId];
        
        newRole.version = 1;
        newRole.name = name;
        newRole.description = description;

        // Hash and store each tool CID with its parameters
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            // Add Tool to Role
            bytes32 hashedCid = keccak256(abi.encodePacked(toolIpfsCids[i]));
            hashedToolCidToOriginalCid[hashedCid] = toolIpfsCids[i];
            
            newRole.toolIpfsCidHashes.add(hashedCid);
            VincentTypes.Tool storage newTool = newRole.toolIpfsCidHashToTool[hashedCid];
            newTool.enabled = true;

            // Store parameter names for this tool
            for (uint256 j = 0; j < parameterNames[i].length; j++) {
                bytes32 paramHash = keccak256(abi.encodePacked(parameterNames[i][j]));
                hashedParameterNameToOriginalName[paramHash] = parameterNames[i][j];
                newTool.parameterNameHashes.add(paramHash);
            }
        }

        registeredRoles.add(roleId);

        VincentTypes.App storage app = apps[appId];
        app.roleIds.add(roleId);
        app.activeRoleVersions[roleId] = newRole.version;

        VincentTypes.Role storage versionedRole = apps[appId].versionedRoles[roleId][newRole.version];
        versionedRole = newRole;

        emit RoleRegistered(appId, roleId, newRole.version);
    }

    function updateRole(
        uint256 appId,
        uint256 roleId,
        string calldata name,
        string calldata description,
        string[] calldata toolIpfsCids,
        string[][] calldata parameterNames
    ) external onlyAppManager(appId) {
        if (!registeredApps.contains(appId)) revert AppNotRegistered(appId);
        if (!registeredRoles.contains(roleId)) revert RoleNotRegistered(appId, roleId);
        if (toolIpfsCids.length != parameterNames.length) {
            revert ToolArraysLengthMismatch();
        }

        VincentTypes.App storage app = apps[appId];
        uint256 updatedRoleVersion = app.activeRoleVersions[roleId] + 1;
        
        // Create new version of the role
        VincentTypes.Role storage newVersionedRole = app.versionedRoles[roleId][updatedRoleVersion];
        newVersionedRole.version = updatedRoleVersion;
        newVersionedRole.name = name;
        newVersionedRole.description = description;

        // Add new tools and their parameters
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            bytes32 hashedCid = keccak256(abi.encodePacked(toolIpfsCids[i]));
            hashedToolCidToOriginalCid[hashedCid] = toolIpfsCids[i];
            
            newVersionedRole.toolIpfsCidHashes.add(hashedCid);
            VincentTypes.Tool storage newTool = newVersionedRole.toolIpfsCidHashToTool[hashedCid];
            newTool.enabled = true;

            // Store parameter names for this tool
            for (uint256 j = 0; j < parameterNames[i].length; j++) {
                bytes32 paramHash = keccak256(abi.encodePacked(parameterNames[i][j]));
                hashedParameterNameToOriginalName[paramHash] = parameterNames[i][j];
                newTool.parameterNameHashes.add(paramHash);
            }
        }

        // Update the active version
        app.activeRoleVersions[roleId] = updatedRoleVersion;

        emit RoleUpdated(appId, roleId, updatedRoleVersion);
    }

    function enableRole(uint256 appId, uint256 roleId) external onlyAppManager(appId) {
        if (!registeredApps.contains(appId)) revert AppNotRegistered(appId);
        if (!registeredRoles.contains(roleId)) revert RoleNotRegistered(appId, roleId);

        VincentTypes.App storage app = apps[appId];
        uint256 currentVersion = app.activeRoleVersions[roleId];
        app.versionedRoles[roleId][currentVersion].enabled = true;
    }

    function disableRole(uint256 appId, uint256 roleId) external onlyAppManager(appId) {
        if (!registeredApps.contains(appId)) revert AppNotRegistered(appId);
        if (!registeredRoles.contains(roleId)) revert RoleNotRegistered(appId, roleId);

        VincentTypes.App storage app = apps[appId];
        uint256 currentVersion = app.activeRoleVersions[roleId];
        app.versionedRoles[roleId][currentVersion].enabled = false;
    }

    /**
     * App View Functions
     */

    function getApp(uint256 appId) external view returns (VincentTypes.AppView memory) {
        VincentTypes.App storage app = apps[appId];
        return VincentTypes.AppView({
            manager: app.manager,
            enabled: app.enabled,
            roleIds: app.roleIds.values()
        });
    }
    
    function getRegisteredAppManagers() external view returns (address[] memory) {
        return registeredManagers.values();
    }

    function getRegisteredApps() external view returns (uint256[] memory) {
        return registeredApps.values();
    }
    
    function getAppManager(uint256 appId) external view returns (address) {
        return apps[appId].manager;
    }

    function isAppManager(uint256 appId, address manager) external view returns (bool) {
        return apps[appId].manager == manager;
    }

    function isAppEnabled(uint256 appId) external view returns (bool) {
        return apps[appId].enabled;
    }

    function getAppDelegatees(uint256 appId) external view returns (address[] memory) {
        return managerToAppToDelegatees[apps[appId].manager][appId].values();
    }

    function getAppManagerForDelegatee(uint256 appId, address delegatee) external view returns (address) {
        return appToDelegateeToManager[appId][delegatee];
    }

    /**
     * Manager View Functions
     */

    function getManagerApps(address manager) external view returns (uint256[] memory) {
        return managerToApps[manager].values();
    }

    function isManagerForApp(address manager, uint256 appId) external view returns (bool) {
        return managerToApps[manager].contains(appId);
    }

    /**
     * Delegatee View Functions
     */
    
    function isDelegateeForApp(uint256 appId, address delegatee) external view returns (bool) {
        address manager = apps[appId].manager;
        return managerToAppToDelegatees[manager][appId].contains(delegatee);
    }

    /**
     * Tool View Functions
     */
    function getOriginalToolCid(bytes32 hashedCid) external view returns (string memory) {
        return hashedToolCidToOriginalCid[hashedCid];
    }
}