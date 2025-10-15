// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {DeployFeeDiamond} from "../../script/DeployFeeDiamond.sol";
import {DeployVincentDiamond} from "../../script/DeployVincentDiamond.sol";

import {Fee} from "../../contracts/fees/Fee.sol";
import {FeeViewsFacet} from "../../contracts/fees/facets/FeeViewsFacet.sol";
import {FeeAdminFacet} from "../../contracts/fees/facets/FeeAdminFacet.sol";
import {AavePerfFeeFacet} from "../../contracts/fees/facets/AavePerfFeeFacet.sol";
import {LibFeeStorage} from "../../contracts/fees/LibFeeStorage.sol";
import {FeeUtils} from "../../contracts/fees/FeeUtils.sol";
import {OwnershipFacet} from "../../contracts/diamond-base/facets/OwnershipFacet.sol";

import {VincentDiamond} from "../../contracts/VincentDiamond.sol";
import {VincentAppFacet} from "../../contracts/facets/VincentAppFacet.sol";
import {VincentAppViewFacet} from "../../contracts/facets/VincentAppViewFacet.sol";
import { MockPKPNftFacet } from "../mocks/MockPKPNftFacet.sol";

import {USDC} from "../ABIs/USDC.sol";
import {IPool} from "@aave-dao/aave-v3-origin/src/contracts/interfaces/IPool.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {TestCommon} from "../TestCommon.sol";

