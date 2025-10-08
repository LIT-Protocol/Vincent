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

import {MockERC4626} from "../mocks/MockERC4626.sol";
import {MockERC20} from "../mocks/MockERC20.sol";


contract FeeTest is Test {
    address owner;
    address APP_USER_ALICE = makeAddr("Alice");

    Fee public feeDiamond;
    FeeViewsFacet public feeViewsFacet;
    FeeAdminFacet public feeAdminFacet;
    MorphoPerfFeeFacet public morphoPerfFeeFacet;
    OwnershipFacet public ownershipFacet;

    MockERC20 public mockERC20;
    MockERC4626 public mockERC4626;

    function setUp() public {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));
        owner = vm.addr(deployerPrivateKey);

        DeployFeeDiamond deployScript = new DeployFeeDiamond();

        address diamondAddress = deployScript.deployToNetwork("test");
        feeDiamond = Fee(payable(diamondAddress));


        feeViewsFacet = FeeViewsFacet(diamondAddress);
        feeAdminFacet = FeeAdminFacet(diamondAddress);
        morphoPerfFeeFacet = MorphoPerfFeeFacet(diamondAddress);
        ownershipFacet = OwnershipFacet(diamondAddress);
        
        // deploy an ERC20 and 4626 (morpho style) vault
        mockERC20 = new MockERC20();
        mockERC4626 = new MockERC4626(address(mockERC20));
    }

    function testSingleDepositAndWithdrawFromMorpho() public {
        // set the performance fee percentage to 5% in basis points
        uint256 performanceFeePercentage = 500;

        // set the performance fee percentage to 5%
        vm.startPrank(owner);
        assertNotEq(feeAdminFacet.performanceFeePercentage(), performanceFeePercentage);
        feeAdminFacet.setPerformanceFeePercentage(performanceFeePercentage);
        assertEq(feeAdminFacet.performanceFeePercentage(), performanceFeePercentage);
        vm.stopPrank();


        uint256 depositAmount = 1000;

        mockERC20.mint(APP_USER_ALICE, depositAmount);
        vm.startPrank(APP_USER_ALICE);
        mockERC20.approve(address(morphoPerfFeeFacet), depositAmount);
        morphoPerfFeeFacet.depositToMorpho(address(mockERC4626), depositAmount);
        vm.stopPrank();


        LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(APP_USER_ALICE,address(mockERC4626));

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);
        // confirm that the user has the vault shares
        uint256 feeContractVaultShares = mockERC4626.balanceOf(address(morphoPerfFeeFacet));
        console.log("feeContractVaultShares", feeContractVaultShares);
        assertEq(feeContractVaultShares, d.vaultShares);

        // send more assets to the vault to create profit
        mockERC20.mint(address(mockERC4626), 100);

        // check that asset balance will be higher if we withdraw
        uint256 expectedTotalWithdrawl = mockERC4626.convertToAssets(d.vaultShares);
        console.log("expectedTotalWithdrawl", expectedTotalWithdrawl);
        assertEq(expectedTotalWithdrawl > depositAmount, true);

        vm.startPrank(APP_USER_ALICE);
        morphoPerfFeeFacet.withdrawFromMorpho(address(mockERC4626));
        vm.stopPrank();

        // confirm the deposit is zeroed out
        d = feeViewsFacet.deposits(APP_USER_ALICE,address(mockERC4626));

        assertEq(d.assetAmount, 0);
        assertEq(d.vaultShares, 0);
        assertEq(d.vaultProvider, 0);

        // confirm the profit went to the morpho contract, and some went to the user
        uint256 userBalance = mockERC20.balanceOf(APP_USER_ALICE);
        uint256 feeContractBalance = mockERC20.balanceOf(address(morphoPerfFeeFacet));
        
        uint256 expectedTotalProfit = expectedTotalWithdrawl - depositAmount;
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
        assertEq(tokensWithCollectedFees[0], address(mockERC20));

        // test withdrawal of profit from the fee contract as owner
        vm.startPrank(owner);
        feeAdminFacet.withdrawTokens(address(mockERC20));
        vm.stopPrank();

        // confirm the profit went to the owner
        assertEq(mockERC20.balanceOf(owner), expectedFeeContractProfit);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
        assertEq(tokensWithCollectedFees.length, 0);
    }

    function testMultipleDepositAndWithdrawFromMorpho() public {
        // set the performance fee percentage to 5% in basis points
        uint256 performanceFeePercentage = 500;

        // set the performance fee percentage to 5%
        vm.startPrank(owner);
        assertNotEq(feeAdminFacet.performanceFeePercentage(), performanceFeePercentage);
        feeAdminFacet.setPerformanceFeePercentage(performanceFeePercentage);
        assertEq(feeAdminFacet.performanceFeePercentage(), performanceFeePercentage);
        vm.stopPrank();


        uint256 depositAmount = 1000;

        mockERC20.mint(APP_USER_ALICE, depositAmount);
        vm.startPrank(APP_USER_ALICE);
        mockERC20.approve(address(morphoPerfFeeFacet), depositAmount);
        morphoPerfFeeFacet.depositToMorpho(address(mockERC4626), depositAmount);
        vm.stopPrank();


        LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(APP_USER_ALICE,address(mockERC4626));

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);
        // confirm that the user has the vault shares
        uint256 feeContractVaultShares = mockERC4626.balanceOf(address(morphoPerfFeeFacet));
        console.log("feeContractVaultShares", feeContractVaultShares);
        assertEq(feeContractVaultShares, d.vaultShares);

        // deposit again
        mockERC20.mint(APP_USER_ALICE, depositAmount);
        vm.startPrank(APP_USER_ALICE);
        mockERC20.approve(address(morphoPerfFeeFacet), depositAmount);
        morphoPerfFeeFacet.depositToMorpho(address(mockERC4626), depositAmount);
        vm.stopPrank();

        // deposited twice, so total deposit amount is times 2
        depositAmount = depositAmount * 2;

        d = feeViewsFacet.deposits(APP_USER_ALICE,address(mockERC4626));

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);
        // confirm that the user has the vault shares
        feeContractVaultShares = mockERC4626.balanceOf(address(morphoPerfFeeFacet));
        console.log("feeContractVaultShares", feeContractVaultShares);
        assertEq(feeContractVaultShares, d.vaultShares);

        // send more assets to the vault to create profit
        mockERC20.mint(address(mockERC4626), 100);

        // check that asset balance will be higher if we withdraw
        uint256 expectedTotalWithdrawl = mockERC4626.convertToAssets(d.vaultShares);
        console.log("expectedTotalWithdrawl", expectedTotalWithdrawl);
        assertEq(expectedTotalWithdrawl > depositAmount, true);

        vm.startPrank(APP_USER_ALICE);
        morphoPerfFeeFacet.withdrawFromMorpho(address(mockERC4626));
        vm.stopPrank();

        // confirm the deposit is zeroed out
        d = feeViewsFacet.deposits(APP_USER_ALICE,address(mockERC4626));

        assertEq(d.assetAmount, 0);
        assertEq(d.vaultShares, 0);
        assertEq(d.vaultProvider, 0);

        // confirm the profit went to the morpho contract, and some went to the user
        uint256 userBalance = mockERC20.balanceOf(APP_USER_ALICE);
        uint256 feeContractBalance = mockERC20.balanceOf(address(morphoPerfFeeFacet));
        
        uint256 expectedTotalProfit = expectedTotalWithdrawl - depositAmount;
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
        assertEq(tokensWithCollectedFees[0], address(mockERC20));

        // test withdrawal of profit from the fee contract as owner
        vm.startPrank(owner);
        feeAdminFacet.withdrawTokens(address(mockERC20));
        vm.stopPrank();

        // confirm the profit went to the owner
        assertEq(mockERC20.balanceOf(owner), expectedFeeContractProfit);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees();
        assertEq(tokensWithCollectedFees.length, 0);
    }
    

    function testSetOwner() public {
        address NEW_OWNER = makeAddr("NewOwner");
        vm.startPrank(owner);
        ownershipFacet.transferOwnership(NEW_OWNER);
        vm.stopPrank();
        assertEq(ownershipFacet.owner(), NEW_OWNER);

        // test setting the performance fee percentage as new owner
        vm.startPrank(NEW_OWNER);
        uint256 newPerformanceFeePercentage = 2000;
        assertNotEq(feeAdminFacet.performanceFeePercentage(), newPerformanceFeePercentage);
        feeAdminFacet.setPerformanceFeePercentage(newPerformanceFeePercentage);
        vm.stopPrank();
        assertEq(feeAdminFacet.performanceFeePercentage(), newPerformanceFeePercentage);

        // test that the original owner cannot set the performance fee percentage
        vm.startPrank(owner);
        newPerformanceFeePercentage = 3000;
        assertNotEq(feeAdminFacet.performanceFeePercentage(), newPerformanceFeePercentage);
        vm.expectRevert(FeeUtils.CallerNotOwner.selector);
        feeAdminFacet.setPerformanceFeePercentage(newPerformanceFeePercentage);
        vm.stopPrank();
        assertNotEq(feeAdminFacet.performanceFeePercentage(), newPerformanceFeePercentage);
    }
}