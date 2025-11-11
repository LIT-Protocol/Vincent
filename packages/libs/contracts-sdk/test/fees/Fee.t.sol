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
import {FeeTestCommon} from "./FeeTestCommon.sol";

import {MockERC4626} from "../mocks/MockERC4626.sol";
import {MockERC20} from "../mocks/MockERC20.sol";

contract FeeTest is FeeTestCommon {
    address owner;
    address APP_USER_ALICE = makeAddr("Alice");
    // mock address for the vincent app diamond on chronicle yellowstone
    address VINCENT_APP_DIAMOND_ON_YELLOWSTONE = makeAddr("VincentAppDiamondOnYellowstone");

    Fee public feeDiamond;
    FeeViewsFacet public feeViewsFacet;
    FeeAdminFacet public feeAdminFacet;
    MorphoPerfFeeFacet public morphoPerfFeeFacet;
    OwnershipFacet public ownershipFacet;

    MockERC20 public mockERC20;
    MockERC4626 public mockERC4626;

    address ownerAttestationSigner;
    uint256 ownerAttestationSignerPrivateKey;

    function setUp() public {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.setEnv("VINCENT_DEPLOYER_PRIVATE_KEY", vm.toString(deployerPrivateKey));
        owner = vm.addr(deployerPrivateKey);

        DeployFeeDiamond deployScript = new DeployFeeDiamond();

        address diamondAddress = deployScript.deployToNetwork("test", keccak256("testSalt"), makeAddr("VincentAppDiamondOnYellowstone"));
        feeDiamond = Fee(payable(diamondAddress));

        feeViewsFacet = FeeViewsFacet(diamondAddress);
        feeAdminFacet = FeeAdminFacet(diamondAddress);
        morphoPerfFeeFacet = MorphoPerfFeeFacet(diamondAddress);
        ownershipFacet = OwnershipFacet(diamondAddress);

        // deploy an ERC20 and 4626 (morpho style) vault
        mockERC20 = new MockERC20();
        mockERC4626 = new MockERC4626(address(mockERC20));
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

    function testSetAavePool() public {
        address NEW_AAVE_POOL = makeAddr("AavePool");
        assertNotEq(feeAdminFacet.aavePool(), NEW_AAVE_POOL);

        // test that a non-owner cannot set the aave pool
        vm.expectRevert(FeeUtils.CallerNotOwner.selector);
        feeAdminFacet.setAavePool(NEW_AAVE_POOL);

        // test that the owner can set the aave pool
        vm.startPrank(owner);
        feeAdminFacet.setAavePool(NEW_AAVE_POOL);
        vm.stopPrank();
        assertEq(feeAdminFacet.aavePool(), NEW_AAVE_POOL);
    }

    function testSetAerodromeRouter() public {
        address NEW_AERODROME_ROUTER = makeAddr("AerodromeRouter");
        assertNotEq(feeAdminFacet.aerodromeRouter(), NEW_AERODROME_ROUTER);

        // test that a non-owner cannot set the aerodrome router
        vm.expectRevert(FeeUtils.CallerNotOwner.selector);
        feeAdminFacet.setAerodromeRouter(NEW_AERODROME_ROUTER);

        // test that the owner can set the aerodrome router
        vm.startPrank(owner);
        feeAdminFacet.setAerodromeRouter(NEW_AERODROME_ROUTER);
        vm.stopPrank();
        assertEq(feeAdminFacet.aerodromeRouter(), NEW_AERODROME_ROUTER);
    }

    function testSetSwapFeePercentage() public {
        uint256 NEW_SWAP_FEE_PERCENTAGE = 5;
        assertNotEq(feeAdminFacet.swapFeePercentage(), NEW_SWAP_FEE_PERCENTAGE);

        // test that a non-owner cannot set the swap fee percentage
        vm.expectRevert(FeeUtils.CallerNotOwner.selector);
        feeAdminFacet.setSwapFeePercentage(NEW_SWAP_FEE_PERCENTAGE);

        // test that the owner can set the swap fee percentage
        vm.startPrank(owner);
        feeAdminFacet.setSwapFeePercentage(NEW_SWAP_FEE_PERCENTAGE);
        vm.stopPrank();
        assertEq(feeAdminFacet.swapFeePercentage(), NEW_SWAP_FEE_PERCENTAGE);
    }

    function testSetPerformanceFeePercentage() public {
        uint256 NEW_PERFORMANCE_FEE_PERCENTAGE = 5;
        assertNotEq(feeAdminFacet.performanceFeePercentage(), NEW_PERFORMANCE_FEE_PERCENTAGE);

        // test that a non-owner cannot set the performance fee percentage
        vm.expectRevert(FeeUtils.CallerNotOwner.selector);
        feeAdminFacet.setPerformanceFeePercentage(NEW_PERFORMANCE_FEE_PERCENTAGE);

        // test that the owner can set the performance fee percentage
        vm.startPrank(owner);
        feeAdminFacet.setPerformanceFeePercentage(NEW_PERFORMANCE_FEE_PERCENTAGE);
        vm.stopPrank();
        assertEq(feeAdminFacet.performanceFeePercentage(), NEW_PERFORMANCE_FEE_PERCENTAGE);
    }

    function testSetLitAppFeeSplitPercentage() public {
        uint256 NEW_LIT_APP_FEE_SPLIT_PERCENTAGE = 5000; // 50%
        assertNotEq(feeAdminFacet.litAppFeeSplitPercentage(), NEW_LIT_APP_FEE_SPLIT_PERCENTAGE);

        // test that a non-owner cannot set the lit app fee split percentage
        vm.expectRevert(FeeUtils.CallerNotOwner.selector);
        feeAdminFacet.setLitAppFeeSplitPercentage(NEW_LIT_APP_FEE_SPLIT_PERCENTAGE);

        // test that the owner can set the lit app fee split percentage
        vm.startPrank(owner);
        feeAdminFacet.setLitAppFeeSplitPercentage(NEW_LIT_APP_FEE_SPLIT_PERCENTAGE);
        vm.stopPrank();
        assertEq(feeAdminFacet.litAppFeeSplitPercentage(), NEW_LIT_APP_FEE_SPLIT_PERCENTAGE);
    }

    function testSetOwnerAttestationSigner() public {
        address NEW_ATTESTATION_SIGNER_ADDRESS = makeAddr("SomeWalletAddress");
        assertNotEq(feeAdminFacet.ownerAttestationSigner(), NEW_ATTESTATION_SIGNER_ADDRESS);

        // test that a non-owner cannot set the owner attestation signer
        vm.expectRevert(FeeUtils.CallerNotOwner.selector);
        feeAdminFacet.setOwnerAttestationSigner(NEW_ATTESTATION_SIGNER_ADDRESS);

        // test that the owner can set the owner attestation signer
        vm.startPrank(owner);
        feeAdminFacet.setOwnerAttestationSigner(NEW_ATTESTATION_SIGNER_ADDRESS);
        vm.stopPrank();
        assertEq(feeAdminFacet.ownerAttestationSigner(), NEW_ATTESTATION_SIGNER_ADDRESS);
    }

    function testSetLitFoundationWallet() public {
        address NEW_LIT_FOUNDATION_WALLET = makeAddr("LitFoundationWallet");
        assertNotEq(feeAdminFacet.litFoundationWallet(), NEW_LIT_FOUNDATION_WALLET);

        // test that a non-owner cannot set the lit foundation wallet
        vm.expectRevert(FeeUtils.CallerNotOwner.selector);
        feeAdminFacet.setLitFoundationWallet(NEW_LIT_FOUNDATION_WALLET);

        // test that the owner can set the lit foundation wallet
        vm.startPrank(owner);
        feeAdminFacet.setLitFoundationWallet(NEW_LIT_FOUNDATION_WALLET);
        vm.stopPrank();
        assertEq(feeAdminFacet.litFoundationWallet(), NEW_LIT_FOUNDATION_WALLET);
    }

    function testSetVincentAppDiamondOnYellowstone() public {
        address newVincentDiamondAddress = makeAddr("NewVincentDiamondAddress");
        assertNotEq(feeAdminFacet.vincentAppDiamondOnYellowstone(), newVincentDiamondAddress);

        // test that a non-owner cannot set the vincent app diamond on chronicle yellowstone
        vm.expectRevert(FeeUtils.CallerNotOwner.selector);
        feeAdminFacet.setVincentAppDiamondOnYellowstone(newVincentDiamondAddress);

        // test that the owner can set the vincent app diamond on chronicle yellowstone
        vm.startPrank(owner);
        feeAdminFacet.setVincentAppDiamondOnYellowstone(newVincentDiamondAddress);
        vm.stopPrank();
        assertEq(feeAdminFacet.vincentAppDiamondOnYellowstone(), newVincentDiamondAddress);
    }

    function testOwnerAttestationSignerUtils() public {
        vm.startPrank(owner);
        // set the owner attestation signer in the fee diamond
        (ownerAttestationSigner, ownerAttestationSignerPrivateKey) = makeAddrAndKey("OwnerAttestationSigner");
        feeAdminFacet.setOwnerAttestationSigner(ownerAttestationSigner);
        feeAdminFacet.setVincentAppDiamondOnYellowstone(VINCENT_APP_DIAMOND_ON_YELLOWSTONE);
        vm.stopPrank();

        uint40 appId = 12345;

        FeeUtils.OwnerAttestation memory oa = FeeUtils.OwnerAttestation({
            srcChainId: LibFeeStorage.CHRONICLE_YELLOWSTONE_CHAIN_ID,
            srcContract: VINCENT_APP_DIAMOND_ON_YELLOWSTONE,
            owner: APP_USER_ALICE,
            appId: appId,
            issuedAt: block.timestamp,
            expiresAt: block.timestamp + 5 minutes,
            dstChainId: block.chainid,
            dstContract: address(feeDiamond)
        });

        // sign the owner attestation using our test utils.  This would be done by a lit action in the real world.
        bytes memory signature = _signOwnerAttestation(oa, ownerAttestationSignerPrivateKey);

        console.log("signature");
        console.logBytes(signature);

        address incorrectAppManager = makeAddr("IncorrectAppManager");

        bytes memory expectedRevertData = abi.encodeWithSelector(
            FeeAdminFacet.CallerNotAppManager.selector, appId, incorrectAppManager, APP_USER_ALICE
        );

        vm.startPrank(incorrectAppManager);
        // check the signature without pranking / without the correct app manager
        vm.expectRevert(expectedRevertData);
        feeAdminFacet.verifyOwnerAttestation(appId, oa, signature);
        vm.stopPrank();

        console.log("reverted successfully, as expected");

        // test that the app manager can verify the owner attestation
        vm.startPrank(APP_USER_ALICE);
        feeAdminFacet.verifyOwnerAttestation(appId, oa, signature);
        vm.stopPrank();
    }
}
