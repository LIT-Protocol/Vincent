// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../LibFeeStorage.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title FeeViewsFacet
 * @notice A contract that contains the views for the Fee Diamond
 */
contract FeeViewsFacet {
    using EnumerableSet for EnumerableSet.AddressSet;

    /* ========== VIEWS ========== */

    /**
     * @notice Gets the deposit for a user and vault
     * @param appId the app id to get the deposit for
     * @param user the user to get the deposit for
     * @param vaultAddress the vault to get the deposit for
     * @return the deposit for the user and vault
     */
    function deposits(uint40 appId, address user, address vaultAddress)
        external
        view
        returns (LibFeeStorage.Deposit memory)
    {
        return LibFeeStorage.getStorage().deposits[appId][user][vaultAddress];
    }

    /**
     * @notice Gets the collectedAppFees for a given app id
     * @param appId the app id to get the collectedAppFees for
     * @param tokenAddress the token address to get the collectedAppFees for
     * @return the collectedAppFees for the given app id
     */
    function collectedAppFees(uint40 appId, address tokenAddress) external view returns (uint256) {
        return LibFeeStorage.getStorage().collectedAppFees[appId][tokenAddress];
    }
}
