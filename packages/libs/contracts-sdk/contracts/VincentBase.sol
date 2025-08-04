// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "./LibVincentDiamondStorage.sol";

contract VincentBase {
    using VincentAppStorage for VincentAppStorage.AppStorage;
    using EnumerableSet for EnumerableSet.UintSet;

    error AppNotRegistered(uint40 appId);
    error AppVersionNotRegistered(uint40 appId, uint24 appVersion);
    error AppHasBeenDeleted(uint40 appId);
    error AppVersionNotEnabled(uint40 appId, uint24 appVersion);
    error InvalidOffset(uint256 offset, uint256 totalCount);

    /**
     * @notice Validates that an app exists
     * @dev Checks if the app ID is valid (non-zero and not exceeding the counter)
     * @param appId ID of the app to validate
     */
    modifier onlyRegisteredApp(uint40 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (appId == 0 || as_.appIdToApp[appId].manager == address(0)) revert AppNotRegistered(appId);
        _;
    }

    /**
     * @notice Validates that both an app and a specific version exist
     * @dev Checks app ID validity and ensures the requested version exists for that app
     * @param appId ID of the app to validate
     * @param appVersion Version number of the app to validate
     */
    modifier onlyRegisteredAppVersion(uint40 appId, uint24 appVersion) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (appId == 0 || as_.appIdToApp[appId].manager == address(0)) revert AppNotRegistered(appId);

        VincentAppStorage.App storage app = as_.appIdToApp[appId];
        if (appVersion == 0 || appVersion > app.appVersions.length) {
            revert AppVersionNotRegistered(appId, appVersion);
        }
        _;
    }

    modifier appEnabled(uint40 appId, uint24 appVersion) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (!as_.appIdToApp[appId].appVersions[getAppVersionIndex(appVersion)].enabled) {
            revert AppVersionNotEnabled(appId, appVersion);
        }
        _;
    }

    modifier appNotDeleted(uint40 appId) {
        VincentAppStorage.AppStorage storage as_ = VincentAppStorage.appStorage();
        if (as_.appIdToApp[appId].isDeleted) {
            revert AppHasBeenDeleted(appId);
        }
        _;
    }

    /**
     * @notice Converts an app version number to its corresponding array index
     * @dev App versions start at 1, but the versionedApps array is 0-indexed
     * @param version The app version number (1-based)
     * @return index The corresponding array index (0-based)
     */
    function getAppVersionIndex(uint256 version) internal pure returns (uint256 index) {
        return version - 1;
    }
}
