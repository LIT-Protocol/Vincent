// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VincentAppRegistryTest.t.sol";

contract DelegateeManagementTest is VincentAppRegistryTest {
    uint256 public appId;

    function setUp() public override {
        super.setUp();
        appId = _registerApp(manager);
    }

    function test_AddDelegatee() public {
        vm.prank(manager);
        registry.addDelegatee(appId, delegatee);

        address[] memory delegatees = registry.getAppDelegatees(appId);
        assertEq(delegatees.length, 1);
        assertEq(delegatees[0], delegatee);
        assertTrue(registry.isDelegateeForApp(appId, delegatee));
        assertEq(registry.getAppManagerForDelegatee(appId, delegatee), manager);
    }

    function test_RemoveDelegatee() public {
        vm.startPrank(manager);
        registry.addDelegatee(appId, delegatee);
        registry.removeDelegatee(appId, delegatee);
        vm.stopPrank();

        address[] memory delegatees = registry.getAppDelegatees(appId);
        assertEq(delegatees.length, 0);
        assertFalse(registry.isDelegateeForApp(appId, delegatee));
        assertEq(registry.getAppManagerForDelegatee(appId, delegatee), address(0));
    }

    function test_RevertWhen_NonManagerAddsDelegatee() public {
        vm.prank(otherAccount);
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.NotAppManager.selector, appId));
        registry.addDelegatee(appId, delegatee);
    }

    function test_RevertWhen_NonManagerRemovesDelegatee() public {
        vm.prank(manager);
        registry.addDelegatee(appId, delegatee);

        vm.prank(otherAccount);
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.NotAppManager.selector, appId));
        registry.removeDelegatee(appId, delegatee);
    }

    function test_RevertWhen_AddingZeroAddressDelegatee() public {
        vm.prank(manager);
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.InvalidDelegatee.selector, address(0)));
        registry.addDelegatee(appId, address(0));
    }

    function test_RevertWhen_RemovingNonExistentDelegatee() public {
        vm.prank(manager);
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.InvalidDelegatee.selector, delegatee));
        registry.removeDelegatee(appId, delegatee);
    }

    function test_MultipleDelgateesPerApp() public {
        address secondDelegatee = makeAddr("secondDelegatee");

        vm.startPrank(manager);
        registry.addDelegatee(appId, delegatee);
        registry.addDelegatee(appId, secondDelegatee);
        vm.stopPrank();

        address[] memory delegatees = registry.getAppDelegatees(appId);
        assertEq(delegatees.length, 2);
        assertTrue(registry.isDelegateeForApp(appId, delegatee));
        assertTrue(registry.isDelegateeForApp(appId, secondDelegatee));
    }

    function test_DelegateeForMultipleApps() public {
        uint256 secondAppId = _registerApp(manager);

        vm.startPrank(manager);
        registry.addDelegatee(appId, delegatee);
        registry.addDelegatee(secondAppId, delegatee);
        vm.stopPrank();

        assertTrue(registry.isDelegateeForApp(appId, delegatee));
        assertTrue(registry.isDelegateeForApp(secondAppId, delegatee));
        assertEq(registry.getAppManagerForDelegatee(appId, delegatee), manager);
        assertEq(registry.getAppManagerForDelegatee(secondAppId, delegatee), manager);
    }
}
