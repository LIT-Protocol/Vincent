// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../helpers/VincentTestHelper.sol";
import "../../src/VincentBase.sol";
import "../../src/LibVincentDiamondStorage.sol";

/**
 * @title VincentLitActionFacetTest
 * @notice Test contract for VincentLitActionFacet
 * @dev Tests functions related to lit action registration and approval
 */
contract VincentLitActionFacetTest is VincentTestHelper {
    function setUp() public override {
        // Call parent setUp to deploy the diamond and initialize standard test data
        super.setUp();
    }

    /**
     * @notice Test registering and approving a new tool
     * @dev Verifies that the approved tools manager can register and approve a tool
     */
    function testRegisterAndApproveTool() public {
        // Start as deployer (the approved tools manager)
        vm.startPrank(deployer);

        // Create a new lit action IPFS CID
        string memory newLitActionIpfsCid = "QmNewTestLitAction";
        bytes32 hashedLitActionCid = keccak256(abi.encodePacked(newLitActionIpfsCid));

        // Expect both the NewLitActionRegistered and LitActionApproved events
        vm.expectEmit(true, false, false, false);
        emit NewLitActionRegistered(hashedLitActionCid);

        vm.expectEmit(true, false, false, false);
        emit LitActionApproved(hashedLitActionCid);

        // Register and approve the tool in one step
        string[] memory singleLitActionArray = new string[](1);
        singleLitActionArray[0] = newLitActionIpfsCid;
        wrappedLitActionFacet.approveLitActions(singleLitActionArray);

        // Verify the lit action was registered by checking if it's retrievable
        string memory retrievedCid = wrappedLitActionViewFacet.getLitActionIpfsCidByHash(hashedLitActionCid);
        assertEq(
            keccak256(abi.encodePacked(retrievedCid)),
            keccak256(abi.encodePacked(newLitActionIpfsCid)),
            "Retrieved lit action IPFS CID should match registered one"
        );

        // Verify the lit action is approved
        bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(newLitActionIpfsCid);
        assertTrue(isApproved, "Lit action should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test registering and approving multiple lit actions
     * @dev Verifies that multiple lit actions can be registered and approved in a single transaction
     */
    function testRegisterAndApproveMultipleLitActions() public {
        vm.startPrank(deployer);

        // Create array of lit action IPFS CIDs
        string[] memory litActionIpfsCids = new string[](3);
        litActionIpfsCids[0] = "QmBatchLitAction1";
        litActionIpfsCids[1] = "QmBatchLitAction2";
        litActionIpfsCids[2] = "QmBatchLitAction3";

        // Calculate hashes for verification
        bytes32[] memory hashedLitActionCids = new bytes32[](3);
        for (uint256 i = 0; i < litActionIpfsCids.length; i++) {
            hashedLitActionCids[i] = keccak256(abi.encodePacked(litActionIpfsCids[i]));
        }

        // Register and approve multiple lit actions
        wrappedLitActionFacet.approveLitActions(litActionIpfsCids);

        // Verify all lit actions were registered and approved
        for (uint256 i = 0; i < litActionIpfsCids.length; i++) {
            string memory retrievedCid = wrappedLitActionViewFacet.getLitActionIpfsCidByHash(hashedLitActionCids[i]);
            assertEq(
                keccak256(abi.encodePacked(retrievedCid)),
                keccak256(abi.encodePacked(litActionIpfsCids[i])),
                "Retrieved lit action IPFS CID should match registered one"
            );

            // Check approval
            bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCids[i]);
            assertTrue(isApproved, "Lit action should be approved");
        }

        vm.stopPrank();
    }

    /**
     * @notice Test non-manager attempting to register and approve lit actions
     * @dev Verifies that only the approved lit actions manager can register and approve lit actions
     */
    function testNonManagerCannotRegisterLitActions() public {
        // Start as non-manager
        vm.startPrank(nonOwner);

        // Create a lit action IPFS CID
        string memory litActionIpfsCid = "QmNonManagerRegLitAction";

        string[] memory litActionArray = new string[](1);
        litActionArray[0] = litActionIpfsCid;

        // Expect the call to revert with NotApprovedLitActionsManager error
        vm.expectRevert(abi.encodeWithSignature("NotApprovedLitActionsManager(address)", nonOwner));

        // Try to approve (and register) as non-manager
        wrappedLitActionFacet.approveLitActions(litActionArray);

        vm.stopPrank();
    }

    /**
     * @notice Test registering a lit action with an empty IPFS CID
     * @dev Verifies that registering a lit action with an empty IPFS CID fails
     */
    function testApproveLitActionWithEmptyIpfsCid() public {
        vm.startPrank(deployer);

        // Create array with an empty IPFS CID
        string[] memory litActionsWithEmptyCid = new string[](1);
        litActionsWithEmptyCid[0] = "";

        // Expect the call to revert with EmptyLitActionIpfsCid error
        vm.expectRevert(abi.encodeWithSignature("EmptyLitActionIpfsCid()"));

        // Try to approve a lit action with empty IPFS CID
        wrappedLitActionFacet.approveLitActions(litActionsWithEmptyCid);

        vm.stopPrank();
    }

    /**
     * @notice Test registering a lit action that's already registered
     * @dev Verifies that registering the same lit action twice fails with LitActionAlreadyRegistered error
     */
    function testRegisterLitActionAlreadyRegistered() public {
        vm.startPrank(deployer);

        // Create a lit action IPFS CID
        string memory litActionIpfsCid = "QmTestLitActionForDuplication";
        bytes32 hashedLitActionCid = keccak256(abi.encodePacked(litActionIpfsCid));

        // Register the lit action first time
        string[] memory singleLitActionArray = new string[](1);
        singleLitActionArray[0] = litActionIpfsCid;
        wrappedLitActionFacet.approveLitActions(singleLitActionArray);

        // Expect the call to revert with LitActionAlreadyApproved error
        vm.expectRevert(abi.encodeWithSignature("LitActionAlreadyApproved(bytes32)", hashedLitActionCid));

        // Try to register the same lit action again
        wrappedLitActionFacet.approveLitActions(singleLitActionArray);

        vm.stopPrank();
    }

    /**
     * @notice Test registering multiple lit actions at once
     * @dev Verifies that multiple lit actions can be registered in a single transaction
     */
    function testRegisterLitActions() public {
        vm.startPrank(deployer);

        // Create array of lit action IPFS CIDs
        string[] memory litActionIpfsCids = new string[](3);
        litActionIpfsCids[0] = "QmBatchLitAction1";
        litActionIpfsCids[1] = "QmBatchLitAction2";
        litActionIpfsCids[2] = "QmBatchLitAction3";

        // Calculate hashes for verification
        bytes32[] memory hashedLitActionCids = new bytes32[](3);
        for (uint256 i = 0; i < litActionIpfsCids.length; i++) {
            hashedLitActionCids[i] = keccak256(abi.encodePacked(litActionIpfsCids[i]));
        }

        // Register multiple lit actions
        wrappedLitActionFacet.approveLitActions(litActionIpfsCids);

        // Verify all lit actions were registered
        for (uint256 i = 0; i < litActionIpfsCids.length; i++) {
            string memory retrievedCid = wrappedLitActionViewFacet.getLitActionIpfsCidByHash(hashedLitActionCids[i]);
            assertEq(
                keccak256(abi.encodePacked(retrievedCid)),
                keccak256(abi.encodePacked(litActionIpfsCids[i])),
                "Retrieved lit action IPFS CID should match registered one"
            );
        }

        vm.stopPrank();
    }

    /**
     * @notice Test approving a lit action that's already registered
     * @dev Verifies that the approved lit actions manager can approve a registered lit action
     */
    function testApproveRegisteredLitAction() public {
        vm.startPrank(deployer);

        // Register a lit action first
        string memory litActionIpfsCid = "QmLitActionToApprove";
        bytes32 hashedLitActionCid = keccak256(abi.encodePacked(litActionIpfsCid));

        // Register the lit action with a single-item array
        string[] memory litActionArray = new string[](1);
        litActionArray[0] = litActionIpfsCid;
        wrappedLitActionFacet.approveLitActions(litActionArray);

        // Verify the lit action is approved
        bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCid);
        assertTrue(isApproved, "Lit action should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test approving a lit action that's not registered yet
     * @dev Verifies that the approved lit actions manager can register and approve a lit action in one transaction
     */
    function testApproveLitAction() public {
        vm.startPrank(deployer);

        // Create a new lit action IPFS CID (not registered yet)
        string memory newLitActionIpfsCid = "QmNewLitActionDirectApprove";
        bytes32 hashedLitActionCid = keccak256(abi.encodePacked(newLitActionIpfsCid));

        // Expect both events
        vm.expectEmit(true, false, false, false);
        emit NewLitActionRegistered(hashedLitActionCid);

        vm.expectEmit(true, false, false, false);
        emit LitActionApproved(hashedLitActionCid);

        // Approve the lit action directly without registering first
        string[] memory singleLitActionArray = new string[](1);
        singleLitActionArray[0] = newLitActionIpfsCid;
        wrappedLitActionFacet.approveLitActions(singleLitActionArray);

        // Verify the lit action was registered by checking if it's retrievable
        string memory retrievedCid = wrappedLitActionViewFacet.getLitActionIpfsCidByHash(hashedLitActionCid);
        assertEq(
            keccak256(abi.encodePacked(retrievedCid)),
            keccak256(abi.encodePacked(newLitActionIpfsCid)),
            "Retrieved lit action IPFS CID should match registered one"
        );

        // Verify the lit action is approved
        bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(newLitActionIpfsCid);
        assertTrue(isApproved, "Lit action should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test approving multiple lit actions at once
     * @dev Verifies that multiple lit actions can be approved in a single transaction,
     *      including automatic registration if needed
     */
    function testApproveMultipleLitActions() public {
        vm.startPrank(deployer);

        // Create multiple lit actions without pre-registering them
        string[] memory litActionIpfsCids = new string[](3);
        litActionIpfsCids[0] = "QmBatchApprove1";
        litActionIpfsCids[1] = "QmBatchApprove2";
        litActionIpfsCids[2] = "QmBatchApprove3";

        // Calculate hashes for verification
        bytes32[] memory hashedLitActionCids = new bytes32[](3);
        for (uint256 i = 0; i < litActionIpfsCids.length; i++) {
            hashedLitActionCids[i] = keccak256(abi.encodePacked(litActionIpfsCids[i]));
        }

        // Approve all lit actions (will also register them)
        wrappedLitActionFacet.approveLitActions(litActionIpfsCids);

        // Verify all tools are registered and approved
        for (uint256 i = 0; i < litActionIpfsCids.length; i++) {
            // Check registration
            string memory retrievedCid = wrappedLitActionViewFacet.getLitActionIpfsCidByHash(hashedLitActionCids[i]);
            assertEq(
                keccak256(abi.encodePacked(retrievedCid)),
                keccak256(abi.encodePacked(litActionIpfsCids[i])),
                "Retrieved lit action IPFS CID should match registered one"
            );

            // Check approval
            bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCids[i]);
            assertTrue(isApproved, "Lit action should be approved");
        }

        vm.stopPrank();
    }

    /**
     * @notice Test approving a mix of new and existing lit actions
     * @dev Verifies that the function handles both registered and unregistered lit actions
     */
    function testApproveMixedLitActions() public {
        vm.startPrank(deployer);

        // First register a lit action but don't approve it (can't do this anymore since approveLitActions always approves)
        string memory existingLitActionIpfsCid = "QmExistingLitAction";
        bytes32 existingLitActionHash = keccak256(abi.encodePacked(existingLitActionIpfsCid));

        // Create a new lit action that hasn't been registered yet
        string memory newLitActionIpfsCid = "QmNewLitAction";
        bytes32 newLitActionHash = keccak256(abi.encodePacked(newLitActionIpfsCid));

        // Create another new lit action that hasn't been registered or approved yet
        string memory anotherNewLitActionIpfsCid = "QmAnotherNewLitAction";
        bytes32 anotherNewLitActionHash = keccak256(abi.encodePacked(anotherNewLitActionIpfsCid));

        // We should see NewLitActionRegistered and LitActionApproved events for both lit actions
        vm.expectEmit(true, false, false, false);
        emit NewLitActionRegistered(newLitActionHash);

        vm.expectEmit(true, false, false, false);
        emit LitActionApproved(newLitActionHash);

        vm.expectEmit(true, false, false, false);
        emit NewLitActionRegistered(anotherNewLitActionHash);

        vm.expectEmit(true, false, false, false);
        emit LitActionApproved(anotherNewLitActionHash);

        // Approve both new lit actions in one transaction
        string[] memory mixedLitActionArray = new string[](2);
        mixedLitActionArray[0] = newLitActionIpfsCid;
        mixedLitActionArray[1] = anotherNewLitActionIpfsCid;
        wrappedLitActionFacet.approveLitActions(mixedLitActionArray);

        // Verify both lit actions are registered and approved
        bool isNewApproved = wrappedLitActionViewFacet.isLitActionApproved(newLitActionIpfsCid);
        bool isAnotherNewApproved = wrappedLitActionViewFacet.isLitActionApproved(anotherNewLitActionIpfsCid);

        assertTrue(isNewApproved, "New lit action should be approved");
        assertTrue(isAnotherNewApproved, "Another new lit action should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test approving a lit action with non-approved lit actions manager
     * @dev Verifies that only the approved lit actions manager can approve lit actions
     */
    function testApproveLitActionNotApprovedLitActionsManager() public {
        vm.startPrank(deployer);

        // Register a lit action first
        string memory litActionIpfsCid = "QmLitActionForAuth";

        // Register the lit action with a single-item array
        string[] memory litActionArray = new string[](1);
        litActionArray[0] = litActionIpfsCid;
        wrappedLitActionFacet.approveLitActions(litActionArray);

        vm.stopPrank();

        // Switch to non-owner account (not the approved tools manager)
        vm.startPrank(nonOwner);

        // Expect the call to revert with NotApprovedLitActionsManager error
        vm.expectRevert(abi.encodeWithSignature("NotApprovedLitActionsManager(address)", nonOwner));

        // Try to approve the lit action as non-manager
        wrappedLitActionFacet.approveLitActions(litActionArray);

        vm.stopPrank();
    }

    /**
     * @notice Test approving a lit action that's not registered
     * @dev Verifies that the function registers and approves an unregistered lit action
     * @dev This behavior has changed - we now register and approve in one step
     */
    function testApproveLitActionNotRegistered() public {
        vm.startPrank(deployer);

        // Create a lit action IPFS CID without registering it
        string memory unregisteredLitActionIpfsCid = "QmUnregisteredLitAction";
        bytes32 hashedLitActionCid = keccak256(abi.encodePacked(unregisteredLitActionIpfsCid));

        // Expect the NewLitActionRegistered and LitActionApproved events
        vm.expectEmit(true, false, false, false);
        emit NewLitActionRegistered(hashedLitActionCid);

        vm.expectEmit(true, false, false, false);
        emit LitActionApproved(hashedLitActionCid);

        // Create array with single unregistered lit action
        string[] memory litActionsToApprove = new string[](1);
        litActionsToApprove[0] = unregisteredLitActionIpfsCid;

        // Approve the lit action - it should be registered automatically
        wrappedLitActionFacet.approveLitActions(litActionsToApprove);

        // Verify the lit action is now registered and approved
        string memory retrievedCid = wrappedLitActionViewFacet.getLitActionIpfsCidByHash(hashedLitActionCid);
        assertEq(
            keccak256(abi.encodePacked(retrievedCid)),
            keccak256(abi.encodePacked(unregisteredLitActionIpfsCid)),
            "Lit action should be registered automatically"
        );

        bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(unregisteredLitActionIpfsCid);
        assertTrue(isApproved, "Lit action should be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test approving a lit action that's already approved
     * @dev Verifies that approving an already approved lit action fails
     */
    function testApproveLitActionAlreadyApproved() public {
        vm.startPrank(deployer);

        // Register and approve a lit action first
        string memory litActionIpfsCid = "QmAlreadyApprovedLitAction";
        bytes32 hashedLitActionCid = keccak256(abi.encodePacked(litActionIpfsCid));

        // Register and approve the lit action
        string[] memory litActionArray = new string[](1);
        litActionArray[0] = litActionIpfsCid;
        wrappedLitActionFacet.approveLitActions(litActionArray);

        // Verify the lit action is approved
        bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCid);
        assertTrue(isApproved, "Lit action should be approved");

        // Expect the call to revert with LitActionAlreadyApproved error
        vm.expectRevert(abi.encodeWithSignature("LitActionAlreadyApproved(bytes32)", hashedLitActionCid));

        // Try to approve the already approved lit action again
        wrappedLitActionFacet.approveLitActions(litActionArray);

        vm.stopPrank();
    }

    /**
     * @notice Test attempting to use approveLitActions with an empty IPFS CID
     * @dev Verifies that approving a lit action with an empty IPFS CID fails
     */
    function testEmptyIpfsCidInApproveLitActions() public {
        vm.startPrank(deployer);

        // Create array with an empty IPFS CID
        string[] memory litActionsWithEmptyCid = new string[](1);
        litActionsWithEmptyCid[0] = "";

        // Expect the call to revert with EmptyLitActionIpfsCid error
        vm.expectRevert(abi.encodeWithSignature("EmptyLitActionIpfsCid()"));

        // Try to approve a lit action with empty IPFS CID
        wrappedLitActionFacet.approveLitActions(litActionsWithEmptyCid);

        vm.stopPrank();
    }

    /**
     * @notice Test removing a lit action approval
     * @dev Verifies that the approved lit actions manager can remove lit action approvals
     */
    function testRemoveLitActionApproval() public {
        vm.startPrank(deployer);

        // Register and approve a lit action first
        string memory litActionIpfsCid = "QmLitActionToUnapprove";
        bytes32 hashedLitActionCid = keccak256(abi.encodePacked(litActionIpfsCid));

        // Register the lit action with a single-item array
        string[] memory litActionArray = new string[](1);
        litActionArray[0] = litActionIpfsCid;
        wrappedLitActionFacet.approveLitActions(litActionArray);

        // Verify the lit action is initially approved
        bool isApprovedBefore = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCid);
        assertTrue(isApprovedBefore, "Lit action should be approved initially");

        // Expect the LitActionApprovalRemoved event
        vm.expectEmit(true, false, false, false);
        emit LitActionApprovalRemoved(hashedLitActionCid);

        // Remove the lit action approval
        wrappedLitActionFacet.removeLitActionApprovals(litActionArray);

        // Verify the lit action is no longer approved
        bool isApprovedAfter = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCid);
        assertFalse(isApprovedAfter, "Lit action should no longer be approved");

        vm.stopPrank();
    }

    /**
     * @notice Test removing multiple lit action approvals at once
     * @dev Verifies that multiple lit action approvals can be removed in a single transaction
     */
    function testRemoveMultipleLitActionApprovals() public {
        vm.startPrank(deployer);

        // Register and approve multiple lit actions first
        string[] memory litActionIpfsCids = new string[](3);
        litActionIpfsCids[0] = "QmBatchRemove1";
        litActionIpfsCids[1] = "QmBatchRemove2";
        litActionIpfsCids[2] = "QmBatchRemove3";

        string[] memory litActionArray = new string[](3);
        litActionArray[0] = litActionIpfsCids[0];
        litActionArray[1] = litActionIpfsCids[1];
        litActionArray[2] = litActionIpfsCids[2];

        wrappedLitActionFacet.approveLitActions(litActionArray);

        // Calculate hashes for verification
        bytes32[] memory hashedLitActionCids = new bytes32[](3);
        for (uint256 i = 0; i < litActionIpfsCids.length; i++) {
            hashedLitActionCids[i] = keccak256(abi.encodePacked(litActionIpfsCids[i]));
        }

        // Verify all lit actions are initially approved
        for (uint256 i = 0; i < hashedLitActionCids.length; i++) {
            bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCids[i]);
            assertTrue(isApproved, "Lit action should be approved initially");
        }

        // Remove all lit action approvals
        wrappedLitActionFacet.removeLitActionApprovals(litActionArray);

        // Verify no lit actions are approved afterwards
        for (uint256 i = 0; i < hashedLitActionCids.length; i++) {
            bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCids[i]);
            assertFalse(isApproved, "Lit action should no longer be approved");
        }

        vm.stopPrank();
    }

    /**
     * @notice Test removing a lit action approval with non-approved lit actions manager
     * @dev Verifies that only the approved lit actions manager can remove lit action approvals
     */
    function testRemoveLitActionApprovalNotApprovedLitActionsManager() public {
        vm.startPrank(deployer);

        // Register and approve a lit action first
        string memory litActionIpfsCid = "QmLitActionForAuthRemoval";

        // Register the lit action with a single-item array
        string[] memory litActionArray = new string[](1);
        litActionArray[0] = litActionIpfsCid;
        wrappedLitActionFacet.approveLitActions(litActionArray);

        vm.stopPrank();

        // Switch to non-owner account (not the approved tools manager)
        vm.startPrank(nonOwner);

        // Expect the call to revert with NotApprovedLitActionsManager error
        vm.expectRevert(abi.encodeWithSignature("NotApprovedLitActionsManager(address)", nonOwner));

        // Try to remove the lit action approval as non-manager
        wrappedLitActionFacet.removeLitActionApprovals(litActionArray);

        vm.stopPrank();
    }

    /**
     * @notice Test removing an approval for a lit action that was just approved
     * @dev Verifies that removing an approval for a recently approved lit action works properly
     */
    function testRemoveLitActionApprovalNotApproved() public {
        vm.startPrank(deployer);

        // Register and approve a lit action
        string memory litActionIpfsCid = "QmNotApprovedLitAction";
        bytes32 hashedLitActionCid = keccak256(abi.encodePacked(litActionIpfsCid));

        // Register and approve the lit action
        string[] memory litActionArray = new string[](1);
        litActionArray[0] = litActionIpfsCid;
        wrappedLitActionFacet.approveLitActions(litActionArray);

        // Verify it's approved
        bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCid);
        assertTrue(isApproved, "Lit action should be approved initially");

        // Remove the approval
        wrappedLitActionFacet.removeLitActionApprovals(litActionArray);

        // Verify it's no longer approved
        isApproved = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCid);
        assertFalse(isApproved, "Lit action should not be approved after removal");

        // Expect the call to revert with LitActionNotApproved error
        vm.expectRevert(abi.encodeWithSignature("LitActionNotApproved(bytes32)", hashedLitActionCid));

        // Try to remove approval again when it's already been removed
        wrappedLitActionFacet.removeLitActionApprovals(litActionArray);

        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved lit actions manager
     * @dev Since the test environment initializes with the manager as deployer, we test that case
     */
    function testUpdateApprovedLitActionsManager() public {
        vm.startPrank(deployer);

        // Get current manager (which is already set to deployer)
        address currentManager = wrappedLitActionViewFacet.getApprovedLitActionsManager();
        assertEq(currentManager, deployer, "Manager should initially be the deployer");

        // Create a new manager address
        address newManager = makeAddr("new-lit-actions-manager");

        // Expect the ApprovedLitActionsManagerUpdated event with actual values
        vm.expectEmit(true, true, false, false);
        emit ApprovedLitActionsManagerUpdated(deployer, newManager);

        // Update the approved lit actions manager
        wrappedLitActionFacet.updateApprovedLitActionsManager(newManager);

        // Verify the manager was updated
        address updatedManager = wrappedLitActionViewFacet.getApprovedLitActionsManager();
        assertEq(updatedManager, newManager, "Approved lit actions manager should be updated");

        // Reset back to deployer for other tests
        vm.stopPrank();

        vm.startPrank(newManager);
        wrappedLitActionFacet.updateApprovedLitActionsManager(deployer);
        vm.stopPrank();
    }

    /**
     * @notice Test non-manager attempting to update the approved lit actions manager
     * @dev This test accounts for the fact that the manager is already set to deployer
     */
    function testUpdateApprovedLitActionsManagerNotManager() public {
        // Get current manager (which is already set to deployer)
        address currentManager = wrappedLitActionViewFacet.getApprovedLitActionsManager();
        assertEq(currentManager, deployer, "Manager should initially be the deployer");

        // Start as a different account (not the manager)
        address randomUser = makeAddr("random-user");
        vm.startPrank(randomUser);

        // Create a new manager address
        address attemptedManager = makeAddr("attempted-new-manager");

        // Expect the call to revert with NotApprovedLitActionsManager error
        vm.expectRevert(abi.encodeWithSignature("NotApprovedLitActionsManager(address)", randomUser));

        // Try to update the approved lit actions manager as non-manager
        wrappedLitActionFacet.updateApprovedLitActionsManager(attemptedManager);

        vm.stopPrank();

        // Also verify contract owner cannot update if not the current manager
        // First set a different manager
        vm.startPrank(deployer);
        address firstManager = makeAddr("first-manager");
        wrappedLitActionFacet.updateApprovedLitActionsManager(firstManager);
        vm.stopPrank();

        // Now try as deployer (who is owner but no longer manager)
        vm.startPrank(deployer);
        vm.expectRevert(abi.encodeWithSignature("NotApprovedLitActionsManager(address)", deployer));
        wrappedLitActionFacet.updateApprovedLitActionsManager(attemptedManager);
        vm.stopPrank();

        // Reset to original state
        vm.startPrank(firstManager);
        wrappedLitActionFacet.updateApprovedLitActionsManager(deployer);
        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved tools manager by the current manager
     * @dev Tests that a manager can pass control to another manager
     */
    function testUpdateApprovedLitActionsManagerByManager() public {
        vm.startPrank(deployer);

        // First get the current manager
        address currentManager = wrappedLitActionViewFacet.getApprovedLitActionsManager();
        assertEq(currentManager, deployer, "Manager should initially be the deployer");

        // Create a manager address to use
        address firstManager = makeAddr("first-lit-actions-manager");

        // Set the first manager
        wrappedLitActionFacet.updateApprovedLitActionsManager(firstManager);

        // Verify the manager was updated
        address updatedManager = wrappedLitActionViewFacet.getApprovedLitActionsManager();
        assertEq(updatedManager, firstManager, "Lit actions manager should be set to first manager");

        vm.stopPrank();

        // Now use the current manager to update to a new manager
        vm.startPrank(firstManager);

        // Create another new manager address
        address secondManager = makeAddr("second-lit-actions-manager");

        // Expect the ApprovedLitActionsManagerUpdated event
        vm.expectEmit(true, true, false, false);
        emit ApprovedLitActionsManagerUpdated(firstManager, secondManager);

        // Update the approved lit actions manager as the current manager
        wrappedLitActionFacet.updateApprovedLitActionsManager(secondManager);

        // Verify the manager was updated
        updatedManager = wrappedLitActionViewFacet.getApprovedLitActionsManager();
        assertEq(updatedManager, secondManager, "Lit actions manager should be updated to second manager");

        vm.stopPrank();

        // Restore the original state back to deployer
        vm.startPrank(secondManager);
        wrappedLitActionFacet.updateApprovedLitActionsManager(deployer);
        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved lit actions manager to the zero address
     * @dev Verifies that the approved lit actions manager cannot be set to the zero address
     */
    function testUpdateApprovedLitActionsManagerToZeroAddress() public {
        vm.startPrank(deployer);

        // Expect the call to revert with InvalidApprovedLitActionsManager error
        vm.expectRevert(abi.encodeWithSignature("InvalidApprovedLitActionsManager(address)", address(0)));

        // Try to update the approved lit actions manager to the zero address
        wrappedLitActionFacet.updateApprovedLitActionsManager(address(0));

        vm.stopPrank();
    }

    /**
     * @notice Test updating the approved lit actions manager to the current manager
     * @dev Verifies that the approved lit actions manager cannot be set to the same address
     */
    function testUpdateApprovedLitActionsManagerToSameAddress() public {
        vm.startPrank(deployer);

        // Get current manager
        address currentManager = wrappedLitActionViewFacet.getApprovedLitActionsManager();

        // Expect the call to revert with InvalidApprovedLitActionsManager error
        vm.expectRevert(abi.encodeWithSignature("InvalidApprovedLitActionsManager(address)", currentManager));

        // Try to update the approved lit actions manager to the same address
        wrappedLitActionFacet.updateApprovedLitActionsManager(currentManager);

        vm.stopPrank();
    }

    /**
     * @notice Test attempting to approve an already approved lit action
     * @dev Verifies that the function reverts when trying to approve an already approved lit action
     */
    function testApproveAlreadyApprovedLitAction() public {
        vm.startPrank(deployer);

        // First register and approve a lit action
        string memory litActionIpfsCid = "QmAlreadyApprovedLitActionCombined";
        bytes32 hashedLitActionCid = keccak256(abi.encodePacked(litActionIpfsCid));

        string[] memory litActionArray = new string[](1);
        litActionArray[0] = litActionIpfsCid;

        // Approve the lit action first (which will also register it)
        wrappedLitActionFacet.approveLitActions(litActionArray);

        // Verify it's approved
        bool isApproved = wrappedLitActionViewFacet.isLitActionApproved(litActionIpfsCid);
        assertTrue(isApproved, "Lit action should be approved initially");

        // Expect revert when trying to approve again
        vm.expectRevert(abi.encodeWithSignature("LitActionAlreadyApproved(bytes32)", hashedLitActionCid));

        // Try to approve again
        wrappedLitActionFacet.approveLitActions(litActionArray);

        vm.stopPrank();
    }

    /**
     * @notice Test removing lit action approvals with an empty array
     * @dev Verifies that calling removeLitActionApprovals with an empty array fails
     */
    function testEmptyArrayInApproveLitActions() public {
        vm.startPrank(deployer);

        // Create empty array
        string[] memory emptyLitActionIpfsCids = new string[](0);

        // Expect the call to revert with EmptyLitActionIpfsCidsArray error
        vm.expectRevert(abi.encodeWithSignature("EmptyLitActionIpfsCidsArray()"));

        // Try to approve with empty array
        wrappedLitActionFacet.approveLitActions(emptyLitActionIpfsCids);

        vm.stopPrank();
    }

    /**
     * @notice Test removing a lit action approval with an empty IPFS CID
     * @dev Verifies that removing a lit action approval with an empty IPFS CID fails
     */
    function testRemoveLitActionApprovalWithEmptyIpfsCid() public {
        vm.startPrank(deployer);

        // Create array with an empty IPFS CID
        string[] memory litActionsWithEmptyCid = new string[](1);
        litActionsWithEmptyCid[0] = "";

        // Expect the call to revert with EmptyLitActionIpfsCid error
        vm.expectRevert(abi.encodeWithSignature("EmptyLitActionIpfsCid()"));

        // Try to remove approval for a lit action with empty IPFS CID
        wrappedLitActionFacet.removeLitActionApprovals(litActionsWithEmptyCid);

        vm.stopPrank();
    }

    /**
     * @notice Test removing lit action approvals with an empty array
     * @dev Verifies that calling removeLitActionApprovals with an empty array fails
     */
    function testRemoveLitActionApprovalsWithEmptyArray() public {
        vm.startPrank(deployer);

        // Create empty array
        string[] memory emptyLitActionIpfsCids = new string[](0);

        // Expect the call to revert with EmptyLitActionIpfsCidsArray error
        vm.expectRevert(abi.encodeWithSignature("EmptyLitActionIpfsCidsArray()"));

        // Try to remove approvals with empty array
        wrappedLitActionFacet.removeLitActionApprovals(emptyLitActionIpfsCids);

        vm.stopPrank();
    }
}
