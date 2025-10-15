// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {FeeUtils} from "./FeeUtils.sol";

contract FeeCommon {
        /* ========== MODIFIERS ========== */
    modifier nonZeroAppId(uint40 appId) {
        if (appId == 0) {
            revert FeeUtils.ZeroAppId();
        }
        _;
    }
}