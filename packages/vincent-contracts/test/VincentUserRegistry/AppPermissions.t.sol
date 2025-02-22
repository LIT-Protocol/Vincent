// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VincentUserRegistryTest.t.sol";

contract AppPermissionsTest is VincentUserRegistryTest {
    uint256 public appId;

    function setUp() public override {
        super.setUp();
        appId = _registerAndEnableApp();
    }

    function test_PermitSingleApp() public {
        vm.prank(owner);
        registry.permitApps(pkpTokenId, _toArray(appId));

        assertTrue(registry.isAppPermitted(pkpTokenId, appId));
        assertEq(registry.getPermittedApps(pkpTokenId).length, 1);
        assertEq(registry.getPermittedApps(pkpTokenId)[0], appId);
    }

    function test_RevokeSingleApp() public {
        vm.startPrank(owner);
        registry.permitApps(pkpTokenId, _toArray(appId));
        registry.revokeApps(pkpTokenId, _toArray(appId));
        vm.stopPrank();

        assertFalse(registry.isAppPermitted(pkpTokenId, appId));
        assertEq(registry.getPermittedApps(pkpTokenId).length, 0);
    }

    function test_PermitMultipleApps() public {
        uint256 secondAppId = _registerAndEnableApp();

        vm.startPrank(owner);
        registry.permitApps(pkpTokenId, _toArray(appId, secondAppId));
        vm.stopPrank();

        assertTrue(registry.isAppPermitted(pkpTokenId, appId));
        assertTrue(registry.isAppPermitted(pkpTokenId, secondAppId));
        assertEq(registry.getPermittedApps(pkpTokenId).length, 2);
    }

    function test_RevokeMultipleApps() public {
        uint256 secondAppId = _registerAndEnableApp();

        vm.startPrank(owner);
        registry.permitApps(pkpTokenId, _toArray(appId, secondAppId));
        registry.revokeApps(pkpTokenId, _toArray(appId, secondAppId));
        vm.stopPrank();

        assertFalse(registry.isAppPermitted(pkpTokenId, appId));
        assertFalse(registry.isAppPermitted(pkpTokenId, secondAppId));
        assertEq(registry.getPermittedApps(pkpTokenId).length, 0);
    }

    function test_RevertWhen_NonOwnerPermitsApp() public {
        vm.prank(otherAccount);
        vm.expectRevert(abi.encodeWithSelector(VincentUserRegistry.NotPkpOwner.selector, pkpTokenId, otherAccount));
        registry.permitApps(pkpTokenId, _toArray(appId));
    }

    function test_RevertWhen_NonOwnerRevokesApp() public {
        vm.prank(owner);
        registry.permitApps(pkpTokenId, _toArray(appId));

        vm.prank(otherAccount);
        vm.expectRevert(abi.encodeWithSelector(VincentUserRegistry.NotPkpOwner.selector, pkpTokenId, otherAccount));
        registry.revokeApps(pkpTokenId, _toArray(appId));
    }

    function test_RevertWhen_PermittingDisabledApp() public {
        appRegistry.disableApp(appId);

        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(VincentUserRegistry.AppNotEnabled.selector, pkpTokenId, appId));
        registry.permitApps(pkpTokenId, _toArray(appId));
    }

    function test_RevertWhen_PermittingEmptyAppArray() public {
        vm.prank(owner);
        vm.expectRevert(VincentUserRegistry.EmptyArrayInput.selector);
        registry.permitApps(pkpTokenId, new uint256[](0));
    }

    function test_RevertWhen_RevokingEmptyAppArray() public {
        vm.prank(owner);
        vm.expectRevert(VincentUserRegistry.EmptyArrayInput.selector);
        registry.revokeApps(pkpTokenId, new uint256[](0));
    }

    // Helper function to create uint256 array with one element
    function _toArray(uint256 a) internal pure returns (uint256[] memory) {
        uint256[] memory arr = new uint256[](1);
        arr[0] = a;
        return arr;
    }

    // Helper function to create uint256 array with two elements
    function _toArray(uint256 a, uint256 b) internal pure returns (uint256[] memory) {
        uint256[] memory arr = new uint256[](2);
        arr[0] = a;
        arr[1] = b;
        return arr;
    }
}
