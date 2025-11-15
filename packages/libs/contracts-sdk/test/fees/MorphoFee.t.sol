// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import {FeeTestCommon} from "./FeeTestCommon.sol";
import {Fee} from "../../contracts/fees/Fee.sol";
import {FeeViewsFacet} from "../../contracts/fees/facets/FeeViewsFacet.sol";
import {FeeAdminFacet} from "../../contracts/fees/facets/FeeAdminFacet.sol";
import {MorphoPerfFeeFacet} from "../../contracts/fees/facets/MorphoPerfFeeFacet.sol";
import {LibFeeStorage} from "../../contracts/fees/LibFeeStorage.sol";
import {FeeUtils} from "../../contracts/fees/FeeUtils.sol";
import {OwnershipFacet} from "../../contracts/diamond-base/facets/OwnershipFacet.sol";

import {MockERC4626} from "../mocks/MockERC4626.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract MorphoFeeTest is FeeTestCommon {
    uint256 constant BASIS_POINT_DIVISOR = 10000;

    address owner;
    uint40 DEV_APP_ID = uint40(vm.randomUint(1, type(uint40).max));
    address APP_MANAGER_BOB = makeAddr("Bob");
    address APP_DELEGATEE_BOB = makeAddr("BobDelegatee");
    address APP_USER_ALICE = makeAddr("Alice");
    address litFoundationWallet = makeAddr("LitFoundationWallet");

    address ownerAttestationSigner;
    uint256 ownerAttestationSignerPrivateKey;

    Fee public feeDiamond;
    FeeViewsFacet public feeViewsFacet;
    FeeAdminFacet public feeAdminFacet;
    MorphoPerfFeeFacet public morphoPerfFeeFacet;
    address public vincentDiamondAddress;

    MockERC20 public mockERC20;
    MockERC4626 public mockERC4626;

    function setUp() public {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));
        owner = vm.addr(deployerPrivateKey);

        vincentDiamondAddress = _deployVincentDiamondAndBasicApp(APP_MANAGER_BOB, APP_DELEGATEE_BOB, DEV_APP_ID);

        feeDiamond = Fee(payable(_deployFeeDiamond(vincentDiamondAddress)));

        feeViewsFacet = FeeViewsFacet(address(feeDiamond));
        feeAdminFacet = FeeAdminFacet(address(feeDiamond));
        morphoPerfFeeFacet = MorphoPerfFeeFacet(address(feeDiamond));

        // deploy an ERC20 and 4626 (morpho style) vault
        mockERC20 = new MockERC20();
        mockERC4626 = new MockERC4626(address(mockERC20));

        vm.startPrank(owner);
        // set the owner attestation signer in the fee diamond
        (ownerAttestationSigner, ownerAttestationSignerPrivateKey) = makeAddrAndKey("OwnerAttestationSigner");
        feeAdminFacet.setOwnerAttestationSigner(ownerAttestationSigner);
        // set the lit foundation wallet in the fee diamond
        feeAdminFacet.setLitFoundationWallet(litFoundationWallet);
        vm.stopPrank();
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
        morphoPerfFeeFacet.depositToMorpho(DEV_APP_ID, address(mockERC4626), depositAmount);
        vm.stopPrank();

        LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(DEV_APP_ID, APP_USER_ALICE, address(mockERC4626));

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);
        // confirm that the user has the vault shares
        uint256 userVaultShares = mockERC4626.balanceOf(address(APP_USER_ALICE));
        console.log("userVaultShares", userVaultShares);
        assertEq(userVaultShares, d.vaultShares);

        // send more assets to the vault to create profit
        mockERC20.mint(address(mockERC4626), 100);

        // check that asset balance will be higher if we withdraw
        uint256 expectedTotalWithdrawal = mockERC4626.convertToAssets(d.vaultShares);
        console.log("expectedTotalWithdrawal", expectedTotalWithdrawal);
        assertEq(expectedTotalWithdrawal > depositAmount, true);

        vm.startPrank(APP_USER_ALICE);
        mockERC4626.approve(address(morphoPerfFeeFacet), d.vaultShares);
        morphoPerfFeeFacet.withdrawFromMorpho(DEV_APP_ID, address(mockERC4626));
        vm.stopPrank();

        // confirm the deposit is zeroed out
        d = feeViewsFacet.deposits(DEV_APP_ID, APP_USER_ALICE, address(mockERC4626));

        assertEq(d.assetAmount, 0);
        assertEq(d.vaultShares, 0);
        assertEq(d.vaultProvider, 0);

        // confirm the profit went to the fee contract, and some went to the user
        uint256 userBalance = mockERC20.balanceOf(APP_USER_ALICE);
        uint256 feeContractBalance = mockERC20.balanceOf(address(morphoPerfFeeFacet));

        uint256 expectedTotalProfit = expectedTotalWithdrawal - depositAmount;
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
        address[] memory tokensWithCollectedFees =
            feeAdminFacet.tokensWithCollectedFees(LibFeeStorage.LIT_FOUNDATION_APP_ID);
        assertEq(tokensWithCollectedFees.length, 1);
        assertEq(tokensWithCollectedFees[0], address(mockERC20));

        // test that the MockERC20 is in the set of tokens that have collected fees for the app
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(DEV_APP_ID);
        assertEq(tokensWithCollectedFees.length, 1);
        assertEq(tokensWithCollectedFees[0], address(mockERC20));

        // check the collected fees for the foundation
        uint256 litCollectedAppFees =
            feeViewsFacet.collectedAppFees(LibFeeStorage.LIT_FOUNDATION_APP_ID, address(mockERC20));
        // check the collected fees for the app
        uint256 appCollectedAppFees = feeViewsFacet.collectedAppFees(DEV_APP_ID, address(mockERC20));
        assertEq(litCollectedAppFees + appCollectedAppFees, expectedFeeContractProfit);

        // calculate the split expected for the lit foundation, and for the app
        uint256 expectedLitCollectedAppFees =
            expectedFeeContractProfit * feeAdminFacet.litAppFeeSplitPercentage() / BASIS_POINT_DIVISOR;
        uint256 expectedAppCollectedAppFees = expectedFeeContractProfit - expectedLitCollectedAppFees;
        assertEq(litCollectedAppFees, expectedLitCollectedAppFees);
        assertEq(appCollectedAppFees, expectedAppCollectedAppFees);

        // test withdrawal of profit from the fee contract as the lit foundation wallet
        vm.startPrank(litFoundationWallet);
        feeAdminFacet.withdrawPlatformFees(address(mockERC20));
        vm.stopPrank();

        // confirm the profit went to the lit foundation wallet
        assertEq(mockERC20.balanceOf(litFoundationWallet), expectedLitCollectedAppFees);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(LibFeeStorage.LIT_FOUNDATION_APP_ID);
        assertEq(tokensWithCollectedFees.length, 0);

        // test withdrawal of profit from the fee contract as app manager
        FeeUtils.OwnerAttestation memory oa = FeeUtils.OwnerAttestation({
            srcChainId: LibFeeStorage.CHRONICLE_YELLOWSTONE_CHAIN_ID,
            srcContract: vincentDiamondAddress,
            owner: APP_MANAGER_BOB,
            appId: DEV_APP_ID,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 5 minutes,
            dstChainId: block.chainid,
            dstContract: address(feeDiamond)
        });
        bytes memory ownerAttestationSig = _signOwnerAttestation(oa, ownerAttestationSignerPrivateKey);
        vm.startPrank(APP_MANAGER_BOB);
        feeAdminFacet.withdrawAppFees(DEV_APP_ID, address(mockERC20), oa, ownerAttestationSig);
        vm.stopPrank();

        // confirm the profit went to the app manager
        assertEq(mockERC20.balanceOf(APP_MANAGER_BOB), expectedAppCollectedAppFees);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(DEV_APP_ID);
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
        morphoPerfFeeFacet.depositToMorpho(DEV_APP_ID, address(mockERC4626), depositAmount);
        vm.stopPrank();

        LibFeeStorage.Deposit memory d = feeViewsFacet.deposits(DEV_APP_ID, APP_USER_ALICE, address(mockERC4626));

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);
        // confirm that the fee contract has the vault shares
        uint256 userVaultShares = mockERC4626.balanceOf(address(APP_USER_ALICE));
        console.log("userVaultShares", userVaultShares);
        assertEq(userVaultShares, d.vaultShares);

        // deposit again
        mockERC20.mint(APP_USER_ALICE, depositAmount);
        vm.startPrank(APP_USER_ALICE);
        mockERC20.approve(address(morphoPerfFeeFacet), depositAmount);
        morphoPerfFeeFacet.depositToMorpho(DEV_APP_ID, address(mockERC4626), depositAmount);
        vm.stopPrank();

        // deposited twice, so total deposit amount is times 2
        depositAmount = depositAmount * 2;

        d = feeViewsFacet.deposits(DEV_APP_ID, APP_USER_ALICE, address(mockERC4626));

        assertEq(d.assetAmount, depositAmount);
        console.log("d.vaultShares", d.vaultShares);
        console.log("d.vaultProvider", d.vaultProvider);
        // confirm that the fee contract has the vault shares
        userVaultShares = mockERC4626.balanceOf(address(APP_USER_ALICE));
        console.log("userVaultShares", userVaultShares);
        assertEq(userVaultShares, d.vaultShares);

        // send more assets to the vault to create profit
        mockERC20.mint(address(mockERC4626), 100);

        // check that asset balance will be higher if we withdraw
        uint256 expectedTotalWithdrawal = mockERC4626.convertToAssets(d.vaultShares);
        console.log("expectedTotalWithdrawal", expectedTotalWithdrawal);
        assertEq(expectedTotalWithdrawal > depositAmount, true);

        vm.startPrank(APP_USER_ALICE);
        mockERC4626.approve(address(morphoPerfFeeFacet), d.vaultShares);
        morphoPerfFeeFacet.withdrawFromMorpho(DEV_APP_ID, address(mockERC4626));
        vm.stopPrank();

        // confirm the deposit is zeroed out
        d = feeViewsFacet.deposits(DEV_APP_ID, APP_USER_ALICE, address(mockERC4626));

        assertEq(d.assetAmount, 0);
        assertEq(d.vaultShares, 0);
        assertEq(d.vaultProvider, 0);

        // confirm the profit went to the fee contract, and some went to the user
        uint256 userBalance = mockERC20.balanceOf(APP_USER_ALICE);
        uint256 feeContractBalance = mockERC20.balanceOf(address(morphoPerfFeeFacet));

        uint256 expectedTotalProfit = expectedTotalWithdrawal - depositAmount;
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
        address[] memory tokensWithCollectedFees =
            feeAdminFacet.tokensWithCollectedFees(LibFeeStorage.LIT_FOUNDATION_APP_ID);
        assertEq(tokensWithCollectedFees.length, 1);
        assertEq(tokensWithCollectedFees[0], address(mockERC20));

        // test that the MockERC20 is in the set of tokens that have collected fees for the app
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(DEV_APP_ID);
        assertEq(tokensWithCollectedFees.length, 1);
        assertEq(tokensWithCollectedFees[0], address(mockERC20));

        // check the collected fees for the foundation
        uint256 litCollectedAppFees =
            feeViewsFacet.collectedAppFees(LibFeeStorage.LIT_FOUNDATION_APP_ID, address(mockERC20));
        // check the collected fees for the app
        uint256 appCollectedAppFees = feeViewsFacet.collectedAppFees(DEV_APP_ID, address(mockERC20));
        assertEq(litCollectedAppFees + appCollectedAppFees, expectedFeeContractProfit);

        // calculate the split expected for the lit foundation, and for the app
        uint256 expectedLitCollectedAppFees =
            expectedFeeContractProfit * feeAdminFacet.litAppFeeSplitPercentage() / BASIS_POINT_DIVISOR;
        uint256 expectedAppCollectedAppFees = expectedFeeContractProfit - expectedLitCollectedAppFees;
        assertEq(litCollectedAppFees, expectedLitCollectedAppFees);
        assertEq(appCollectedAppFees, expectedAppCollectedAppFees);

        // test withdrawal of profit from the fee contract as the lit foundation wallet
        vm.startPrank(litFoundationWallet);
        feeAdminFacet.withdrawPlatformFees(address(mockERC20));
        vm.stopPrank();

        // confirm the profit went to the lit foundation wallet
        assertEq(mockERC20.balanceOf(litFoundationWallet), expectedLitCollectedAppFees);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(LibFeeStorage.LIT_FOUNDATION_APP_ID);
        assertEq(tokensWithCollectedFees.length, 0);

        // test withdrawal of profit from the fee contract as app manager
        FeeUtils.OwnerAttestation memory oa = FeeUtils.OwnerAttestation({
            srcChainId: LibFeeStorage.CHRONICLE_YELLOWSTONE_CHAIN_ID,
            srcContract: vincentDiamondAddress,
            owner: APP_MANAGER_BOB,
            appId: DEV_APP_ID,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 5 minutes,
            dstChainId: block.chainid,
            dstContract: address(feeDiamond)
        });
        bytes memory ownerAttestationSig = _signOwnerAttestation(oa, ownerAttestationSignerPrivateKey);
        vm.startPrank(APP_MANAGER_BOB);
        feeAdminFacet.withdrawAppFees(DEV_APP_ID, address(mockERC20), oa, ownerAttestationSig);
        vm.stopPrank();

        // confirm the profit went to the app manager
        assertEq(mockERC20.balanceOf(APP_MANAGER_BOB), expectedAppCollectedAppFees);

        // confirm that the token is no longer in the set of tokens that have collected fees
        tokensWithCollectedFees = feeAdminFacet.tokensWithCollectedFees(DEV_APP_ID);
        assertEq(tokensWithCollectedFees.length, 0);
    }
}
