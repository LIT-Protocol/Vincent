// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../helpers/VincentTestHelper.sol";
import "../../src/VincentBase.sol";
import "../../src/LibVincentDiamondStorage.sol";

/**
 * @title VincentToolFacetTest
 * @notice Test contract for VincentToolFacet
 * @dev Tests functions related to tool registration and approval
 */
contract VincentToolFacetTest is VincentTestHelper {
    function setUp() public override {
        // Call parent setUp to deploy the diamond and initialize standard test data
        super.setUp();
    }

    /**
     * @notice Test registering a new tool
     * @dev Verifies that a tool can be registered with its IPFS CID
     */
    function testRegisterTool() public {
        // Start as deployer
        vm.startPrank(deployer);

        // Create a new tool IPFS CID
        string memory newToolIpfsCid = "QmNewTestTool";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(newToolIpfsCid));

        // Expect the NewToolRegistered event
        vm.expectEmit(true, false, false, false);
        emit NewToolRegistered(hashedToolCid);

        // Register the tool (using registerTools with a single-item array)
        string[] memory singleToolArray = new string[](1);
        singleToolArray[0] = newToolIpfsCid;
        wrappedToolFacet.registerTools(singleToolArray);

        // Verify the tool was registered by checking if it's retrievable
        string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(hashedToolCid);
        assertEq(
            keccak256(abi.encodePacked(retrievedCid)),
            keccak256(abi.encodePacked(newToolIpfsCid)),
            "Retrieved tool IPFS CID should match registered one"
        );

        vm.stopPrank();
    }

    /**
     * @notice Test registering a tool with an empty IPFS CID
     * @dev Verifies that registering a tool with an empty IPFS CID fails
     */
    function testRegisterToolWithEmptyIpfsCid() public {
        vm.startPrank(deployer);

        // Expect the call to revert with EmptyToolIpfsCid error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCid()"));

        // Try to register a tool with an empty IPFS CID
        string[] memory singleToolArray = new string[](1);
        singleToolArray[0] = "";
        wrappedToolFacet.registerTools(singleToolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test registering a tool that's already registered
     * @dev Verifies that registering the same tool twice fails with ToolAlreadyRegistered error
     */
    function testRegisterToolAlreadyRegistered() public {
        vm.startPrank(deployer);

        // Create a tool IPFS CID
        string memory toolIpfsCid = "QmTestToolForDuplication";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Register the tool first time
        string[] memory singleToolArray = new string[](1);
        singleToolArray[0] = toolIpfsCid;
        wrappedToolFacet.registerTools(singleToolArray);

        // Expect the call to revert with ToolAlreadyRegistered error
        vm.expectRevert(abi.encodeWithSignature("ToolAlreadyRegistered(bytes32)", hashedToolCid));

        // Try to register the same tool again
        wrappedToolFacet.registerTools(singleToolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test registering multiple tools at once
     * @dev Verifies that multiple tools can be registered in a single transaction
     */
    function testRegisterTools() public {
        vm.startPrank(deployer);

        // Create array of tool IPFS CIDs
        string[] memory toolIpfsCids = new string[](3);
        toolIpfsCids[0] = "QmBatchTool1";
        toolIpfsCids[1] = "QmBatchTool2";
        toolIpfsCids[2] = "QmBatchTool3";

        // Calculate hashes for verification
        bytes32[] memory hashedToolCids = new bytes32[](3);
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            hashedToolCids[i] = keccak256(abi.encodePacked(toolIpfsCids[i]));
        }

        // Register multiple tools
        wrappedToolFacet.registerTools(toolIpfsCids);

        // Verify all tools were registered
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            string memory retrievedCid = wrappedToolViewFacet.getToolIpfsCidByHash(hashedToolCids[i]);
            assertEq(
                keccak256(abi.encodePacked(retrievedCid)),
                keccak256(abi.encodePacked(toolIpfsCids[i])),
                "Retrieved tool IPFS CID should match registered one"
            );
        }

        vm.stopPrank();
    }

    /**
     * @notice Test registering tools with an empty array
     * @dev Verifies that calling registerTools with an empty array fails
     */
    function testRegisterToolsWithEmptyArray() public {
        vm.startPrank(deployer);

        // Create empty array
        string[] memory emptyToolIpfsCids = new string[](0);

        // Expect the call to revert with EmptyToolIpfsCidsArray error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCidsArray()"));

        // Try to register with empty array
        wrappedToolFacet.registerTools(emptyToolIpfsCids);

        vm.stopPrank();
    }

    /**
     * @notice Test approving a tool
     * @dev Verifies that the approved tools manager can approve a registered tool
     */
    function testApproveTool() public {
        vm.startPrank(deployer);

        // Register a tool first
        string memory toolIpfsCid = "QmToolToApprove";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Register the tool with a single-item array
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.registerTools(toolArray);

        // Expect the ToolApproved event
        vm.expectEmit(true, false, false, false);
        emit ToolApproved(hashedToolCid);

        // Approve the tool
        wrappedToolFacet.approveTools(toolArray);

        // Verify the tool is approved
        bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCid);
        assertTrue(isApproved, "Tool should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test approving multiple tools at once
     * @dev Verifies that multiple tools can be approved in a single transaction
     */
    function testApproveMultipleTools() public {
        vm.startPrank(deployer);

        // Register multiple tools first
        string[] memory toolIpfsCids = new string[](3);
        toolIpfsCids[0] = "QmBatchApprove1";
        toolIpfsCids[1] = "QmBatchApprove2";
        toolIpfsCids[2] = "QmBatchApprove3";

        wrappedToolFacet.registerTools(toolIpfsCids);

        // Calculate hashes for verification
        bytes32[] memory hashedToolCids = new bytes32[](3);
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            hashedToolCids[i] = keccak256(abi.encodePacked(toolIpfsCids[i]));
        }

        // Approve all tools
        wrappedToolFacet.approveTools(toolIpfsCids);

        // Verify all tools are approved
        for (uint256 i = 0; i < hashedToolCids.length; i++) {
            bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCids[i]);
            assertTrue(isApproved, "Tool should be approved");
        }

        vm.stopPrank();
    }

    /**
     * @notice Test approving a tool with non-approved tools manager
     * @dev Verifies that only the approved tools manager can approve tools
     */
    function testApproveToolNotApprovedToolsManager() public {
        vm.startPrank(deployer);

        // Register a tool first
        string memory toolIpfsCid = "QmToolForAuth";

        // Register the tool with a single-item array
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.registerTools(toolArray);

        vm.stopPrank();

        // Switch to non-owner account (not the approved tools manager)
        vm.startPrank(nonOwner);

        // Expect the call to revert with NotApprovedToolsManager error
        vm.expectRevert(abi.encodeWithSignature("NotApprovedToolsManager(address)", nonOwner));

        // Try to approve the tool as non-manager
        wrappedToolFacet.approveTools(toolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test approving a tool that's not registered
     * @dev Verifies that approving an unregistered tool fails
     */
    function testApproveToolNotRegistered() public {
        vm.startPrank(deployer);

        // Create a tool IPFS CID without registering it
        string memory unregisteredToolIpfsCid = "QmUnregisteredTool";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(unregisteredToolIpfsCid));

        // Create array with single unregistered tool
        string[] memory toolsToApprove = new string[](1);
        toolsToApprove[0] = unregisteredToolIpfsCid;

        // Expect the call to revert with ToolNotRegistered error
        vm.expectRevert(abi.encodeWithSignature("ToolNotRegistered(bytes32)", hashedToolCid));

        // Try to approve an unregistered tool
        wrappedToolFacet.approveTools(toolsToApprove);

        vm.stopPrank();
    }

    /**
     * @notice Test approving a tool that's already approved
     * @dev Verifies that approving an already approved tool fails
     */
    function testApproveToolAlreadyApproved() public {
        vm.startPrank(deployer);

        // Register and approve a tool
        string memory toolIpfsCid = "QmAlreadyApprovedTool";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Register the tool with a single-item array
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.registerTools(toolArray);

        // Approve the tool
        wrappedToolFacet.approveTools(toolArray);

        // Expect the call to revert with ToolAlreadyApproved error
        vm.expectRevert(abi.encodeWithSignature("ToolAlreadyApproved(bytes32)", hashedToolCid));

        // Try to approve the tool again
        wrappedToolFacet.approveTools(toolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test approving tools with an empty array
     * @dev Verifies that calling approveTools with an empty array fails
     */
    function testApproveToolsWithEmptyArray() public {
        vm.startPrank(deployer);

        // Create empty array
        string[] memory emptyToolIpfsCids = new string[](0);

        // Expect the call to revert with EmptyToolIpfsCidsArray error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCidsArray()"));

        // Try to approve with empty array
        wrappedToolFacet.approveTools(emptyToolIpfsCids);

        vm.stopPrank();
    }

    /**
     * @notice Test approving a tool with an empty IPFS CID
     * @dev Verifies that approving a tool with an empty IPFS CID fails
     */
    function testApproveToolWithEmptyIpfsCid() public {
        vm.startPrank(deployer);

        // Create array with an empty IPFS CID
        string[] memory toolsWithEmptyCid = new string[](1);
        toolsWithEmptyCid[0] = "";

        // Expect the call to revert with EmptyToolIpfsCid error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCid()"));

        // Try to approve a tool with empty IPFS CID
        wrappedToolFacet.approveTools(toolsWithEmptyCid);

        vm.stopPrank();
    }

    /**
     * @notice Test removing a tool approval
     * @dev Verifies that the approved tools manager can remove tool approvals
     */
    function testRemoveToolApproval() public {
        vm.startPrank(deployer);

        // Register and approve a tool first
        string memory toolIpfsCid = "QmToolToUnapprove";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Register the tool with a single-item array
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.registerTools(toolArray);

        // Approve the tool
        wrappedToolFacet.approveTools(toolArray);

        // Verify the tool is initially approved
        bool isApprovedBefore = wrappedToolViewFacet.isToolApproved(toolIpfsCid);
        assertTrue(isApprovedBefore, "Tool should be approved initially");

        // Expect the ToolApprovalRemoved event
        vm.expectEmit(true, false, false, false);
        emit ToolApprovalRemoved(hashedToolCid);

        // Remove the tool approval
        wrappedToolFacet.removeToolApprovals(toolArray);

        // Verify the tool is no longer approved
        bool isApprovedAfter = wrappedToolViewFacet.isToolApproved(toolIpfsCid);
        assertFalse(isApprovedAfter, "Tool should no longer be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test removing multiple tool approvals at once
     * @dev Verifies that multiple tool approvals can be removed in a single transaction
     */
    function testRemoveMultipleToolApprovals() public {
        vm.startPrank(deployer);

        // Register and approve multiple tools first
        string[] memory toolIpfsCids = new string[](3);
        toolIpfsCids[0] = "QmBatchRemove1";
        toolIpfsCids[1] = "QmBatchRemove2";
        toolIpfsCids[2] = "QmBatchRemove3";

        wrappedToolFacet.registerTools(toolIpfsCids);
        wrappedToolFacet.approveTools(toolIpfsCids);

        // Calculate hashes for verification
        bytes32[] memory hashedToolCids = new bytes32[](3);
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            hashedToolCids[i] = keccak256(abi.encodePacked(toolIpfsCids[i]));
        }

        // Verify all tools are initially approved
        for (uint256 i = 0; i < hashedToolCids.length; i++) {
            bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCids[i]);
            assertTrue(isApproved, "Tool should be approved initially");
        }

        // Remove all tool approvals
        wrappedToolFacet.removeToolApprovals(toolIpfsCids);

        // Verify no tools are approved afterwards
        for (uint256 i = 0; i < hashedToolCids.length; i++) {
            bool isApproved = wrappedToolViewFacet.isToolApproved(toolIpfsCids[i]);
            assertFalse(isApproved, "Tool should no longer be approved");
        }

        vm.stopPrank();
    }

    /**
     * @notice Test removing a tool approval with non-approved tools manager
     * @dev Verifies that only the approved tools manager can remove tool approvals
     */
    function testRemoveToolApprovalNotApprovedToolsManager() public {
        vm.startPrank(deployer);

        // Register and approve a tool first
        string memory toolIpfsCid = "QmToolForAuthRemoval";

        // Register the tool with a single-item array
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.registerTools(toolArray);

        // Approve the tool
        wrappedToolFacet.approveTools(toolArray);

        vm.stopPrank();

        // Switch to non-owner account (not the approved tools manager)
        vm.startPrank(nonOwner);

        // Expect the call to revert with NotApprovedToolsManager error
        vm.expectRevert(abi.encodeWithSignature("NotApprovedToolsManager(address)", nonOwner));

        // Try to remove the tool approval as non-manager
        wrappedToolFacet.removeToolApprovals(toolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test removing an approval for a tool that's not approved
     * @dev Verifies that removing an approval for a non-approved tool fails
     */
    function testRemoveToolApprovalNotApproved() public {
        vm.startPrank(deployer);

        // Register a tool but don't approve it
        string memory toolIpfsCid = "QmNotApprovedTool";
        bytes32 hashedToolCid = keccak256(abi.encodePacked(toolIpfsCid));

        // Register the tool with a single-item array
        string[] memory toolArray = new string[](1);
        toolArray[0] = toolIpfsCid;
        wrappedToolFacet.registerTools(toolArray);

        // Expect the call to revert with ToolNotApproved error
        vm.expectRevert(abi.encodeWithSignature("ToolNotApproved(bytes32)", hashedToolCid));

        // Try to remove approval for a non-approved tool
        wrappedToolFacet.removeToolApprovals(toolArray);

        vm.stopPrank();
    }

    /**
     * @notice Test removing tool approvals with an empty array
     * @dev Verifies that calling removeToolApprovals with an empty array fails
     */
    function testRemoveToolApprovalsWithEmptyArray() public {
        vm.startPrank(deployer);

        // Create empty array
        string[] memory emptyToolIpfsCids = new string[](0);

        // Expect the call to revert with EmptyToolIpfsCidsArray error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCidsArray()"));

        // Try to remove approvals with empty array
        wrappedToolFacet.removeToolApprovals(emptyToolIpfsCids);

        vm.stopPrank();
    }

    /**
     * @notice Test removing a tool approval with an empty IPFS CID
     * @dev Verifies that removing a tool approval with an empty IPFS CID fails
     */
    function testRemoveToolApprovalWithEmptyIpfsCid() public {
        vm.startPrank(deployer);

        // Create array with an empty IPFS CID
        string[] memory toolsWithEmptyCid = new string[](1);
        toolsWithEmptyCid[0] = "";

        // Expect the call to revert with EmptyToolIpfsCid error
        vm.expectRevert(abi.encodeWithSignature("EmptyToolIpfsCid()"));

        // Try to remove approval for a tool with empty IPFS CID
        wrappedToolFacet.removeToolApprovals(toolsWithEmptyCid);

        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved tools manager
     * @dev Verifies that the contract owner can update the approved tools manager
     */
    function testUpdateApprovedToolsManager() public {
        vm.startPrank(deployer);

        // Get current manager
        address currentManager = wrappedToolViewFacet.getApprovedToolsManager();

        // Create a new manager address
        address newManager = makeAddr("new-tools-manager");

        // Expect the ApprovedToolsManagerUpdated event
        vm.expectEmit(true, true, false, false);
        emit ApprovedToolsManagerUpdated(currentManager, newManager);

        // Update the approved tools manager
        wrappedToolFacet.updateApprovedToolsManager(newManager);

        // Verify the manager was updated
        address updatedManager = wrappedToolViewFacet.getApprovedToolsManager();
        assertEq(updatedManager, newManager, "Approved tools manager should be updated");

        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved tools manager by a non-owner
     * @dev Verifies that only the contract owner can update the approved tools manager
     */
    function testUpdateApprovedToolsManagerNotOwner() public {
        // Start as non-owner
        vm.startPrank(nonOwner);

        // Create a new manager address
        address newManager = makeAddr("new-tools-manager-from-non-owner");

        // Expect the call to revert with LibDiamond's owner check
        vm.expectRevert("LibDiamond: Must be contract owner");

        // Try to update the approved tools manager as non-owner
        wrappedToolFacet.updateApprovedToolsManager(newManager);

        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved tools manager to the zero address
     * @dev Verifies that the approved tools manager cannot be set to the zero address
     */
    function testUpdateApprovedToolsManagerToZeroAddress() public {
        vm.startPrank(deployer);

        // Expect the call to revert with InvalidApprovedToolsManager error
        vm.expectRevert(abi.encodeWithSignature("InvalidApprovedToolsManager(address)", address(0)));

        // Try to update the approved tools manager to the zero address
        wrappedToolFacet.updateApprovedToolsManager(address(0));

        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved tools manager to the current manager
     * @dev Verifies that the approved tools manager cannot be set to the same address
     */
    function testUpdateApprovedToolsManagerToSameAddress() public {
        vm.startPrank(deployer);

        // Get current manager
        address currentManager = wrappedToolViewFacet.getApprovedToolsManager();

        // Expect the call to revert with InvalidApprovedToolsManager error
        vm.expectRevert(abi.encodeWithSignature("InvalidApprovedToolsManager(address)", currentManager));

        // Try to update the approved tools manager to the same address
        wrappedToolFacet.updateApprovedToolsManager(currentManager);

        vm.stopPrank();
    }
}
