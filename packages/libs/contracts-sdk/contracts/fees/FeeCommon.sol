// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {FeeUtils} from "./FeeUtils.sol";

contract FeeCommon {
    /* ========== MODIFIERS ========== */

    // The app id 0 is reserved for internal use by the Lit Foundation
    modifier nonZeroAppId(uint40 appId) {
        if (appId == 0) {
            revert FeeUtils.ZeroAppId();
        }
        _;
    }
}
