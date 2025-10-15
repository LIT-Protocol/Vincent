// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../LibFeeStorage.sol";
import {IPool} from "@aave-dao/aave-v3-origin/src/contracts/interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {FeeCommon} from "../FeeCommon.sol";
import {FeeUtils} from "../FeeUtils.sol";

/**
 * @title AavePerfFeeFacet
 * @notice A facet of the Fee Diamond that manages Aave performance fees
 * @dev This contract simply tracks Aave deposits and takes a performance fee from the withdrawals
 */
contract AavePerfFeeFacet is FeeCommon {
    using EnumerableSet for EnumerableSet.AddressSet;
    /* ========== ERRORS ========== */

    // thrown when a deposit is not found on withdrawal
    error DepositNotFound(address user, address poolAddress);

    // thrown when a withdrawal is not from a Aave pool
    error NotAavePool(address user, address poolAddress);

    // thrown when a deposit already exists with another provider
    error DepositAlreadyExistsWithAnotherProvider(address user, address poolAddress);

    // 2 = Aave
    uint256 private constant VAULT_PROVIDER = 2;

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Deposits assets into Aave
     * @param appId the app id that is depositing the funds
     * @param poolAsset the address of the pool asset to deposit into
     * @param assetAmount the amount of assets to deposit
     */
    function depositToAave(uint40 appId, address poolAsset, uint256 assetAmount) external nonZeroAppId(appId) {
        // get the aave pool contract and asset
        IPool aave = IPool(LibFeeStorage.getStorage().aavePool);
        IERC20 asset = IERC20(poolAsset);

        // transfer the assets into this contract
        asset.transferFrom(msg.sender, address(this), assetAmount);

        // approve aave
        asset.approve(address(aave), assetAmount);

        // send it into aave
        aave.supply(poolAsset, assetAmount, msg.sender, 0);

        // track the deposit
        LibFeeStorage.Deposit storage deposit = LibFeeStorage.getStorage().deposits[appId][msg.sender][poolAsset];
        if (deposit.vaultProvider != 0 && deposit.vaultProvider != VAULT_PROVIDER) {
            revert DepositAlreadyExistsWithAnotherProvider(msg.sender, poolAsset);
        }

        deposit.assetAmount += assetAmount;
        deposit.vaultProvider = VAULT_PROVIDER;

        // add the pool asset address to the set of vault or pool asset addresses
        // so the user can find their deposits later
        LibFeeStorage.getStorage().userVaultOrPoolAssetAddresses[msg.sender].add(poolAsset);

        emit FeeUtils.DepositAdded(appId, poolAsset, assetAmount, VAULT_PROVIDER);
    }

    /**
     * @notice Withdraws funds from Aave.  Only supports full withdrawals.
     * @param appId the app id that is withdrawing the funds
     * @param poolAsset the address of the pool asset to withdraw from
     * @param amount the amount of assets to withdraw
     */
    function withdrawFromAave(uint40 appId, address poolAsset, uint256 amount) external nonZeroAppId(appId) {
        // lookup the corresponding deposit
        LibFeeStorage.Deposit memory deposit = LibFeeStorage.getStorage().deposits[appId][msg.sender][poolAsset];
        if (deposit.assetAmount == 0) revert DepositNotFound(msg.sender, poolAsset);

        if (deposit.vaultProvider != VAULT_PROVIDER) revert NotAavePool(msg.sender, poolAsset);

        uint256 depositAssetAmount = deposit.assetAmount;

        // zero out the struct now before we call any other
        // contracts to prevent reentrancy attacks
        delete LibFeeStorage.getStorage().deposits[appId][msg.sender][poolAsset];

        // remove the pool asset address from the set of vault or pool asset addresses
        // so the user can't find their deposits later
        LibFeeStorage.getStorage().userVaultOrPoolAssetAddresses[msg.sender].remove(poolAsset);

        // get the aave pool contract and asset
        IPool aave = IPool(LibFeeStorage.getStorage().aavePool);
        IERC20 asset = IERC20(poolAsset);
        IERC20 aToken = IERC20(aave.getReserveAToken(poolAsset));

        // transfer the aave tokens to this contract, so we can we use them to withdraw from aave
        aToken.transferFrom(msg.sender, address(this), amount);
        aToken.approve(address(aave), amount);

        // withdraw the assets from aave into this contract
        uint256 withdrawAssetAmount = aave.withdraw(poolAsset, amount, address(this));

        uint256 performanceFeeAmount = 0;
        if (withdrawAssetAmount > depositAssetAmount) {
            // there's a profit, calculate fee
            // performance fee is in basis points
            // so divide by 10000 to use it as a percentage
            performanceFeeAmount =
                (withdrawAssetAmount - depositAssetAmount) * LibFeeStorage.getStorage().performanceFeePercentage / 10000;
        }

        // add the token to the set of tokens that have collected fees
        FeeUtils.splitFees(appId, address(asset), performanceFeeAmount);

        // no need to send the performance fee anywhere
        // because it's collected in this contract, and
        // at this point this contract already has the whole token amount
        // so we can just transfer the difference without the perf fee to
        // the user
        asset.transfer(msg.sender, withdrawAssetAmount - performanceFeeAmount);

        emit FeeUtils.DepositWithdrawn(appId, poolAsset, depositAssetAmount, VAULT_PROVIDER);
    }
}
