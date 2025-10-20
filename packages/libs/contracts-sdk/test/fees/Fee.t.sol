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

        address diamondAddress = deployScript.deployToNetwork("test", keccak256("testSalt"));
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
}
