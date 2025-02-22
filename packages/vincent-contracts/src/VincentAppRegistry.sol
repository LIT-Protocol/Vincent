// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./VincentTypes.sol";

contract VincentAppRegistry {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.UintSet;

    struct App {
        uint256 id;
        address manager;
        bool enabled;
    }

    uint256 private appIdCounter;
    EnumerableSet.AddressSet private registeredManagers;
    EnumerableSet.UintSet private registeredApps;

    // App Manager to registered apps
    mapping(address => EnumerableSet.UintSet) private managerToApps;

    // App ID to App
    mapping(uint256 => App) private apps;

    // App Manager to App ID to Delegatees
    mapping(address => mapping(uint256 => EnumerableSet.AddressSet)) private managerToAppToDelegatees;
    // Delegatee to App Manager
    mapping(uint256 => mapping(address => address)) private appToDelegateeToManager;

    event ManagerRegistered(address manager);
    event AppRegistered(uint256 appId, address manager);
    event AppEnabled(uint256 appId);
    event AppDisabled(uint256 appId);

    error NotAppManager(uint256 appId);
    error AppNotRegistered(uint256 appId);
    error InvalidDelegatee(address delegatee);

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
        apps[appId] = App({
            id: appId,
            manager: msg.sender,
            enabled: false
        });

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
     * App View Functions
     */

    function getApp(uint256 appId) external view returns (App memory) {
        return apps[appId];
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
}