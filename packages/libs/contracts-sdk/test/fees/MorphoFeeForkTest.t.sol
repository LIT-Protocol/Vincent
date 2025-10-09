// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployFeeDiamond} from "../../script/DeployFeeDiamond.sol";

import {Fee} from "../../contracts/fees/Fee.sol";
import {FeeViewsFacet} from "../../contracts/fees/facets/FeeViewsFacet.sol";
import {FeeAdminFacet} from "../../contracts/fees/facets/FeeAdminFacet.sol";
import {MorphoPerfFeeFacet} from "../../contracts/fees/facets/MorphoPerfFeeFacet.sol";
import {LibFeeStorage} from "../../contracts/fees/LibFeeStorage.sol";
import {FeeUtils} from "../../contracts/fees/FeeUtils.sol";
import {OwnershipFacet} from "../../contracts/diamond-base/facets/OwnershipFacet.sol";

import {USDC} from "../ABIs/USDC.sol";
import {MorphoVault} from "../ABIs/MorphoVault.sol";
import {Morpho} from "../ABIs/Morpho.sol";

contract FeeForkTest is Test {
    address owner;
    address APP_USER_ALICE = makeAddr("Alice");
    // real morpho vault on base from https://app.morpho.org/base/vault/0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A/spark-usdc-vault
    address REAL_MORPHO_VAULT = 0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A;
    // real USDC address on base
    address REAL_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    // real USDC master_minter
    address REAL_USDC_MASTER_MINTER;
    address USDC_MINTER = makeAddr("USDCMinter");

    Fee public feeDiamond;
    FeeViewsFacet public feeViewsFacet;
    FeeAdminFacet public feeAdminFacet;
    MorphoPerfFeeFacet public morphoPerfFeeFacet;
    OwnershipFacet public ownershipFacet;

    USDC public underlyingERC20;
    MorphoVault public morphoVault;
    Morpho public morpho;
    uint256 public erc20Decimals;

    function setUp() public {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));
        owner = vm.addr(deployerPrivateKey);

        DeployFeeDiamond deployScript = new DeployFeeDiamond();

        address diamondAddress = deployScript.deployToNetwork("test", keccak256("testSalt"));
        feeDiamond = Fee(payable(diamondAddress));

        feeViewsFacet = FeeViewsFacet(diamondAddress);
        feeAdminFacet = FeeAdminFacet(diamondAddress);
        morphoPerfFeeFacet = MorphoPerfFeeFacet(diamondAddress);
        ownershipFacet = OwnershipFacet(diamondAddress);

        // set up the real morpho vault and USDC token
        morphoVault = MorphoVault(REAL_MORPHO_VAULT);
        underlyingERC20 = USDC(morphoVault.asset());
        REAL_USDC_MASTER_MINTER = underlyingERC20.masterMinter();
        // configure the USDC minter
        vm.prank(REAL_USDC_MASTER_MINTER);
        underlyingERC20.configureMinter(USDC_MINTER, type(uint256).max);
        vm.stopPrank();
        morpho = Morpho(morphoVault.MORPHO());
        erc20Decimals = underlyingERC20.decimals();
        console.log("setUp complete");
    }

    function testSingleDepositAndWithdrawFromMorphoWithProfit() public {
        // set the performance fee percentage to 5% in basis points
        uint256 performanceFeePercentage = 500;

        // set the performance fee percentage to 5%
        vm.startPrank(owner);
        assertNotEq(feeAdminFacet.performanceFeePercentage(), performanceFeePercentage);
        feeAdminFacet.setPerformanceFeePercentage(performanceFeePercentage);
        assertEq(feeAdminFacet.performanceFeePercentage(), performanceFeePercentage);
        vm.stopPrank();

        uint256 depositAmount = 50 * 10 ** erc20Decimals;

        // mint the USDC to the user
        vm.startPrank(USDC_MINTER);
        underlyingERC20.mint(APP_USER_ALICE, depositAmount);
        vm.stopPrank();
        console.log("minted USDC to user");

        vm.startPrank(APP_USER_ALICE);
        underlyingERC20.approve(address(morphoPerfFeeFacet), depositAmount);
        console.log("approved USDC to morpho");
        morphoPerfFeeFacet.depositToMorpho(address(morphoVault), depositAmount);
        vm.stopPrank();
        console.log("deposited to morpho");

        LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(APP_USER_ALICE, address(morphoVault));

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);
        // confirm that the user has the vault shares
        uint256 feeContractVaultShares = morphoVault.balanceOf(address(morphoPerfFeeFacet));
        console.log("feeContractVaultShares", feeContractVaultShares);
        assertEq(feeContractVaultShares, d.vaultShares);

        // confirm that the asset is in the userVaultOrPoolAssetAddresses set
        address[] memory userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
        assertEq(userVaultOrPoolAssetAddresses.length, 1);
        assertEq(userVaultOrPoolAssetAddresses[0], address(morphoVault));

        // find the underlying morpho market and advance timestamp to 1 week from now to accrue interest, to simulate profit
        uint256 withdrawalQueueLength = morphoVault.withdrawQueueLength();
        console.log("withdrawalQueueLength", withdrawalQueueLength);
        assertGt(withdrawalQueueLength, 0);
        Morpho.Id withdrawalQueueEntryHash = Morpho.Id.wrap(MorphoVault.Id.unwrap(morphoVault.withdrawQueue(0)));
        (address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) =
            morpho.idToMarketParams(withdrawalQueueEntryHash);
        vm.warp(block.timestamp + 1 weeks);
        morpho.accrueInterest(
            Morpho.MarketParams({
                loanToken: loanToken, collateralToken: collateralToken, oracle: oracle, irm: irm, lltv: lltv
            })
        );

        // check that asset balance will be higher if we withdraw
        uint256 expectedTotalWithdrawal = morphoVault.convertToAssets(d.vaultShares);
        console.log("expectedTotalWithdrawal", expectedTotalWithdrawal);
        assertEq(expectedTotalWithdrawal > depositAmount, true);

        vm.startPrank(APP_USER_ALICE);
        morphoPerfFeeFacet.withdrawFromMorpho(address(morphoVault));
        vm.stopPrank();

        // confirm the deposit is zeroed out
        d = feeViewsFacet.deposits(APP_USER_ALICE, address(morphoVault));

        assertEq(d.assetAmount, 0);
        assertEq(d.vaultShares, 0);
        assertEq(d.vaultProvider, 0);

        // confirm that the asset is no longer in the userVaultOrPoolAssetAddresses set
        userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
        assertEq(userVaultOrPoolAssetAddresses.length, 0);

        // confirm the profit went to the fee contract, and some went to the user
        uint256 userBalance = underlyingERC20.balanceOf(APP_USER_ALICE);
        uint256 feeContractBalance = underlyingERC20.balanceOf(address(morphoPerfFeeFacet));

        uint256 expectedTotalProfit = expectedTotalWithdrawal - depositAmount;
        uint256 expectedUserProfit = expectedTotalProfit - (expectedTotalProfit * performanceFeePercentage / 10000);
        uint256 expectedFeeContractProfit = expectedTotalProfit * performanceFeePercentage / 10000;
        console.log("expectedTotalProfit", expectedTotalProfit);
        console.log("expectedUserProfit", expectedUserProfit);
        console.log("expectedFeeContractProfit", expectedFeeContractProfit);
        console.log("userProfit", userBalance);
        console.log("feeContractProfit", feeContractBalance);

        assertEq(userBalance, depositAmount + expectedUserProfit);
        assertEq(feeContractBalance, expectedFeeContractProfit);

        // test that the MockERC20 is in the set of tokens that have collected fees
        address[] memory tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
        assertEq(tokensWithCollectedFees.length, 1);
        assertEq(tokensWithCollectedFees[0], address(underlyingERC20));

        // test withdrawal of profit from the fee contract as owner
        vm.startPrank(owner);
        feeAdminFacet.withdrawTokens(address(underlyingERC20));
        vm.stopPrank();

        // confirm the profit went to the owner
        assertEq(underlyingERC20.balanceOf(owner), expectedFeeContractProfit);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
        assertEq(tokensWithCollectedFees.length, 0);
    }

    function testSingleDepositAndWithdrawFromMorphoWithNoProfit() public {
        // the user will deposit 50 USDC and withdraw it without any profit
        uint256 depositAmount = 50 * 10 ** erc20Decimals;

        // mint the USDC to the user
        vm.startPrank(USDC_MINTER);
        underlyingERC20.mint(APP_USER_ALICE, depositAmount);
        vm.stopPrank();

        vm.startPrank(APP_USER_ALICE);
        underlyingERC20.approve(address(morphoPerfFeeFacet), depositAmount);
        morphoPerfFeeFacet.depositToMorpho(address(morphoVault), depositAmount);
        vm.stopPrank();

        LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(APP_USER_ALICE, address(morphoVault));

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);
        // confirm that the user has the vault shares
        uint256 feeContractVaultShares = morphoVault.balanceOf(address(morphoPerfFeeFacet));
        console.log("feeContractVaultShares", feeContractVaultShares);
        assertEq(feeContractVaultShares, d.vaultShares);

        // confirm that the asset is in the userVaultOrPoolAssetAddresses set
        address[] memory userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
        assertEq(userVaultOrPoolAssetAddresses.length, 1);
        assertEq(userVaultOrPoolAssetAddresses[0], address(morphoVault));

        // check that asset balance will be slightly lower if we withdraw now, due to fees / rounding
        uint256 expectedTotalWithdrawal = morphoVault.convertToAssets(d.vaultShares);
        console.log("expectedTotalWithdrawal", expectedTotalWithdrawal);
        assertEq(expectedTotalWithdrawal < depositAmount, true);

        vm.startPrank(APP_USER_ALICE);
        morphoPerfFeeFacet.withdrawFromMorpho(address(morphoVault));
        vm.stopPrank();

        // confirm the deposit is zeroed out
        d = feeViewsFacet.deposits(APP_USER_ALICE, address(morphoVault));

        assertEq(d.assetAmount, 0);
        assertEq(d.vaultShares, 0);
        assertEq(d.vaultProvider, 0);

        // confirm that the asset is no longer in the userVaultOrPoolAssetAddresses set
        userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
        assertEq(userVaultOrPoolAssetAddresses.length, 0);

        // confirm there was no profit
        uint256 userBalance = underlyingERC20.balanceOf(APP_USER_ALICE);
        uint256 feeContractBalance = underlyingERC20.balanceOf(address(morphoPerfFeeFacet));

        console.log("depositAmount", depositAmount);
        console.log("userBalance", userBalance);

        // The user's balance is exactly depositAmount - 1 due to vault share math and fee rounding:
        // When withdrawing, the vault converts shares back to assets, and due to integer division/rounding,
        // the user receives one less unit than deposited. This is expected for this test scenario.
        assertEq(userBalance, depositAmount - 1);
        assertEq(feeContractBalance, 0);

        // test that the MockERC20 is not in the set of tokens that have collected fees
        address[] memory tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
        assertEq(tokensWithCollectedFees.length, 0);
    }

    function testMultipleDepositAndWithdrawFromMorphoWithProfit() public {
        // set the performance fee percentage to 5% in basis points
        uint256 performanceFeePercentage = 500;

        // set the performance fee percentage to 5%
        vm.startPrank(owner);
        assertNotEq(feeAdminFacet.performanceFeePercentage(), performanceFeePercentage);
        feeAdminFacet.setPerformanceFeePercentage(performanceFeePercentage);
        assertEq(feeAdminFacet.performanceFeePercentage(), performanceFeePercentage);
        vm.stopPrank();

        uint256 depositAmount = 50 * 10 ** erc20Decimals;

        // mint the USDC to the user
        vm.startPrank(USDC_MINTER);
        underlyingERC20.mint(APP_USER_ALICE, depositAmount);
        vm.stopPrank();

        vm.startPrank(APP_USER_ALICE);
        underlyingERC20.approve(address(morphoPerfFeeFacet), depositAmount);
        morphoPerfFeeFacet.depositToMorpho(address(morphoVault), depositAmount);
        vm.stopPrank();

        LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(APP_USER_ALICE, address(morphoVault));

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);
        // confirm that the user has the vault shares
        uint256 feeContractVaultShares = morphoVault.balanceOf(address(morphoPerfFeeFacet));
        console.log("feeContractVaultShares", feeContractVaultShares);
        assertEq(feeContractVaultShares, d.vaultShares);

        // confirm that the asset is in the userVaultOrPoolAssetAddresses set
        address[] memory userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
        assertEq(userVaultOrPoolAssetAddresses.length, 1);
        assertEq(userVaultOrPoolAssetAddresses[0], address(morphoVault));

        // deposit again
        vm.startPrank(USDC_MINTER);
        underlyingERC20.mint(APP_USER_ALICE, depositAmount);
        vm.stopPrank();
        vm.startPrank(APP_USER_ALICE);
        underlyingERC20.approve(address(morphoPerfFeeFacet), depositAmount);
        morphoPerfFeeFacet.depositToMorpho(address(morphoVault), depositAmount);
        vm.stopPrank();

        // confirm that the asset is still in the userVaultOrPoolAssetAddresses set
        userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
        assertEq(userVaultOrPoolAssetAddresses.length, 1);
        assertEq(userVaultOrPoolAssetAddresses[0], address(morphoVault));

        // deposited twice, so total deposit amount is times 2
        depositAmount = depositAmount * 2;

        d = feeViewsFacet.deposits(APP_USER_ALICE, address(morphoVault));

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);
        // confirm that the user has the vault shares
        feeContractVaultShares = morphoVault.balanceOf(address(morphoPerfFeeFacet));
        console.log("feeContractVaultShares", feeContractVaultShares);
        assertEq(feeContractVaultShares, d.vaultShares);

        // find the underlying morpho market and advance timestamp to 1 week from now to accrue interest, to simulate profit
        uint256 withdrawalQueueLength = morphoVault.withdrawQueueLength();
        console.log("withdrawalQueueLength", withdrawalQueueLength);
        assertGt(withdrawalQueueLength, 0);
        Morpho.Id withdrawalQueueEntryHash = Morpho.Id.wrap(MorphoVault.Id.unwrap(morphoVault.withdrawQueue(0)));
        (address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) =
            morpho.idToMarketParams(withdrawalQueueEntryHash);
        vm.warp(block.timestamp + 1 weeks);
        morpho.accrueInterest(
            Morpho.MarketParams({
                loanToken: loanToken, collateralToken: collateralToken, oracle: oracle, irm: irm, lltv: lltv
            })
        );

        // check that asset balance will be higher if we withdraw
        uint256 expectedTotalWithdrawal = morphoVault.convertToAssets(d.vaultShares);
        console.log("expectedTotalWithdrawal", expectedTotalWithdrawal);
        assertEq(expectedTotalWithdrawal > depositAmount, true);

        vm.startPrank(APP_USER_ALICE);
        morphoPerfFeeFacet.withdrawFromMorpho(address(morphoVault));
        vm.stopPrank();

        // confirm the deposit is zeroed out
        d = feeViewsFacet.deposits(APP_USER_ALICE, address(morphoVault));

        assertEq(d.assetAmount, 0);
        assertEq(d.vaultShares, 0);
        assertEq(d.vaultProvider, 0);

        // confirm that the asset is no longer in the userVaultOrPoolAssetAddresses set
        userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
        assertEq(userVaultOrPoolAssetAddresses.length, 0);

        // confirm the profit went to the fee contract, and some went to the user
        uint256 userBalance = underlyingERC20.balanceOf(APP_USER_ALICE);
        uint256 feeContractBalance = underlyingERC20.balanceOf(address(morphoPerfFeeFacet));

        uint256 expectedTotalProfit = expectedTotalWithdrawal - depositAmount;
        uint256 expectedUserProfit = expectedTotalProfit - (expectedTotalProfit * performanceFeePercentage / 10000);
        uint256 expectedFeeContractProfit = expectedTotalProfit * performanceFeePercentage / 10000;
        console.log("expectedTotalProfit", expectedTotalProfit);
        console.log("expectedUserProfit", expectedUserProfit);
        console.log("expectedFeeContractProfit", expectedFeeContractProfit);
        console.log("userProfit", userBalance);
        console.log("feeContractProfit", feeContractBalance);

        assertEq(userBalance, depositAmount + expectedUserProfit);
        assertEq(feeContractBalance, expectedFeeContractProfit);

        // test that the MockERC20 is in the set of tokens that have collected fees
        address[] memory tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
        assertEq(tokensWithCollectedFees.length, 1);
        assertEq(tokensWithCollectedFees[0], address(underlyingERC20));

        // test withdrawal of profit from the fee contract as owner
        vm.startPrank(owner);
        feeAdminFacet.withdrawTokens(address(underlyingERC20));
        vm.stopPrank();

        // confirm the profit went to the owner
        assertEq(underlyingERC20.balanceOf(owner), expectedFeeContractProfit);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
        assertEq(tokensWithCollectedFees.length, 0);
    }
}
