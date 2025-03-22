// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./LibVincentDiamondStorage.sol";

contract VincentBase {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;

    error AppNotRegistered(uint256 appId);
    error AppVersionNotRegistered(uint256 appId, uint256 appVersion);

    /**
     * @notice Validates that an app exists
     * @dev Checks if the app ID is valid (non-zero and not exceeding the counter)
     * @param appId ID of the app to validate
     */
    modifier onlyRegisteredApp(uint256 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (appId == 0 || appId > as_.appIdCounter) revert AppNotRegistered(appId);
        _;
    }

    /**
     * @notice Validates that both an app and a specific version exist
     * @dev Checks app ID validity and ensures the requested version exists for that app
     * @param appId ID of the app to validate
     * @param appVersion Version number of the app to validate
     */
    modifier onlyRegisteredAppVersion(uint256 appId, uint256 appVersion) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (appId == 0 || appId > as_.appIdCounter) revert AppNotRegistered(appId);

        // Also validate the app version exists
        VincentAppStorage.App storage app = as_.appIdToApp[appId];
        if (appVersion == 0 || appVersion > app.versionedApps.length) {
            revert AppVersionNotRegistered(appId, appVersion);
        }
        _;
    }

    /**
     * @notice Converts an app version number to its corresponding array index
     * @dev App versions start at 1, but the versionedApps array is 0-indexed
     * @param version The app version number (1-based)
     * @return index The corresponding array index (0-based)
     */
    function getVersionedAppIndex(uint256 version) internal pure returns (uint256 index) {
        return version - 1;
    }
}
