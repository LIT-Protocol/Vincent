// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../helpers/VincentTestHelper.sol";

/**
 * @title VincentToolFacetTest
 * @dev Tests for the VincentToolFacet and VincentToolViewFacet contracts
 */
contract VincentToolFacetTest is VincentTestHelper {
    function setUp() public override {
        // Call parent setup
        super.setUp();

        // Set up the test as the deployer
        vm.startPrank(deployer);
    }

    function testRegisterSingleTool() public {
        // Set up event expectation
        vm.expectEmit(true, false, false, false);
        emit NewToolRegistered(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1)));

        // Register a tool
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // Verify it was registered correctly
        string memory retrievedCid =
            wrappedToolViewFacet.getToolIpfsCidByHash(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1)));
        assertEq(retrievedCid, TEST_TOOL_IPFS_CID_1, "Retrieved tool IPFS CID doesn't match registered one");

        // Check all tools list
        string[] memory allTools = wrappedToolViewFacet.getAllRegisteredTools();
        assertEq(allTools.length, 1, "Should have exactly 1 tool registered");
        assertEq(allTools[0], TEST_TOOL_IPFS_CID_1, "Tool in list doesn't match registered one");
    }

    function testRegisterSameToolTwice() public {
        // Register the tool first time
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // When registering the same tool again, no event should be emitted
        // This verifies the duplicate prevention logic
        wrappedToolFacet.registerTool(TEST_TOOL_IPFS_CID_1);

        // Check all tools list - should still have only one entry
        string[] memory allTools = wrappedToolViewFacet.getAllRegisteredTools();
        assertEq(allTools.length, 1, "Should still have exactly 1 tool registered");
    }

    function testRegisterMultipleTools() public {
        // Set up string array for multiple tools
        string[] memory tools = new string[](2);
        tools[0] = TEST_TOOL_IPFS_CID_1;
        tools[1] = TEST_TOOL_IPFS_CID_2;

        // Register multiple tools at once
        wrappedToolFacet.registerTools(tools);

        // Verify they were registered correctly
        string memory retrievedCid1 =
            wrappedToolViewFacet.getToolIpfsCidByHash(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1)));
        string memory retrievedCid2 =
            wrappedToolViewFacet.getToolIpfsCidByHash(keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_2)));

        assertEq(retrievedCid1, TEST_TOOL_IPFS_CID_1, "Retrieved tool 1 IPFS CID doesn't match registered one");
        assertEq(retrievedCid2, TEST_TOOL_IPFS_CID_2, "Retrieved tool 2 IPFS CID doesn't match registered one");

        // Check all tools list
        string[] memory allTools = wrappedToolViewFacet.getAllRegisteredTools();
        assertEq(allTools.length, 2, "Should have exactly 2 tools registered");

        // Check the contents of allTools list (order might vary)
        bool foundTool1 = false;
        bool foundTool2 = false;

        for (uint256 i = 0; i < allTools.length; i++) {
            if (keccak256(abi.encodePacked(allTools[i])) == keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_1))) {
                foundTool1 = true;
            } else if (keccak256(abi.encodePacked(allTools[i])) == keccak256(abi.encodePacked(TEST_TOOL_IPFS_CID_2))) {
                foundTool2 = true;
            }
        }

        assertTrue(foundTool1, "Tool 1 not found in the list of all tools");
        assertTrue(foundTool2, "Tool 2 not found in the list of all tools");
    }

    function testRegisterDuplicateToolsInBatch() public {
        // Create array with duplicate entries
        string[] memory tools = new string[](3);
        tools[0] = TEST_TOOL_IPFS_CID_1;
        tools[1] = TEST_TOOL_IPFS_CID_2;
        tools[2] = TEST_TOOL_IPFS_CID_1; // Duplicate

        // Register tools
        wrappedToolFacet.registerTools(tools);

        // Check all tools list - should have 2 entries (no duplicates)
        string[] memory allTools = wrappedToolViewFacet.getAllRegisteredTools();
        assertEq(allTools.length, 2, "Should have exactly 2 tools registered (no duplicates)");
    }

    function testEmptyStringTool() public {
        // Register an empty string
        wrappedToolFacet.registerTool("");

        // Calculate the hash of empty string
        bytes32 emptyStringHash = keccak256(abi.encodePacked(""));

        // Verify it was registered correctly
        string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(emptyStringHash);
        assertEq(retrievedCid, "", "Empty string tool not registered correctly");
    }

    function testGetNonExistentTool() public {
        // Calculate a random hash
        bytes32 nonExistentHash = keccak256(abi.encodePacked("non-existent-tool"));

        // Trying to get a non-existent tool should return an empty string
        string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(nonExistentHash);
        assertEq(retrievedCid, "", "Non-existent tool should return empty string");
    }
}
