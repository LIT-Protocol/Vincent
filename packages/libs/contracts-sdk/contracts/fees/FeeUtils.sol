// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./LibFeeStorage.sol";


library FeeUtils {
    using EnumerableSet for EnumerableSet.AddressSet;

    /* ========== ERRORS ========== */
    error CallerNotOwner();
    error CallerNotAppManager(uint40 appId, address caller);
    error ZeroAppId();

    /* ========== EVENTS ========== */
    event FeeCollected(uint40 indexed appId, uint256 indexed amount);
    event AppFeesWithdrawn(uint40 indexed appId, address indexed tokenAddress, uint256 amount);
    event PerformanceFeePercentageSet(uint256 newPerformanceFeePercentage);
    event SwapFeePercentageSet(uint256 newSwapFeePercentage);
    event AavePoolSet(address newAavePool);
    event AerodromeRouterSet(address newAerodromeRouter);
    event LitAppFeeSplitPercentageSet(uint256 newLitAppFeeSplitPercentage);
    event VincentAppDiamondSet(address newVincentAppDiamond);

    /* ========== FUNCTIONS ========== */
    function splitFees(uint40 appId, address token, uint256 amount) internal {
        if (amount == 0) return;
        uint256 litAmount = amount * LibFeeStorage.getStorage().litAppFeeSplitPercentage / 10000;
        uint256 appAmount = amount - litAmount;

        // add the token to the set of tokens that have collected fees
        LibFeeStorage.getStorage().tokensWithCollectedFees[LibFeeStorage.LIT_FOUNDATION_APP_ID].add(address(token));
        LibFeeStorage.getStorage().tokensWithCollectedFees[appId].add(address(token));

        // add the amount to the collected fees for the app
        LibFeeStorage.getStorage().collectedAppFees[LibFeeStorage.LIT_FOUNDATION_APP_ID][address(token)] += litAmount;
        LibFeeStorage.getStorage().collectedAppFees[appId][address(token)] += appAmount;

        emit FeeCollected(LibFeeStorage.LIT_FOUNDATION_APP_ID, litAmount);
        emit FeeCollected(appId, appAmount);
    }
}
