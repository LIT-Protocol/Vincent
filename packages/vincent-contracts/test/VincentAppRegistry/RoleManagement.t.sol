// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VincentAppRegistryTest.t.sol";

contract RoleManagementTest is VincentAppRegistryTest {
    uint256 public appId;

    function setUp() public override {
        super.setUp();
        appId = _registerApp(manager);

        vm.prank(manager);
        registry.enableApp(appId);
    }

    function test_RegisterRole() public {
        (string memory name, string memory description, string[] memory tools, string[][] memory params) =
            _createBasicRole();

        vm.startPrank(manager);
        uint256 roleId = registry.registerRole(appId, name, description, tools, params);
        vm.stopPrank();

        (bool exists, bool enabled) = registry.isToolInRole(appId, roleId, 1, tools[0]);
        assertTrue(exists);
        assertFalse(enabled);
    }

    function test_EnableDisableRole() public {
        (string memory name, string memory description, string[] memory tools, string[][] memory params) =
            _createBasicRole();

        vm.startPrank(manager);
        uint256 roleId = registry.registerRole(appId, name, description, tools, params);
        registry.disableRole(appId, roleId);
        vm.stopPrank();
    }

    function test_RevertWhen_NonManagerRegistersRole() public {
        (string memory name, string memory description, string[] memory tools, string[][] memory params) =
            _createBasicRole();

        vm.prank(otherAccount);
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.NotAppManager.selector, appId));
        registry.registerRole(appId, name, description, tools, params);
    }

    function test_UpdateRole() public {
        (string memory name, string memory description, string[] memory tools, string[][] memory params) =
            _createBasicRole();

        vm.startPrank(manager);
        uint256 roleId = registry.registerRole(appId, name, description, tools, params);

        string memory updatedName = "Updated Role";
        string memory updatedDescription = "Updated Description";
        string[] memory updatedTools = new string[](1);
        updatedTools[0] = "QmNewTool123";
        string[][] memory updatedParams = new string[][](1);
        updatedParams[0] = new string[](1);
        updatedParams[0][0] = "newParam";

        registry.updateRole(appId, roleId, updatedName, updatedDescription, updatedTools, updatedParams);
        vm.stopPrank();

        (bool exists,) = registry.isToolInRole(appId, roleId, 2, updatedTools[0]);
        assertTrue(exists);
    }

    function test_RevertWhen_ToolArraysLengthMismatch() public {
        string[] memory tools = new string[](2);
        string[][] memory params = new string[][](1);

        vm.prank(manager);
        vm.expectRevert(VincentAppRegistry.ToolArraysLengthMismatch.selector);
        registry.registerRole(appId, "Test Role", "Test Description", tools, params);
    }

    function test_MultipleRolesPerApp() public {
        (string memory name, string memory description, string[] memory tools, string[][] memory params) =
            _createBasicRole();

        uint256 firstRoleId = _registerRole(appId, name, description, tools, params);
        uint256 secondRoleId = _registerRole(appId, "Second Role", "Second Description", tools, params);

        VincentTypes.AppView memory app = registry.getApp(appId);
        assertEq(app.roleIds.length, 2);
        assertTrue(app.roleIds[0] == firstRoleId);
        assertTrue(app.roleIds[1] == secondRoleId);
    }
}
