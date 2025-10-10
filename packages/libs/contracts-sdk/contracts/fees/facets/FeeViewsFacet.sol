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
     * @param user the user to get the deposit for
     * @param vaultAddress the vault to get the deposit for
     * @return the deposit for the user and vault
     */
    function deposits(address user, address vaultAddress) external view returns (LibFeeStorage.Deposit memory) {
        return LibFeeStorage.getStorage().deposits[user][vaultAddress];
    }

    /**
     * @notice Gets the userVaultOrPoolAssetAddresses for a user
     * if this list gets too long and the view call is timing out,
     * you can use the "one at a time" functions below
     * @param user the user to get the userVaultOrPoolAssetAddresses for
     * @return the userVaultOrPoolAssetAddresses for the user
     */
    function userVaultOrPoolAssetAddresses(address user) external view returns (address[] memory) {
        return LibFeeStorage.getStorage().userVaultOrPoolAssetAddresses[user].values();
    }

    /**
     * @notice Gets the length of the userVaultOrPoolAssetAddresses for a user
     * @param user the user to get the length of the userVaultOrPoolAssetAddresses for
     * @return the length of the userVaultOrPoolAssetAddresses for the user
     */
    function userVaultOrPoolAssetAddressesLength(address user) external view returns (uint256) {
        return LibFeeStorage.getStorage().userVaultOrPoolAssetAddresses[user].length();
    }

    /**
     * @notice Gets the userVaultOrPoolAssetAddresses at the given index for a user
     * @param user the user to get the userVaultOrPoolAssetAddresses at the given index for
     * @param index the index to get the userVaultOrPoolAssetAddresses at
     * @return the userVaultOrPoolAssetAddresses at the given index for the user
     */
    function userVaultOrPoolAssetAddressesAtIndex(address user, uint256 index) external view returns (address) {
        return LibFeeStorage.getStorage().userVaultOrPoolAssetAddresses[user].at(index);
    }
}
