// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./VincentUserRegistryTest.t.sol";

contract ToolParametersTest is VincentUserRegistryTest {
    uint256 public appId;
    uint256 public roleId;
    uint256 public roleVersion;

    function setUp() public override {
        super.setUp();

        // Register and enable app
        appId = _registerAndEnableApp();

        // Register role with tool
        roleId = _registerRole(appId);
        roleVersion = 1;

        // Enable tool
        vm.prank(address(this));
        appRegistry.enableRoleTool(appId, roleId, roleVersion, TOOL_IPFS_CID);

        // Permit app for PKP
        vm.prank(owner);
        registry.permitApps(pkpTokenId, _toArray(appId));
    }

    function test_SetSingleToolParameterValue() public {
        string[] memory tools = new string[](1);
        tools[0] = TOOL_IPFS_CID;
        string[][] memory params = new string[][](1);
        params[0] = new string[](1);
        params[0][0] = PARAMETER_NAME;
        string[][] memory values = new string[][](1);
        values[0] = new string[](1);
        values[0][0] = "test-value";

        vm.prank(owner);
        registry.setToolParameterValues(pkpTokenId, appId, roleId, roleVersion, tools, params, values);

        string memory value =
            registry.getToolParameterValue(pkpTokenId, roleId, roleVersion, TOOL_IPFS_CID, PARAMETER_NAME);
        assertEq(value, "test-value");
    }

    function test_SetMultipleToolParameterValues() public {
        string[] memory tools = new string[](1);
        tools[0] = TOOL_IPFS_CID;
        string[][] memory params = new string[][](1);
        params[0] = new string[](2);
        params[0][0] = PARAMETER_NAME;
        params[0][1] = "secondParam";
        string[][] memory values = new string[][](1);
        values[0] = new string[](2);
        values[0][0] = "test-value";
        values[0][1] = "value2";

        vm.prank(owner);
        registry.setToolParameterValues(pkpTokenId, appId, roleId, roleVersion, tools, params, values);

        string memory value1 =
            registry.getToolParameterValue(pkpTokenId, roleId, roleVersion, TOOL_IPFS_CID, PARAMETER_NAME);
        string memory value2 =
            registry.getToolParameterValue(pkpTokenId, roleId, roleVersion, TOOL_IPFS_CID, "secondParam");
        assertEq(value1, "test-value");
        assertEq(value2, "value2");
    }

    function test_GetRoleVersionParameterValues() public {
        string[] memory tools = new string[](1);
        tools[0] = TOOL_IPFS_CID;
        string[][] memory params = new string[][](1);
        params[0] = new string[](2);
        params[0][0] = PARAMETER_NAME;
        params[0][1] = "secondParam";
        string[][] memory values = new string[][](1);
        values[0] = new string[](2);
        values[0][0] = "test-value";
        values[0][1] = "value2";

        vm.prank(owner);
        registry.setToolParameterValues(pkpTokenId, appId, roleId, roleVersion, tools, params, values);

        (string[] memory toolCids, string[][] memory paramNames, string[][] memory paramValues) =
            registry.getRoleVersionParameterValues(pkpTokenId, appId, roleId, roleVersion);

        assertEq(toolCids.length, 1);
        assertEq(toolCids[0], TOOL_IPFS_CID);
        assertEq(paramNames.length, 1);
        assertEq(paramNames[0].length, 2);
        assertEq(paramNames[0][0], PARAMETER_NAME);
        assertEq(paramNames[0][1], "secondParam");
        assertEq(paramValues.length, 1);
        assertEq(paramValues[0].length, 2);
        assertEq(paramValues[0][0], "test-value");
        assertEq(paramValues[0][1], "value2");
    }

    function test_RevertWhen_NonOwnerSetsParameter() public {
        string[] memory tools = new string[](1);
        tools[0] = TOOL_IPFS_CID;

        string[][] memory params = new string[][](1);
        params[0] = new string[](1);
        params[0][0] = PARAMETER_NAME;

        string[][] memory values = new string[][](1);
        values[0] = new string[](1);
        values[0][0] = PARAMETER_VALUE;

        vm.prank(otherAccount);
        vm.expectRevert(abi.encodeWithSelector(VincentUserRegistry.NotPkpOwner.selector, pkpTokenId, otherAccount));
        registry.setToolParameterValues(pkpTokenId, appId, roleId, roleVersion, tools, params, values);
    }

    function test_RevertWhen_AppNotPermitted() public {
        uint256 unpermittedAppId = _registerAndEnableApp();

        string[] memory tools = new string[](1);
        tools[0] = TOOL_IPFS_CID;

        string[][] memory params = new string[][](1);
        params[0] = new string[](1);
        params[0][0] = PARAMETER_NAME;

        string[][] memory values = new string[][](1);
        values[0] = new string[](1);
        values[0][0] = PARAMETER_VALUE;

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(VincentUserRegistry.AppNotEnabled.selector, pkpTokenId, unpermittedAppId)
        );
        registry.setToolParameterValues(pkpTokenId, unpermittedAppId, roleId, roleVersion, tools, params, values);
    }

    function test_RevertWhen_ToolNotFound() public {
        string[] memory tools = new string[](1);
        tools[0] = "NonExistentTool";

        string[][] memory params = new string[][](1);
        params[0] = new string[](1);
        params[0][0] = PARAMETER_NAME;

        string[][] memory values = new string[][](1);
        values[0] = new string[](1);
        values[0][0] = PARAMETER_VALUE;

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                VincentUserRegistry.ToolNotFoundForRole.selector,
                appId,
                roleId,
                roleVersion,
                keccak256(abi.encodePacked("NonExistentTool"))
            )
        );
        registry.setToolParameterValues(pkpTokenId, appId, roleId, roleVersion, tools, params, values);
    }

    function test_RevertWhen_ToolDisabled() public {
        appRegistry.disableRoleTool(appId, roleId, roleVersion, TOOL_IPFS_CID);

        string[] memory tools = new string[](1);
        tools[0] = TOOL_IPFS_CID;

        string[][] memory params = new string[][](1);
        params[0] = new string[](1);
        params[0][0] = PARAMETER_NAME;

        string[][] memory values = new string[][](1);
        values[0] = new string[](1);
        values[0][0] = PARAMETER_VALUE;

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                VincentUserRegistry.ToolDisabledForRole.selector, appId, roleId, roleVersion, toolIpfsCidHash
            )
        );
        registry.setToolParameterValues(pkpTokenId, appId, roleId, roleVersion, tools, params, values);
    }

    function test_RevertWhen_ParameterNotFound() public {
        string[] memory tools = new string[](1);
        tools[0] = TOOL_IPFS_CID;

        string[][] memory params = new string[][](1);
        params[0] = new string[](1);
        params[0][0] = "NonExistentParam";

        string[][] memory values = new string[][](1);
        values[0] = new string[](1);
        values[0][0] = PARAMETER_VALUE;

        vm.prank(owner);
        vm.expectRevert(
            abi.encodeWithSelector(
                VincentUserRegistry.ParameterNotFoundForTool.selector,
                toolIpfsCidHash,
                keccak256(abi.encodePacked("NonExistentParam"))
            )
        );
        registry.setToolParameterValues(pkpTokenId, appId, roleId, roleVersion, tools, params, values);
    }

    function test_RevertWhen_EmptyToolArray() public {
        vm.prank(owner);
        vm.expectRevert(VincentUserRegistry.EmptyArrayInput.selector);
        registry.setToolParameterValues(
            pkpTokenId, appId, roleId, roleVersion, new string[](0), new string[][](0), new string[][](0)
        );
    }

    function test_RevertWhen_ArrayLengthMismatch() public {
        string[] memory tools = new string[](2);
        string[][] memory params = new string[][](1);
        string[][] memory values = new string[][](1);

        vm.prank(owner);
        vm.expectRevert(VincentUserRegistry.ArrayLengthMismatch.selector);
        registry.setToolParameterValues(pkpTokenId, appId, roleId, roleVersion, tools, params, values);
    }

    // Helper function to create uint256 array with one element
    function _toArray(uint256 value) internal pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = value;
        return array;
    }

    // Helper function to register a role with a tool
    function _registerRole(uint256 _appId) internal override returns (uint256 _roleId) {
        string memory name = "TestRole";
        string memory description = "Test Role Description";

        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        string[][] memory parameterNames = new string[][](1);
        parameterNames[0] = new string[](2);
        parameterNames[0][0] = PARAMETER_NAME;
        parameterNames[0][1] = "secondParam";

        _roleId = appRegistry.registerRole(_appId, name, description, toolIpfsCids, parameterNames);
    }
}
