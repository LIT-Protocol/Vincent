// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {VincentAgentRegistry} from "../src/VincentAgentRegistry.sol";
import {VincentAppRegistry} from "../src/VincentAppRegistry.sol";
import {IPKPNFTFacet} from "../src/interfaces/IPKPNFTFacet.sol";

contract MockPKPNFTFacet is IPKPNFTFacet {
    mapping(uint256 => address) private _owners;

    function setOwner(uint256 tokenId, address owner) external {
        _owners[tokenId] = owner;
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        require(_owners[tokenId] != address(0), "PKP: nonexistent token");
        return _owners[tokenId];
    }
}

contract VincentAgentRegistryTest is Test {
    VincentAgentRegistry public registry;
    VincentAppRegistry public appRegistry;
    MockPKPNFTFacet public pkpNFT;

    address public constant PKP_OWNER = address(0x1);
    address public constant APP_MANAGER = address(0x2);
    uint256 public constant PKP_TOKEN_ID = 1;
    bytes32 public constant ROLE_ID = bytes32(uint256(1));
    string public constant ROLE_VERSION = "1.0.0";
    string public constant TOOL_IPFS_CID = "QmTool1";
    bytes32 public constant PARAM_ID = bytes32(uint256(2));
    bytes public constant PARAM_VALUE = bytes("value1");

    event AppAdded(uint256 indexed agentPkpTokenId, address indexed appManager, bool enabled);
    event AppEnabled(uint256 indexed agentPkpTokenId, address indexed appManager, bool enabled);
    event RoleAdded(
        uint256 indexed agentPkpTokenId, address indexed appManager, bytes32 indexed roleId, string version
    );
    event ToolPolicyAdded(
        uint256 indexed agentPkpTokenId, address indexed appManager, bytes32 indexed toolId, string ipfsCid
    );
    event ToolPolicyEnabled(
        uint256 indexed agentPkpTokenId, address indexed appManager, bytes32 indexed toolId, bool enabled
    );
    event PolicyValueSet(
        uint256 indexed agentPkpTokenId,
        address indexed appManager,
        bytes32 indexed toolId,
        bytes32 paramId,
        bytes value
    );

    function setUp() public {
        pkpNFT = new MockPKPNFTFacet();
        appRegistry = new VincentAppRegistry(address(pkpNFT));
        registry = new VincentAgentRegistry(address(pkpNFT), address(appRegistry));

        // Set up initial state
        vm.prank(PKP_OWNER);
        pkpNFT.setOwner(PKP_TOKEN_ID, PKP_OWNER);

        // Permit app for agent PKP
        vm.prank(PKP_OWNER);
        appRegistry.permitAppForAgentPkp(APP_MANAGER, PKP_TOKEN_ID);
    }

    // ======================== Constructor Tests ========================

    function testConstructorZeroAddressPkp() public {
        vm.expectRevert("VincentAgentRegistry: zero address");
        new VincentAgentRegistry(address(0), address(appRegistry));
    }

    function testConstructorZeroAddressAppRegistry() public {
        vm.expectRevert("VincentAgentRegistry: zero address");
        new VincentAgentRegistry(address(pkpNFT), address(0));
    }

    // ======================== Role Management Tests ========================

    function testAddRole() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](1);
        policyParams[0][0] = PARAM_ID;

        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](1);
        policyValues[0][0] = PARAM_VALUE;

        vm.startPrank(PKP_OWNER);

        vm.expectEmit(true, true, true, true);
        emit AppAdded(PKP_TOKEN_ID, APP_MANAGER, true);

        vm.expectEmit(true, true, true, true);
        emit RoleAdded(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION);

        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        assertTrue(registry.hasRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID));
        assertTrue(registry.isAppEnabled(PKP_TOKEN_ID, APP_MANAGER));
        vm.stopPrank();
    }

    function testAddRoleWithEmptyArrays() public {
        string[] memory toolIpfsCids = new string[](0);
        bytes32[][] memory policyParams = new bytes32[][](0);
        bytes[][] memory policyValues = new bytes[][](0);

        vm.prank(PKP_OWNER);
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        assertTrue(registry.hasRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID));
        assertEq(registry.getToolsPermittedForApp(PKP_TOKEN_ID, APP_MANAGER).length, 0);
    }

    function testAddRoleWithMaxTools() public {
        uint256 numTools = 10; // Simulate a large number of tools
        string[] memory toolIpfsCids = new string[](numTools);
        bytes32[][] memory policyParams = new bytes32[][](numTools);
        bytes[][] memory policyValues = new bytes[][](numTools);

        for (uint256 i = 0; i < numTools; i++) {
            toolIpfsCids[i] = string(abi.encodePacked("QmTool", vm.toString(i)));
            policyParams[i] = new bytes32[](1);
            policyParams[i][0] = bytes32(uint256(i + 1));
            policyValues[i] = new bytes[](1);
            policyValues[i][0] = bytes(vm.toString(i));
        }

        vm.prank(PKP_OWNER);
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        bytes32[] memory toolIds = registry.getToolsPermittedForApp(PKP_TOKEN_ID, APP_MANAGER);
        assertEq(toolIds.length, numTools);
    }

    function testAddRoleWithMaxPolicyParams() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        uint256 numParams = 10; // Simulate a large number of policy parameters
        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](numParams);
        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](numParams);

        for (uint256 i = 0; i < numParams; i++) {
            policyParams[0][i] = bytes32(uint256(i + 1));
            policyValues[0][i] = bytes(vm.toString(i));
        }

        vm.prank(PKP_OWNER);
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        bytes32[] memory params = registry.getPolicyParamsForTool(PKP_TOKEN_ID, APP_MANAGER, TOOL_IPFS_CID);
        assertEq(params.length, numParams);
    }

    function testAddRoleArrayLengthMismatch() public {
        string[] memory toolIpfsCids = new string[](2);
        bytes32[][] memory policyParams = new bytes32[][](1);
        bytes[][] memory policyValues = new bytes[][](1);

        vm.prank(PKP_OWNER);
        vm.expectRevert("VincentAgentRegistry: array length mismatch");
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);
    }

    function testAddRolePolicyParamValueLengthMismatch() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](2);
        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](1);

        vm.prank(PKP_OWNER);
        vm.expectRevert("VincentAgentRegistry: param and value length mismatch");
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);
    }

    function testAddDuplicateRole() public {
        string[] memory toolIpfsCids = new string[](1);
        bytes32[][] memory policyParams = new bytes32[][](1);
        bytes[][] memory policyValues = new bytes[][](1);

        vm.startPrank(PKP_OWNER);
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        // Adding same role again should work (update)
        string memory newVersion = "2.0.0";
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, newVersion, toolIpfsCids, policyParams, policyValues);

        assertEq(registry.getRoleVersion(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID), newVersion);
        vm.stopPrank();
    }

    // ======================== App Management Tests ========================

    function testSetAppEnabledMultipleToggle() public {
        string[] memory toolIpfsCids = new string[](1);
        bytes32[][] memory policyParams = new bytes32[][](1);
        bytes[][] memory policyValues = new bytes[][](1);

        vm.startPrank(PKP_OWNER);
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        // Toggle multiple times
        for (uint256 i = 0; i < 3; i++) {
            bool enabled = i % 2 == 0;
            registry.setAppEnabled(PKP_TOKEN_ID, APP_MANAGER, enabled);
            assertEq(registry.isAppEnabled(PKP_TOKEN_ID, APP_MANAGER), enabled);
        }
        vm.stopPrank();
    }

    function testSetAppEnabledNonexistentApp() public {
        vm.prank(PKP_OWNER);
        vm.expectRevert("VincentAgentRegistry: app not found");
        registry.setAppEnabled(PKP_TOKEN_ID, address(0x9999), false);
    }

    // ======================== Tool Management Tests ========================

    function testSetToolPolicyEnabledMultipleTools() public {
        string[] memory toolIpfsCids = new string[](3);
        toolIpfsCids[0] = "QmTool1";
        toolIpfsCids[1] = "QmTool2";
        toolIpfsCids[2] = "QmTool3";

        bytes32[][] memory policyParams = new bytes32[][](3);
        bytes[][] memory policyValues = new bytes[][](3);
        for (uint256 i = 0; i < 3; i++) {
            policyParams[i] = new bytes32[](0);
            policyValues[i] = new bytes[](0);
        }

        vm.startPrank(PKP_OWNER);
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        // Toggle each tool's policy
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            registry.setToolPolicyEnabled(PKP_TOKEN_ID, APP_MANAGER, toolIpfsCids[i], false);
            bytes32 toolId = registry.getToolId(toolIpfsCids[i]);
            assertFalse(registry.isToolEnabled(PKP_TOKEN_ID, APP_MANAGER, toolId));
        }
        vm.stopPrank();
    }

    function testSetToolPolicyEnabledNonexistentTool() public {
        vm.startPrank(PKP_OWNER);
        registry.addRole(
            PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, new string[](0), new bytes32[][](0), new bytes[][](0)
        );

        vm.expectRevert("VincentAgentRegistry: tool not found");
        registry.setToolPolicyEnabled(PKP_TOKEN_ID, APP_MANAGER, "NonexistentTool", false);
        vm.stopPrank();
    }

    function testUpdateToolPolicyValueMultipleUpdates() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](1);
        policyParams[0][0] = PARAM_ID;

        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](1);
        policyValues[0][0] = PARAM_VALUE;

        vm.startPrank(PKP_OWNER);
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        bytes32 toolId = registry.getToolId(TOOL_IPFS_CID);

        // Update value multiple times
        for (uint256 i = 1; i <= 3; i++) {
            bytes memory newValue = bytes(vm.toString(i));
            registry.updateToolPolicyValue(PKP_TOKEN_ID, APP_MANAGER, TOOL_IPFS_CID, PARAM_ID, newValue);

            bytes memory storedValue = registry.getPolicyValue(PKP_TOKEN_ID, APP_MANAGER, toolId, PARAM_ID);
            assertEq(keccak256(storedValue), keccak256(newValue));
        }
        vm.stopPrank();
    }

    function testUpdateToolPolicyValueNonexistentParam() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](1);
        policyParams[0][0] = PARAM_ID;

        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](1);
        policyValues[0][0] = PARAM_VALUE;

        vm.startPrank(PKP_OWNER);
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        bytes32 nonexistentParamId = bytes32(uint256(999));
        vm.expectRevert("VincentAgentRegistry: param not found");
        registry.updateToolPolicyValue(PKP_TOKEN_ID, APP_MANAGER, TOOL_IPFS_CID, nonexistentParamId, bytes("newValue"));
        vm.stopPrank();
    }

    // ======================== View Function Tests ========================

    function testGetRolesWithVersionsEmpty() public {
        vm.expectRevert("VincentAgentRegistry: app not found");
        registry.getRolesWithVersions(PKP_TOKEN_ID, APP_MANAGER);
    }

    function testGetToolsWithIpfsCidsEmpty() public {
        vm.expectRevert("VincentAgentRegistry: app not found");
        registry.getToolsWithIpfsCids(PKP_TOKEN_ID, APP_MANAGER);
    }

    function testGetPolicyParamsWithValuesNonexistentTool() public {
        vm.startPrank(PKP_OWNER);
        registry.addRole(
            PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, new string[](0), new bytes32[][](0), new bytes[][](0)
        );

        vm.expectRevert("VincentAgentRegistry: tool not found");
        registry.getPolicyParamsWithValues(PKP_TOKEN_ID, APP_MANAGER, "NonexistentTool");
        vm.stopPrank();
    }

    function testHasAgentPkpAfterRemovingAllApps() public {
        string[] memory toolIpfsCids = new string[](1);
        bytes32[][] memory policyParams = new bytes32[][](1);
        bytes[][] memory policyValues = new bytes[][](1);

        vm.startPrank(PKP_OWNER);
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        // The PKP should still exist in the registry even after disabling its only app
        registry.setAppEnabled(PKP_TOKEN_ID, APP_MANAGER, false);
        assertTrue(registry.hasAgentPkp(PKP_TOKEN_ID));
        vm.stopPrank();
    }

    function testPkpOwnershipTransfer() public {
        string[] memory toolIpfsCids = new string[](1);
        bytes32[][] memory policyParams = new bytes32[][](1);
        bytes[][] memory policyValues = new bytes[][](1);

        // Initial setup by first owner
        vm.prank(PKP_OWNER);
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        // Transfer PKP ownership
        address newOwner = address(0x1234);
        vm.prank(PKP_OWNER);
        pkpNFT.setOwner(PKP_TOKEN_ID, newOwner);

        // Try operations with old owner
        vm.startPrank(PKP_OWNER);
        vm.expectRevert("VincentAgentRegistry: not PKP owner");
        registry.setAppEnabled(PKP_TOKEN_ID, APP_MANAGER, false);
        vm.stopPrank();

        // Try operations with new owner
        vm.startPrank(newOwner);
        registry.setAppEnabled(PKP_TOKEN_ID, APP_MANAGER, false);
        assertFalse(registry.isAppEnabled(PKP_TOKEN_ID, APP_MANAGER));
        vm.stopPrank();
    }

    // ======================== Utility Tests ========================

    function testGetToolIdConsistency() public view {
        bytes32 toolId1 = registry.getToolId(TOOL_IPFS_CID);
        bytes32 toolId2 = registry.getToolId(TOOL_IPFS_CID);
        assertEq(toolId1, toolId2);
    }

    function testGetToolIdDifferentCids() public view {
        bytes32 toolId1 = registry.getToolId("QmTool1");
        bytes32 toolId2 = registry.getToolId("QmTool2");
        assertTrue(toolId1 != toolId2);
    }

    function testGetToolIdEmptyCid() public view {
        bytes32 toolId = registry.getToolId("");
        assertEq(toolId, keccak256(abi.encodePacked("")));
    }

    function testRoleVersionValidation() public {
        string[] memory toolIpfsCids = new string[](1);
        bytes32[][] memory policyParams = new bytes32[][](1);
        bytes[][] memory policyValues = new bytes[][](1);

        vm.startPrank(PKP_OWNER);

        // Test with empty version
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, "", toolIpfsCids, policyParams, policyValues);
        assertEq(registry.getRoleVersion(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID), "");

        // Test with very long version string
        string memory longVersion = "1.0.0-alpha.beta.gamma.delta.epsilon.zeta.eta.theta.iota.kappa";
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, longVersion, toolIpfsCids, policyParams, policyValues);
        assertEq(registry.getRoleVersion(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID), longVersion);

        vm.stopPrank();
    }

    function testConcurrentRoleUpdates() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](1);
        policyParams[0][0] = PARAM_ID;

        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](1);
        policyValues[0][0] = PARAM_VALUE;

        vm.startPrank(PKP_OWNER);

        // Add multiple roles
        bytes32[] memory roleIds = new bytes32[](3);
        string[] memory versions = new string[](3);
        for (uint256 i = 0; i < 3; i++) {
            roleIds[i] = bytes32(uint256(i + 1));
            versions[i] = string(abi.encodePacked(vm.toString(i + 1), ".0.0"));
            registry.addRole(
                PKP_TOKEN_ID, APP_MANAGER, roleIds[i], versions[i], toolIpfsCids, policyParams, policyValues
            );
        }

        // Update roles in different order
        for (uint256 i = 0; i < 3; i++) {
            uint256 idx = 2 - i; // Reverse order
            versions[idx] = string(abi.encodePacked(vm.toString(idx + 1), ".1.0"));
            registry.addRole(
                PKP_TOKEN_ID, APP_MANAGER, roleIds[idx], versions[idx], toolIpfsCids, policyParams, policyValues
            );
        }

        // Verify final state
        for (uint256 i = 0; i < 3; i++) {
            assertEq(registry.getRoleVersion(PKP_TOKEN_ID, APP_MANAGER, roleIds[i]), versions[i]);
        }

        vm.stopPrank();
    }

    function testToolPolicyStateTransitions() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](1);
        policyParams[0][0] = PARAM_ID;

        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](1);
        policyValues[0][0] = PARAM_VALUE;

        vm.startPrank(PKP_OWNER);

        // Add role with tool
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);
        bytes32 toolId = registry.getToolId(TOOL_IPFS_CID);

        // Test multiple enable/disable transitions
        for (uint256 i = 0; i < 3; i++) {
            bool enabled = i % 2 == 0;
            registry.setToolPolicyEnabled(PKP_TOKEN_ID, APP_MANAGER, TOOL_IPFS_CID, enabled);
            assertEq(registry.isToolEnabled(PKP_TOKEN_ID, APP_MANAGER, toolId), enabled);
        }

        vm.stopPrank();
    }

    function testSetToolPoliciesEnabled() public {
        // Setup multiple tools
        string[] memory toolIpfsCids = new string[](3);
        toolIpfsCids[0] = "QmTool1";
        toolIpfsCids[1] = "QmTool2";
        toolIpfsCids[2] = "QmTool3";

        bytes32[][] memory policyParams = new bytes32[][](3);
        bytes[][] memory policyValues = new bytes[][](3);
        for (uint256 i = 0; i < 3; i++) {
            policyParams[i] = new bytes32[](0);
            policyValues[i] = new bytes[](0);
        }

        vm.startPrank(PKP_OWNER);

        // Add role with tools
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        // Test bulk disable
        registry.setToolPoliciesEnabled(PKP_TOKEN_ID, APP_MANAGER, toolIpfsCids, false);

        // Verify all tools are disabled
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            bytes32 toolId = registry.getToolId(toolIpfsCids[i]);
            assertFalse(registry.isToolEnabled(PKP_TOKEN_ID, APP_MANAGER, toolId));
        }

        // Test bulk enable
        registry.setToolPoliciesEnabled(PKP_TOKEN_ID, APP_MANAGER, toolIpfsCids, true);

        // Verify all tools are enabled
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            bytes32 toolId = registry.getToolId(toolIpfsCids[i]);
            assertTrue(registry.isToolEnabled(PKP_TOKEN_ID, APP_MANAGER, toolId));
        }

        vm.stopPrank();
    }

    function testSetToolPoliciesEnabledEmptyArray() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](0);

        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](0);

        vm.startPrank(PKP_OWNER);

        // Add role with tool
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        // Test with empty array
        registry.setToolPoliciesEnabled(PKP_TOKEN_ID, APP_MANAGER, new string[](0), false);

        // Original tool should remain unchanged
        bytes32 toolId = registry.getToolId(TOOL_IPFS_CID);
        assertTrue(registry.isToolEnabled(PKP_TOKEN_ID, APP_MANAGER, toolId));

        vm.stopPrank();
    }

    function testSetToolPoliciesEnabledNonexistentTool() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](0);

        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](0);

        vm.startPrank(PKP_OWNER);

        // Add role with tool
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        // Try to enable nonexistent tool
        string[] memory invalidTools = new string[](2);
        invalidTools[0] = TOOL_IPFS_CID; // Valid tool
        invalidTools[1] = "NonexistentTool"; // Invalid tool

        vm.expectRevert("VincentAgentRegistry: tool not found");
        registry.setToolPoliciesEnabled(PKP_TOKEN_ID, APP_MANAGER, invalidTools, true);

        vm.stopPrank();
    }

    function testComplexPolicyValues() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](4);
        policyParams[0][0] = bytes32("uint256Param");
        policyParams[0][1] = bytes32("addressParam");
        policyParams[0][2] = bytes32("boolParam");
        policyParams[0][3] = bytes32("stringParam");

        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](4);
        policyValues[0][0] = abi.encode(uint256(123));
        policyValues[0][1] = abi.encode(address(0x1234));
        policyValues[0][2] = abi.encode(true);
        policyValues[0][3] = abi.encode("test string");

        vm.startPrank(PKP_OWNER);

        // Add role with complex policy values
        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);
        bytes32 toolId = registry.getToolId(TOOL_IPFS_CID);

        // Verify values
        for (uint256 i = 0; i < policyParams[0].length; i++) {
            bytes memory value = registry.getPolicyValue(PKP_TOKEN_ID, APP_MANAGER, toolId, policyParams[0][i]);
            assertEq(keccak256(value), keccak256(policyValues[0][i]));
        }

        // Update with new complex values
        bytes memory newValue = abi.encode(uint256(456));
        registry.updateToolPolicyValue(PKP_TOKEN_ID, APP_MANAGER, TOOL_IPFS_CID, policyParams[0][0], newValue);
        bytes memory updatedValue = registry.getPolicyValue(PKP_TOKEN_ID, APP_MANAGER, toolId, policyParams[0][0]);
        assertEq(keccak256(updatedValue), keccak256(newValue));

        vm.stopPrank();
    }

    function testEventParameterAccuracy() public {
        string[] memory toolIpfsCids = new string[](1);
        toolIpfsCids[0] = TOOL_IPFS_CID;

        bytes32[][] memory policyParams = new bytes32[][](1);
        policyParams[0] = new bytes32[](1);
        policyParams[0][0] = PARAM_ID;

        bytes[][] memory policyValues = new bytes[][](1);
        policyValues[0] = new bytes[](1);
        policyValues[0][0] = PARAM_VALUE;

        vm.startPrank(PKP_OWNER);

        // Test AppAdded event
        vm.expectEmit(true, true, true, true);
        emit AppAdded(PKP_TOKEN_ID, APP_MANAGER, true);

        // Test RoleAdded event
        vm.expectEmit(true, true, true, true);
        emit RoleAdded(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION);

        registry.addRole(PKP_TOKEN_ID, APP_MANAGER, ROLE_ID, ROLE_VERSION, toolIpfsCids, policyParams, policyValues);

        // Test AppEnabled event
        vm.expectEmit(true, true, true, true);
        emit AppEnabled(PKP_TOKEN_ID, APP_MANAGER, false);
        registry.setAppEnabled(PKP_TOKEN_ID, APP_MANAGER, false);

        // Test ToolPolicyEnabled event
        bytes32 toolId = registry.getToolId(TOOL_IPFS_CID);
        vm.expectEmit(true, true, true, true);
        emit ToolPolicyEnabled(PKP_TOKEN_ID, APP_MANAGER, toolId, false);
        registry.setToolPolicyEnabled(PKP_TOKEN_ID, APP_MANAGER, TOOL_IPFS_CID, false);

        // Test PolicyValueSet event
        bytes memory newValue = bytes("newValue");
        vm.expectEmit(true, true, true, true);
        emit PolicyValueSet(PKP_TOKEN_ID, APP_MANAGER, toolId, PARAM_ID, newValue);
        registry.updateToolPolicyValue(PKP_TOKEN_ID, APP_MANAGER, TOOL_IPFS_CID, PARAM_ID, newValue);

        vm.stopPrank();
    }
}
