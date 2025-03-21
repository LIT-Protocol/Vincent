// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";
import "../diamond-base/libraries/LibDiamond.sol";

contract VincentToolFacet {
    using VincentToolStorage for VincentToolStorage.ToolStorage;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    // Events
    event NewToolRegistered(bytes32 indexed toolIpfsCidHash);
    event ToolApproved(bytes32 indexed toolIpfsCidHash);
    event ToolApprovalRemoved(bytes32 indexed toolIpfsCidHash);
    event ApprovedToolsManagerUpdated(address indexed previousManager, address indexed newManager);

    // Errors
    /**
     * @notice Thrown when a tool is not registered
     * @param toolIpfsCidHash The hash of the tool's IPFS CID that is not registered
     */
    error ToolNotRegistered(bytes32 toolIpfsCidHash);

    /**
     * @notice Thrown when a tool is already approved
     * @param toolIpfsCidHash The hash of the tool's IPFS CID that is already approved
     */
    error ToolAlreadyApproved(bytes32 toolIpfsCidHash);

    /**
     * @notice Thrown when a tool is not approved
     * @param toolIpfsCidHash The hash of the tool's IPFS CID that is not approved
     */
    error ToolNotApproved(bytes32 toolIpfsCidHash);

    /**
     * @notice Thrown when a caller is not the approved tools manager
     * @param caller The address that attempted the operation
     */
    error NotApprovedToolsManager(address caller);

    /**
     * @notice Thrown when attempting to set an invalid approved tools manager
     * @param manager The invalid manager address (typically address zero)
     */
    error InvalidApprovedToolsManager(address manager);

    /**
     * @notice Thrown when an empty tool IPFS CID is provided
     */
    error EmptyToolIpfsCid();

    /**
     * @notice Thrown when an empty array of tool IPFS CIDs is provided
     */
    error EmptyToolIpfsCidsArray();

    /**
     * @notice Thrown when attempting to register a tool that already exists
     * @param toolIpfsCidHash The hash of the tool's IPFS CID that is already registered
     */
    error ToolAlreadyRegistered(bytes32 toolIpfsCidHash);

    modifier onlyApprovedToolsManager() {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();
        if (ts_.approvedToolsManager != msg.sender) revert NotApprovedToolsManager(msg.sender);
        _;
    }

    modifier onlyContractOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    function registerTools(string[] calldata toolIpfsCids) external {
        // Validate that the array is not empty
        if (toolIpfsCids.length == 0) {
            revert EmptyToolIpfsCidsArray();
        }

        uint256 toolCount = toolIpfsCids.length;
        for (uint256 i = 0; i < toolCount; i++) {
            string memory toolIpfsCid = toolIpfsCids[i];

            // Validate that tool IPFS CID is not empty
            if (bytes(toolIpfsCid).length == 0) {
                revert EmptyToolIpfsCid();
            }

            VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

            bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            if (bytes(ts_.ipfsCidHashToIpfsCid[hashedIpfsCid]).length == 0) {
                ts_.ipfsCidHashToIpfsCid[hashedIpfsCid] = toolIpfsCid;
                emit NewToolRegistered(hashedIpfsCid);
            } else {
                revert ToolAlreadyRegistered(hashedIpfsCid);
            }
        }
    }

    /**
     * @notice Add one or more tools to the approved list
     * @dev Only callable by the approved tools manager
     * @param toolIpfsCids Array of IPFS CIDs of the tools to approve (can be a single tool)
     */
    function approveTools(string[] calldata toolIpfsCids) external onlyApprovedToolsManager {
        // Validate that the array is not empty
        if (toolIpfsCids.length == 0) {
            revert EmptyToolIpfsCidsArray();
        }

        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            string memory toolIpfsCid = toolIpfsCids[i];

            // Validate that tool IPFS CID is not empty
            if (bytes(toolIpfsCid).length == 0) {
                revert EmptyToolIpfsCid();
            }

            bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Ensure the tool is not already approved
            if (ts_.approvedIpfsCidHashes.contains(hashedIpfsCid)) {
                revert ToolAlreadyApproved(hashedIpfsCid);
            }

            // Ensure the tool is registered
            if (bytes(ts_.ipfsCidHashToIpfsCid[hashedIpfsCid]).length == 0) {
                revert ToolNotRegistered(hashedIpfsCid);
            }

            // Add the tool to the approved list
            ts_.approvedIpfsCidHashes.add(hashedIpfsCid);
            emit ToolApproved(hashedIpfsCid);
        }
    }

    /**
     * @notice Remove one or more tools from the approved list
     * @dev Only callable by the approved tools manager
     * @param toolIpfsCids Array of IPFS CIDs of the tools to remove from the approved list (can be a single tool)
     */
    function removeToolApprovals(string[] calldata toolIpfsCids) external onlyApprovedToolsManager {
        // Validate that the array is not empty
        if (toolIpfsCids.length == 0) {
            revert EmptyToolIpfsCidsArray();
        }

        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            string memory toolIpfsCid = toolIpfsCids[i];

            // Validate that tool IPFS CID is not empty
            if (bytes(toolIpfsCid).length == 0) {
                revert EmptyToolIpfsCid();
            }

            bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

            // Ensure the tool is approved
            if (!ts_.approvedIpfsCidHashes.contains(hashedIpfsCid)) {
                revert ToolNotApproved(hashedIpfsCid);
            }

            // Remove the tool from the approved list
            ts_.approvedIpfsCidHashes.remove(hashedIpfsCid);
            emit ToolApprovalRemoved(hashedIpfsCid);
        }
    }

    /**
     * @notice Update the approved tools manager address
     * @dev Only callable by the contract owner
     * @param newManager The new approved tools manager address
     */
    function updateApprovedToolsManager(address newManager) external onlyContractOwner {
        if (newManager == address(0)) {
            revert InvalidApprovedToolsManager(newManager);
        }

        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();
        address previousManager = ts_.approvedToolsManager;

        // Check if the new manager is the same as the current manager
        if (newManager == previousManager) {
            revert InvalidApprovedToolsManager(newManager);
        }

        ts_.approvedToolsManager = newManager;

        emit ApprovedToolsManagerUpdated(previousManager, newManager);
    }
}
