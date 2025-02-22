// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VincentAppRegistryTest.t.sol";

contract ToolManagementTest is VincentAppRegistryTest {
    uint256 public appId;
    uint256 public roleId;
    uint256 public roleVersion;

    function setUp() public override {
        super.setUp();
        appId = _registerApp(manager);

        vm.prank(manager);
        registry.enableApp(appId);

        (string memory name, string memory description, string[] memory tools, string[][] memory params) =
            _createBasicRole();

        vm.startPrank(manager);
        roleId = registry.registerRole(appId, name, description, tools, params);
        roleVersion = 1;
        vm.stopPrank();
    }

    function test_GetToolDetails() public {
        (bool enabled, bytes32[] memory parameterHashes) =
            registry.getToolDetails(appId, roleId, roleVersion, TOOL_IPFS_CID);

        assertFalse(enabled);
        assertEq(parameterHashes.length, 1);
        assertEq(parameterHashes[0], parameterNameHash);
    }

    function test_EnableDisableTool() public {
        vm.startPrank(manager);
        registry.enableRoleTool(appId, roleId, roleVersion, TOOL_IPFS_CID);

        (bool enabled,) = registry.getToolDetails(appId, roleId, roleVersion, TOOL_IPFS_CID);
        assertTrue(enabled);

        registry.disableRoleTool(appId, roleId, roleVersion, TOOL_IPFS_CID);
        (enabled,) = registry.getToolDetails(appId, roleId, roleVersion, TOOL_IPFS_CID);
        assertFalse(enabled);
        vm.stopPrank();
    }

    function test_IsToolInRole() public {
        (bool exists, bool enabled) = registry.isToolInRole(appId, roleId, roleVersion, TOOL_IPFS_CID);
        assertTrue(exists);
        assertFalse(enabled);

        vm.prank(manager);
        registry.enableRoleTool(appId, roleId, roleVersion, TOOL_IPFS_CID);

        (exists, enabled) = registry.isToolInRole(appId, roleId, roleVersion, TOOL_IPFS_CID);
        assertTrue(exists);
        assertTrue(enabled);
    }

    function test_IsParameterNameForTool() public {
        assertTrue(registry.isParameterNameForTool(appId, roleId, roleVersion, TOOL_IPFS_CID, PARAMETER_NAME));
        assertFalse(registry.isParameterNameForTool(appId, roleId, roleVersion, TOOL_IPFS_CID, "nonExistentParam"));
    }

    function test_GetUnhashedValues() public {
        assertEq(registry.getUnhashedToolCid(toolIpfsCidHash), TOOL_IPFS_CID);
        assertEq(registry.getUnhashedParameterName(parameterNameHash), PARAMETER_NAME);
    }

    function test_RevertWhen_NonManagerEnablesTool() public {
        vm.prank(otherAccount);
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.NotAppManager.selector, appId));
        registry.enableRoleTool(appId, roleId, roleVersion, TOOL_IPFS_CID);
    }

    function test_RevertWhen_NonManagerDisablesTool() public {
        vm.prank(otherAccount);
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.NotAppManager.selector, appId));
        registry.disableRoleTool(appId, roleId, roleVersion, TOOL_IPFS_CID);
    }

    function test_RevertWhen_EnablingNonExistentTool() public {
        string memory nonExistentTool = "NonExistentTool";

        vm.prank(manager);
        vm.expectRevert(
            abi.encodeWithSelector(
                VincentAppRegistry.ToolNotFoundForRole.selector, appId, roleId, roleVersion, nonExistentTool
            )
        );
        registry.enableRoleTool(appId, roleId, roleVersion, nonExistentTool);
    }

    function test_RevertWhen_DisablingNonExistentTool() public {
        string memory nonExistentTool = "NonExistentTool";

        vm.prank(manager);
        vm.expectRevert(
            abi.encodeWithSelector(
                VincentAppRegistry.ToolNotFoundForRole.selector, appId, roleId, roleVersion, nonExistentTool
            )
        );
        registry.disableRoleTool(appId, roleId, roleVersion, nonExistentTool);
    }

    function test_RevertWhen_GetUnhashedToolCidNonExistent() public {
        bytes32 nonExistentHash = keccak256(abi.encodePacked("NonExistentTool"));
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.ToolIpfsCidUnknown.selector, ""));
        registry.getUnhashedToolCid(nonExistentHash);
    }

    function test_RevertWhen_GetUnhashedParameterNameNonExistent() public {
        bytes32 nonExistentHash = keccak256(abi.encodePacked("NonExistentParam"));
        vm.expectRevert(abi.encodeWithSelector(VincentAppRegistry.ToolParameterUnknown.selector, ""));
        registry.getUnhashedParameterName(nonExistentHash);
    }
}
