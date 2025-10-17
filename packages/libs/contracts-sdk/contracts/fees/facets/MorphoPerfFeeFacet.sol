// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../LibFeeStorage.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title MorphoPerfFeeFacet
 * @notice A facet of the Fee Diamond that manages Morpho performance fees
 * @dev This contract simply tracks morpho deposits and takes a performance fee from the withdrawals
 */
contract MorphoPerfFeeFacet {
    using EnumerableSet for EnumerableSet.AddressSet;
    /* ========== ERRORS ========== */

    // thrown when a deposit is not found on withdrawal
    error DepositNotFound(address user, address vaultAddress);

    // thrown when a withdrawal is not from a Morpho vault
    error NotMorphoVault(address user, address vaultAddress);

    // thrown when a deposit already exists with another provider
    error DepositAlreadyExistsWithAnotherProvider(address user, address vaultAddress);

    // 1 = Morpho
    uint256 private constant VAULT_PROVIDER = 1;

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Deposits assets into Morpho
     * @param vaultAddress the address of the vault to deposit into
     * @param assetAmount the amount of assets to deposit
     */
    function depositToMorpho(address vaultAddress, uint256 assetAmount) external {
        // get the vault and asset
        ERC4626 vault = ERC4626(vaultAddress);
        IERC20 asset = IERC20(vault.asset());

        // transfer the assets into this contract
        asset.transferFrom(msg.sender, address(this), assetAmount);

        // approve morpho
        asset.approve(vaultAddress, assetAmount);

        // send it into morpho
        uint256 vaultShares = vault.deposit(assetAmount, address(this));

        // track the deposit
        LibFeeStorage.Deposit storage deposit = LibFeeStorage.getStorage().deposits[msg.sender][vaultAddress];
        if (deposit.vaultProvider != 0 && deposit.vaultProvider != VAULT_PROVIDER) {
            revert DepositAlreadyExistsWithAnotherProvider(msg.sender, vaultAddress);
        }

        deposit.assetAmount += assetAmount;
        deposit.vaultShares += vaultShares;
        deposit.vaultProvider = VAULT_PROVIDER;

        // add the vault address to the set of vault or pool asset addresses
        // so the user can find their deposits later
        LibFeeStorage.getStorage().userVaultOrPoolAssetAddresses[msg.sender].add(vaultAddress);
    }

    /**
     * @notice Withdraws funds from Morpho.  Only supports full withdrawals.
     * @param vaultAddress the address of the vault to withdraw from
     */
    function withdrawFromMorpho(address vaultAddress) external {
        // lookup the corresponding deposit
        LibFeeStorage.Deposit memory deposit = LibFeeStorage.getStorage().deposits[msg.sender][vaultAddress];
        if (deposit.assetAmount == 0) revert DepositNotFound(msg.sender, vaultAddress);

        if (deposit.vaultProvider != VAULT_PROVIDER) revert NotMorphoVault(msg.sender, vaultAddress);

        uint256 depositAssetAmount = deposit.assetAmount;
        uint256 depositVaultShares = deposit.vaultShares;

        // zero out the struct now before we call any other
        // contracts to prevent reentrancy attacks
        delete LibFeeStorage.getStorage().deposits[msg.sender][vaultAddress];

        // remove the vault address from the set of vault or pool asset addresses
        // so the user can't find their deposits later
        LibFeeStorage.getStorage().userVaultOrPoolAssetAddresses[msg.sender].remove(vaultAddress);

        // get the vault and asset
        ERC4626 vault = ERC4626(vaultAddress);
        IERC20 asset = IERC20(vault.asset());

        // perform the withdrawal with morpho
        // and send the assets to this contract
        uint256 withdrawAssetAmount = vault.redeem(depositVaultShares, address(this), address(this));

        uint256 performanceFeeAmount = 0;
        if (withdrawAssetAmount > depositAssetAmount) {
            // there's a profit, calculate fee
            // performance fee is in basis points
            // so divide by 10000 to use it as a percentage
            performanceFeeAmount = (withdrawAssetAmount - depositAssetAmount)
                * LibFeeStorage.getStorage().performanceFeePercentage / 10000;
        }

        // add the token to the set of tokens that have collected fees
        if (performanceFeeAmount > 0) {
            LibFeeStorage.getStorage().tokensWithCollectedFees.add(address(asset));
        }

        // no need to send the performance fee anywhere
        // because it's collected in this contract, and
        // at this point this contract already has the whole token amount
        // so we can just transfer the difference without the perf fee to
        // the user
        asset.transfer(msg.sender, withdrawAssetAmount - performanceFeeAmount);
    }
}
