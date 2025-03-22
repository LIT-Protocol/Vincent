// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../diamond-base/libraries/LibDiamond.sol";

contract VincentLitActionFacet {
    using VincentLitActionStorage for VincentLitActionStorage.LitActionStorage;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // Events
    event NewLitActionRegistered(bytes32 indexed litActionIpfsCidHash);
    event LitActionApproved(bytes32 indexed litActionIpfsCidHash);
    event LitActionApprovalRemoved(bytes32 indexed litActionIpfsCidHash);
    event ApprovedLitActionsManagerUpdated(address indexed previousManager, address indexed newManager);

    // Errors
    /**
     * @notice Thrown when a Lit Action is not registered
     * @param litActionIpfsCidHash The hash of the Lit Action's IPFS CID that is not registered
     */
    error LitActionNotRegistered(bytes32 litActionIpfsCidHash);

    /**
     * @notice Thrown when a Lit Action is already approved
     * @param litActionIpfsCidHash The hash of the Lit Action's IPFS CID that is already approved
     */
    error LitActionAlreadyApproved(bytes32 litActionIpfsCidHash);

    /**
     * @notice Thrown when a Lit Action is not approved
     * @param litActionIpfsCidHash The hash of the Lit Action's IPFS CID that is not approved
     */
    error LitActionNotApproved(bytes32 litActionIpfsCidHash);

    /**
     * @notice Thrown when a caller is not the approved Lit Actions manager
     * @param caller The address that attempted the operation
     */
    error NotApprovedLitActionsManager(address caller);

    /**
     * @notice Thrown when attempting to set an invalid approved Lit Actions manager
     * @param manager The invalid manager address (typically address zero)
     */
    error InvalidApprovedLitActionsManager(address manager);

    /**
     * @notice Thrown when an empty Lit Action IPFS CID is provided
     */
    error EmptyLitActionIpfsCid();

    /**
     * @notice Thrown when an empty array of Lit Action IPFS CIDs is provided
     */
    error EmptyLitActionIpfsCidsArray();

    /**
     * @notice Thrown when attempting to register a Lit Action that already exists
     * @param litActionIpfsCidHash The hash of the Lit Action's IPFS CID that is already registered
     */
    error LitActionAlreadyRegistered(bytes32 litActionIpfsCidHash);

    modifier onlyApprovedLitActionsManager() {
        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();
        if (ls_.approvedLitActionsManager != msg.sender) revert NotApprovedLitActionsManager(msg.sender);
        _;
    }

    /**
     * @notice Add one or more Lit Actions to the approved list
     * @dev Only callable by the approved Lit Actions manager. If the Lit Action is not registered yet, it will be registered automatically.
     * @param litActionIpfsCids Array of IPFS CIDs of the Lit Actions to approve (can be a single Lit Action)
     */
    function approveLitActions(string[] calldata litActionIpfsCids) external onlyApprovedLitActionsManager {
        // Validate that the array is not empty
        if (litActionIpfsCids.length == 0) {
            revert EmptyLitActionIpfsCidsArray();
        }

        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();

        for (uint256 i = 0; i < litActionIpfsCids.length; i++) {
            string memory litActionIpfsCid = litActionIpfsCids[i];

            // Validate that Lit Action IPFS CID is not empty
            if (bytes(litActionIpfsCid).length == 0) {
                revert EmptyLitActionIpfsCid();
            }

            bytes32 hashedIpfsCid = keccak256(abi.encodePacked(litActionIpfsCid));

            // Ensure the Lit Action is not already approved
            if (ls_.approvedIpfsCidHashes.contains(hashedIpfsCid)) {
                revert LitActionAlreadyApproved(hashedIpfsCid);
            }

            // Register the Lit Action if it's not already registered
            if (bytes(ls_.ipfsCidHashToIpfsCid[hashedIpfsCid]).length == 0) {
                ls_.ipfsCidHashToIpfsCid[hashedIpfsCid] = litActionIpfsCid;
                emit NewLitActionRegistered(hashedIpfsCid);
            }

            // Add the Lit Action to the approved list
            ls_.approvedIpfsCidHashes.add(hashedIpfsCid);
            emit LitActionApproved(hashedIpfsCid);
        }
    }

    /**
     * @notice Remove one or more Lit Actions from the approved list
     * @dev Only callable by the approved Lit Actions manager
     * @param litActionIpfsCids Array of IPFS CIDs of the Lit Actions to remove from the approved list (can be a single Lit Action)
     */
    function removeLitActionApprovals(string[] calldata litActionIpfsCids) external onlyApprovedLitActionsManager {
        // Validate that the array is not empty
        if (litActionIpfsCids.length == 0) {
            revert EmptyLitActionIpfsCidsArray();
        }

        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();

        for (uint256 i = 0; i < litActionIpfsCids.length; i++) {
            string memory litActionIpfsCid = litActionIpfsCids[i];

            // Validate that Lit Action IPFS CID is not empty
            if (bytes(litActionIpfsCid).length == 0) {
                revert EmptyLitActionIpfsCid();
            }

            bytes32 hashedIpfsCid = keccak256(abi.encodePacked(litActionIpfsCid));

            // Ensure the Lit Action is approved
            if (!ls_.approvedIpfsCidHashes.contains(hashedIpfsCid)) {
                revert LitActionNotApproved(hashedIpfsCid);
            }

            // Remove the Lit Action from the approved list
            ls_.approvedIpfsCidHashes.remove(hashedIpfsCid);
            emit LitActionApprovalRemoved(hashedIpfsCid);
        }
    }

    /**
     * @notice Update the approved Lit Actions manager address
     * @dev Only callable by the contract owner if no manager is set yet,
     *      otherwise only callable by the current Lit Actions manager
     * @param newManager The new approved Lit Actions manager address
     */
    function updateApprovedLitActionsManager(address newManager) external {
        if (newManager == address(0)) {
            revert InvalidApprovedLitActionsManager(newManager);
        }

        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();
        address previousManager = ls_.approvedLitActionsManager;

        // Check if the new manager is the same as the current manager
        if (newManager == previousManager) {
            revert InvalidApprovedLitActionsManager(newManager);
        }

        // If a manager is already set, only they can update it
        // If no manager is set yet (address(0)), only the contract owner can set the initial manager
        if (previousManager != address(0)) {
            // Existing manager case - only the current manager can update
            if (msg.sender != previousManager) {
                revert NotApprovedLitActionsManager(msg.sender);
            }
        } else {
            // Initial setup case - only the contract owner can set the first manager
            LibDiamond.enforceIsContractOwner();
        }

        ls_.approvedLitActionsManager = newManager;

        emit ApprovedLitActionsManagerUpdated(previousManager, newManager);
    }
}
