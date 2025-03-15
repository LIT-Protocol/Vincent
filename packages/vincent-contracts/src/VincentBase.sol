// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./LibVincentDiamondStorage.sol";

contract VincentBase {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;

    error AppNotRegistered(uint256 appId);
    error AppVersionNotRegistered(uint256 appId, uint256 appVersion);

    modifier onlyRegisteredApp(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (appId == 0 || appId > as_.appIdCounter) revert AppNotRegistered(appId);
        _;
    }

    modifier onlyRegisteredAppVersion(uint256 appId, uint256 appVersion) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (appId == 0 || appId > as_.appIdCounter) revert AppNotRegistered(appId);
        _;
    }
}