contract AaveFeeForkTest is TestCommon {
    uint256 constant BASIS_POINT_DIVISOR = 10000;

    address owner;
    uint40 DEV_APP_ID = uint40(vm.randomUint(1, type(uint40).max));
    address APP_MANAGER_BOB = makeAddr("Bob");
    address APP_DELEGATEE_BOB = makeAddr("BobDelegatee");
    address APP_USER_ALICE = makeAddr("Alice");
    // real aave pool from https://aave.com/docs/resources/addresses
    address REAL_AAVE_POOL = 0xA238Dd80C259a72e81d7e4664a9801593F98d1c5;
    // real USDC address on base
    address REAL_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    // real USDC master_minter
    address REAL_USDC_MASTER_MINTER;
    address USDC_MINTER = makeAddr("USDCMinter");

    Fee public feeDiamond;
    FeeViewsFacet public feeViewsFacet;
    FeeAdminFacet public feeAdminFacet;
    AavePerfFeeFacet public aavePerfFeeFacet;
    OwnershipFacet public ownershipFacet;

    USDC public underlyingERC20;
    IPool public aavePool;
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
        aavePerfFeeFacet = AavePerfFeeFacet(diamondAddress);
        ownershipFacet = OwnershipFacet(diamondAddress);

        // set the aave pool address in the fee diamond
        vm.startPrank(owner);
        feeAdminFacet.setAavePool(REAL_AAVE_POOL);
        vm.stopPrank();

        // set up the real aave pool and USDC token
        aavePool = IPool(REAL_AAVE_POOL);
        underlyingERC20 = USDC(REAL_USDC);
        REAL_USDC_MASTER_MINTER = underlyingERC20.masterMinter();
        // configure the USDC minter
        vm.prank(REAL_USDC_MASTER_MINTER);
        underlyingERC20.configureMinter(USDC_MINTER, type(uint256).max);
        vm.stopPrank();
        erc20Decimals = underlyingERC20.decimals();

        DeployVincentDiamond vincentDeployScript = new DeployVincentDiamond();
        MockPKPNftFacet mockPkpNft = new MockPKPNftFacet();

        diamondAddress = vincentDeployScript.deployToNetwork("test", address(mockPkpNft));

        VincentAppFacet vincentAppFacet = VincentAppFacet(diamondAddress);
        VincentAppViewFacet vincentAppViewFacet = VincentAppViewFacet(diamondAddress);

        // register the app
        vm.startPrank(APP_MANAGER_BOB);
        address[] memory delegatees = new address[](1);
        delegatees[0] = APP_DELEGATEE_BOB;
        vincentAppFacet.registerApp(DEV_APP_ID, delegatees, _createBasicVersionAbilities("QmAbility1", "QmAbility2", "QmPolicy1"));
        vm.stopPrank();

        // set the vincent app contract address in the fee diamond
        vm.startPrank(owner);
        feeAdminFacet.setVincentAppDiamond(diamondAddress);
        vm.stopPrank();
    }

    function testSingleDepositAndWithdrawFromAaveWithProfit() public {
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
        underlyingERC20.approve(address(aavePerfFeeFacet), depositAmount);
        console.log("approved USDC to aave");
        aavePerfFeeFacet.depositToAave(DEV_APP_ID, REAL_USDC, depositAmount);
        vm.stopPrank();
        console.log("deposited to aave");

        LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(DEV_APP_ID, APP_USER_ALICE, REAL_USDC);

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);

        // confirm that the asset is in the userVaultOrPoolAssetAddresses set
        address[] memory userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
        assertEq(userVaultOrPoolAssetAddresses.length, 1);
        assertEq(userVaultOrPoolAssetAddresses[0], REAL_USDC);

        // confirm that the fee contract has the aTokens
        ERC20 aToken = ERC20(aavePool.getReserveAToken(REAL_USDC));
        uint256 userAaveTokens = aToken.balanceOf(address(APP_USER_ALICE));
        console.log("userAaveTokens", userAaveTokens);
        // due to aave fees / rounding math, we get back 1 or 2 less aToken than we deposited.  bound the result to between 0 and 2
        uint256 differenceFromExpectedAmount =
            (depositAmount / 10 ** erc20Decimals) - (userAaveTokens / 10 ** aToken.decimals());
        assertGe(differenceFromExpectedAmount, 0);
        assertLe(differenceFromExpectedAmount, 2);

        // advance timestamp to 1 week from now to accrue interest, to simulate profit
        // aave is rebasing so this should just be a bigger value of aTokens after 1 week
        vm.warp(block.timestamp + 1 weeks);
        uint256 userAaveTokensAfter1Week = aToken.balanceOf(address(APP_USER_ALICE));
        console.log("userAaveTokensAfter1Week - aka the aTokens the user has after 1 week", userAaveTokensAfter1Week);
        assertGt(userAaveTokensAfter1Week, userAaveTokens);

        // now, do the withdrawal
        vm.startPrank(APP_USER_ALICE);
        aToken.approve(address(aavePerfFeeFacet), userAaveTokensAfter1Week);
        aavePerfFeeFacet.withdrawFromAave(DEV_APP_ID, REAL_USDC, userAaveTokensAfter1Week);
        vm.stopPrank();

        // confirm the deposit is zeroed out
        d = feeViewsFacet.deposits(DEV_APP_ID, APP_USER_ALICE, REAL_USDC);

        assertEq(d.assetAmount, 0);
        assertEq(d.vaultShares, 0);
        assertEq(d.vaultProvider, 0);

        // confirm that the asset is no longer in the userVaultOrPoolAssetAddresses set
        userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
        assertEq(userVaultOrPoolAssetAddresses.length, 0);

        // confirm the profit went to the fee contract, and some went to the user
        uint256 userBalance = underlyingERC20.balanceOf(APP_USER_ALICE);
        uint256 feeContractBalance = underlyingERC20.balanceOf(address(aavePerfFeeFacet));

        uint256 expectedTotalProfit = userAaveTokensAfter1Week - depositAmount;
        uint256 expectedUserProfit =
            expectedTotalProfit - (expectedTotalProfit * performanceFeePercentage / BASIS_POINT_DIVISOR);
        uint256 expectedFeeContractProfit = expectedTotalProfit * performanceFeePercentage / BASIS_POINT_DIVISOR;
        console.log("expectedTotalProfit", expectedTotalProfit);
        console.log("expectedUserProfit", expectedUserProfit);
        console.log("expectedFeeContractProfit", expectedFeeContractProfit);
        console.log("userProfit", userBalance);
        console.log("feeContractProfit", feeContractBalance);

        assertEq(userBalance, depositAmount + expectedUserProfit);
        assertEq(feeContractBalance, expectedFeeContractProfit);

        // test that the MockERC20 is in the set of tokens that have collected fees for the foundation
        address[] memory tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(LibFeeStorage.LIT_FOUNDATION_APP_ID);
        assertEq(tokensWithCollectedFees.length, 1);
        assertEq(tokensWithCollectedFees[0], address(underlyingERC20));

        // test that the MockERC20 is in the set of tokens that have collected fees for the app
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(DEV_APP_ID);
        assertEq(tokensWithCollectedFees.length, 1);
        assertEq(tokensWithCollectedFees[0], address(underlyingERC20));

        // check the collected fees for the app for the foundation
        uint256 litCollectedAppFees = feeViewsFacet.collectedAppFees(LibFeeStorage.LIT_FOUNDATION_APP_ID, address(underlyingERC20));
        // check the collected fees for the app
        uint256 appCollectedAppFees = feeViewsFacet.collectedAppFees(DEV_APP_ID, address(underlyingERC20));
        assertEq(litCollectedAppFees + appCollectedAppFees, expectedFeeContractProfit);

        // calculate the split expected for the lit foundation, and for the app
        uint256 expectedLitCollectedAppFees = expectedFeeContractProfit * feeAdminFacet.litAppFeeSplitPercentage() / BASIS_POINT_DIVISOR;
        uint256 expectedAppCollectedAppFees = expectedFeeContractProfit - expectedLitCollectedAppFees;
        assertEq(litCollectedAppFees, expectedLitCollectedAppFees);
        assertEq(appCollectedAppFees, expectedAppCollectedAppFees);

        // test withdrawal of profit from the fee contract as owner
        vm.startPrank(owner);
        feeAdminFacet.withdrawAppFees(LibFeeStorage.LIT_FOUNDATION_APP_ID, address(underlyingERC20));
        vm.stopPrank();

        // confirm the profit went to the owner
        assertEq(underlyingERC20.balanceOf(owner), expectedLitCollectedAppFees);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(LibFeeStorage.LIT_FOUNDATION_APP_ID);
        assertEq(tokensWithCollectedFees.length, 0);

        // test withdrawal of profit from the fee contract as app manager
        vm.startPrank(APP_MANAGER_BOB);
        feeAdminFacet.withdrawAppFees(DEV_APP_ID, address(underlyingERC20));
        vm.stopPrank();

        // confirm the profit went to the owner
        assertEq(underlyingERC20.balanceOf(APP_MANAGER_BOB), expectedAppCollectedAppFees);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(DEV_APP_ID);
        assertEq(tokensWithCollectedFees.length, 0);
    }

    // function testSingleDepositAndWithdrawFromAaveWithNoProfit() public {
    //     uint256 depositAmount = 50 * 10 ** erc20Decimals;

    //     // mint the USDC to the user
    //     vm.startPrank(USDC_MINTER);
    //     underlyingERC20.mint(APP_USER_ALICE, depositAmount);
    //     vm.stopPrank();
    //     console.log("minted USDC to user");

    //     vm.startPrank(APP_USER_ALICE);
    //     underlyingERC20.approve(address(aavePerfFeeFacet), depositAmount);
    //     console.log("approved USDC to the fee contract");
    //     aavePerfFeeFacet.depositToAave(REAL_USDC, depositAmount);
    //     vm.stopPrank();
    //     console.log("deposited to aave");

    //     LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(APP_USER_ALICE, REAL_USDC);

    //     assertEq(d.assetAmount, depositAmount);
    //     console.log("d.vaultShares", d.vaultShares);
    //     console.log("d.vaultProvider", d.vaultProvider);

    //     // confirm that the asset is in the userVaultOrPoolAssetAddresses set
    //     address[] memory userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
    //     assertEq(userVaultOrPoolAssetAddresses.length, 1);
    //     assertEq(userVaultOrPoolAssetAddresses[0], REAL_USDC);

    //     // confirm that the fee contract has the aTokens
    //     ERC20 aToken = ERC20(aavePool.getReserveAToken(REAL_USDC));
    //     uint256 userAaveTokens = aToken.balanceOf(address(APP_USER_ALICE));
    //     console.log("userAaveTokens", userAaveTokens);
    //     // due to aave fees / rounding math, we get back 1 or 2 less aToken than we deposited.  bound the result to between 0 and 2
    //     uint256 differenceFromExpectedAmount =
    //         (depositAmount / 10 ** erc20Decimals) - (userAaveTokens / 10 ** aToken.decimals());
    //     assertGe(differenceFromExpectedAmount, 0);
    //     assertLe(differenceFromExpectedAmount, 2);

    //     // now, do the withdrawal
    //     vm.startPrank(APP_USER_ALICE);
    //     aToken.approve(address(aavePerfFeeFacet), userAaveTokens);
    //     aavePerfFeeFacet.withdrawFromAave(REAL_USDC, userAaveTokens);
    //     vm.stopPrank();

    //     // confirm the deposit is zeroed out
    //     d = feeViewsFacet.deposits(APP_USER_ALICE, REAL_USDC);

    //     assertEq(d.assetAmount, 0);
    //     assertEq(d.vaultShares, 0);
    //     assertEq(d.vaultProvider, 0);

    //     // confirm that the asset is no longer in the userVaultOrPoolAssetAddresses set
    //     userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
    //     assertEq(userVaultOrPoolAssetAddresses.length, 0);

    //     // confirm the profit went to the fee contract, and some went to the user
    //     uint256 userBalance = underlyingERC20.balanceOf(APP_USER_ALICE);
    //     uint256 feeContractBalance = underlyingERC20.balanceOf(address(aavePerfFeeFacet));

    //     console.log("depositAmount", depositAmount);
    //     console.log("userBalance", userBalance);

    //     // The user's balance is exactly depositAmount minus 0 through 2 due to aave aToken math and fee rounding:
    //     // When withdrawing, aave converts the aTokens back to assets, and due to integer division/rounding,
    //     // the user receives up to 2 less units than deposited. So let's bound the result to between 0 and 2
    //     uint256 differenceFromExpectedDepositAmount = depositAmount - userBalance;
    //     assertGe(differenceFromExpectedDepositAmount, 0);
    //     assertLe(differenceFromExpectedDepositAmount, 2);
    //     assertEq(feeContractBalance, 0);

    //     // test that the MockERC20 is not in the set of tokens that have collected fees
    //     address[] memory tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
    //     assertEq(tokensWithCollectedFees.length, 0);
    // }

    // function testMultipleDepositAndWithdrawFromAaveWithProfit() public {
    //     // set the performance fee percentage to 5% in basis points
    //     uint256 performanceFeePercentage = 500;

    //     // set the performance fee percentage to 5%
    //     vm.startPrank(owner);
    //     assertNotEq(feeAdminFacet.performanceFeePercentage(), performanceFeePercentage);
    //     feeAdminFacet.setPerformanceFeePercentage(performanceFeePercentage);
    //     assertEq(feeAdminFacet.performanceFeePercentage(), performanceFeePercentage);
    //     vm.stopPrank();

    //     uint256 depositAmount = 50 * 10 ** erc20Decimals;

    //     // mint the USDC to the user
    //     vm.startPrank(USDC_MINTER);
    //     underlyingERC20.mint(APP_USER_ALICE, depositAmount);
    //     vm.stopPrank();
    //     console.log("minted USDC to user");

    //     vm.startPrank(APP_USER_ALICE);
    //     underlyingERC20.approve(address(aavePerfFeeFacet), depositAmount);
    //     console.log("approved USDC to aave");
    //     aavePerfFeeFacet.depositToAave(REAL_USDC, depositAmount);
    //     vm.stopPrank();
    //     console.log("deposited to aave");

    //     LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(APP_USER_ALICE, REAL_USDC);

    //     assertEq(d.assetAmount, depositAmount);
    //     console.log("d.vaultShares", d.vaultShares);
    //     console.log("d.vaultProvider", d.vaultProvider);

    //     // confirm that the asset is in the userVaultOrPoolAssetAddresses set
    //     address[] memory userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
    //     assertEq(userVaultOrPoolAssetAddresses.length, 1);
    //     assertEq(userVaultOrPoolAssetAddresses[0], REAL_USDC);

    //     // confirm that the fee contract has the aTokens
    //     ERC20 aToken = ERC20(aavePool.getReserveAToken(REAL_USDC));
    //     uint256 userAaveTokens = aToken.balanceOf(address(APP_USER_ALICE));
    //     console.log("userAaveTokens", userAaveTokens);
    //     // due to aave fees / rounding math, we get back 1 or 2 less aToken than we deposited.  bound the result to between 0 and 2
    //     uint256 differenceFromExpectedAmount =
    //         (depositAmount / 10 ** erc20Decimals) - (userAaveTokens / 10 ** aToken.decimals());
    //     assertGe(differenceFromExpectedAmount, 0);
    //     assertLe(differenceFromExpectedAmount, 2);

    //     // deposit again
    //     vm.startPrank(USDC_MINTER);
    //     underlyingERC20.mint(APP_USER_ALICE, depositAmount);
    //     vm.stopPrank();
    //     console.log("minted USDC to user");

    //     vm.startPrank(APP_USER_ALICE);
    //     underlyingERC20.approve(address(aavePerfFeeFacet), depositAmount);
    //     console.log("approved USDC to the fee contract");
    //     aavePerfFeeFacet.depositToAave(REAL_USDC, depositAmount);
    //     vm.stopPrank();
    //     console.log("deposited to aave");

    //     // confirm that the asset is still in the userVaultOrPoolAssetAddresses set
    //     userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
    //     assertEq(userVaultOrPoolAssetAddresses.length, 1);
    //     assertEq(userVaultOrPoolAssetAddresses[0], REAL_USDC);

    //     depositAmount = depositAmount * 2;

    //     d = feeViewsFacet.deposits(APP_USER_ALICE, REAL_USDC);

    //     assertEq(d.assetAmount, depositAmount);
    //     console.log("d.vaultShares", d.vaultShares);
    //     console.log("d.vaultProvider", d.vaultProvider);

    //     // confirm that the fee contract has the aTokens
    //     userAaveTokens = aToken.balanceOf(address(APP_USER_ALICE));
    //     console.log("userAaveTokens", userAaveTokens);
    //     // due to aave fees / rounding math, we get back 1 or 2 less aToken than we deposited.  bound the result to between 0 and 2
    //     differenceFromExpectedAmount =
    //         (depositAmount / 10 ** erc20Decimals) - (userAaveTokens / 10 ** aToken.decimals());
    //     assertGe(differenceFromExpectedAmount, 0);
    //     assertLe(differenceFromExpectedAmount, 2);

    //     // advance timestamp to 1 week from now to accrue interest, to simulate profit
    //     // aave is rebasing so this should just be a bigger of aTokens after 1 week
    //     vm.warp(block.timestamp + 1 weeks);
    //     uint256 expectedTotalWithdrawal = aToken.balanceOf(address(APP_USER_ALICE));
    //     console.log(
    //         "expectedTotalWithdrawal - aka the aTokens in the user's account after 1 week", expectedTotalWithdrawal
    //     );
    //     assertGt(expectedTotalWithdrawal, userAaveTokens);

    //     // now, do the withdrawal
    //     vm.startPrank(APP_USER_ALICE);
    //     aToken.approve(address(aavePerfFeeFacet), expectedTotalWithdrawal);
    //     aavePerfFeeFacet.withdrawFromAave(REAL_USDC, expectedTotalWithdrawal);
    //     vm.stopPrank();

    //     // confirm the deposit is zeroed out
    //     d = feeViewsFacet.deposits(APP_USER_ALICE, REAL_USDC);

    //     assertEq(d.assetAmount, 0);
    //     assertEq(d.vaultShares, 0);
    //     assertEq(d.vaultProvider, 0);

    //     // confirm that the asset is no longer in the userVaultOrPoolAssetAddresses set
    //     userVaultOrPoolAssetAddresses = feeViewsFacet.userVaultOrPoolAssetAddresses(APP_USER_ALICE);
    //     assertEq(userVaultOrPoolAssetAddresses.length, 0);

    //     // confirm the profit went to the fee contract, and some went to the user
    //     uint256 userBalance = underlyingERC20.balanceOf(APP_USER_ALICE);
    //     uint256 feeContractBalance = underlyingERC20.balanceOf(address(aavePerfFeeFacet));

    //     uint256 expectedTotalProfit = expectedTotalWithdrawal - depositAmount;
    //     uint256 expectedUserProfit =
    //         expectedTotalProfit - (expectedTotalProfit * performanceFeePercentage / BASIS_POINT_DIVISOR);
    //     uint256 expectedFeeContractProfit = expectedTotalProfit * performanceFeePercentage / BASIS_POINT_DIVISOR;
    //     console.log("expectedTotalProfit", expectedTotalProfit);
    //     console.log("expectedUserProfit", expectedUserProfit);
    //     console.log("expectedFeeContractProfit", expectedFeeContractProfit);
    //     console.log("userProfit", userBalance);
    //     console.log("feeContractProfit", feeContractBalance);

    //     assertEq(userBalance, depositAmount + expectedUserProfit);
    //     assertEq(feeContractBalance, expectedFeeContractProfit);

    //     // test that the MockERC20 is in the set of tokens that have collected fees
    //     address[] memory tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
    //     assertEq(tokensWithCollectedFees.length, 1);
    //     assertEq(tokensWithCollectedFees[0], address(underlyingERC20));

    //     // test withdrawal of profit from the fee contract as owner
    //     vm.startPrank(owner);
    //     feeAdminFacet.withdrawTokens(address(underlyingERC20));
    //     vm.stopPrank();

    //     // confirm the profit went to the owner
    //     assertEq(underlyingERC20.balanceOf(owner), expectedFeeContractProfit);

    //     // confirm that the token is no longer in the set of tokens that have collected fees
    //     tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
    //     assertEq(tokensWithCollectedFees.length, 0);
    // }
}
