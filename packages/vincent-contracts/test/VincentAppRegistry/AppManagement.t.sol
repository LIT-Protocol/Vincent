// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VincentAppRegistryTest.t.sol";

contract AppManagementTest is VincentAppRegistryTest {
    function test_RegisterApp() public {
        uint256 appId = _registerApp(manager);

        // Check app registration
        assertTrue(registry.getRegisteredApps().length == 1);
        assertTrue(registry.getRegisteredApps()[0] == appId);

        // Check manager registration
        assertTrue(registry.getRegisteredAppManagers().length == 1);
        assertTrue(registry.getRegisteredAppManagers()[0] == manager);

        // Check app details
        VincentTypes.AppView memory app = registry.getApp(appId);
        assertEq(app.manager, manager);
        assertFalse(app.enabled);
        assertEq(app.roleIds.length, 0);
    }

    function test_EnableApp() public {
        uint256 appId = _registerApp(manager);

        vm.prank(manager);
        registry.enableApp(appId);

        assertTrue(registry.isAppEnabled(appId));
    }

    function test_DisableApp() public {
        uint256 appId = _registerApp(manager);

        vm.startPrank(manager);
        registry.enableApp(appId);
        registry.disableApp(appId);
        vm.stopPrank();

        assertFalse(registry.isAppEnabled(appId));
    }

    function test_RevertWhen_NonManagerEnablesApp() public {
        uint256 appId = _registerApp(manager);

        vm.prank(otherAccount);
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.NotAppManager.selector, appId));
        registry.enableApp(appId);
    }

    function test_RevertWhen_NonManagerDisablesApp() public {
        uint256 appId = _registerApp(manager);

        vm.prank(otherAccount);
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.NotAppManager.selector, appId));
        registry.disableApp(appId);
    }

    function test_RevertWhen_EnablingNonExistentApp() public {
        uint256 nonExistentAppId = 999;
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.NotAppManager.selector, nonExistentAppId));
        registry.enableApp(nonExistentAppId);
    }

    function test_MultipleAppsPerManager() public {
        uint256 firstAppId = _registerApp(manager);
        uint256 secondAppId = _registerApp(manager);

        uint256[] memory managerApps = registry.getManagerApps(manager);
        assertEq(managerApps.length, 2);
        assertTrue(managerApps[0] == firstAppId);
        assertTrue(managerApps[1] == secondAppId);

        // Manager list should still only have one entry
        assertEq(registry.getRegisteredAppManagers().length, 1);
    }

    function test_IsManagerForApp() public {
        uint256 appId = _registerApp(manager);

        assertTrue(registry.isManagerForApp(manager, appId));
        assertFalse(registry.isManagerForApp(otherAccount, appId));
    }
}
