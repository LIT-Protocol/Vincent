// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";

contract VincentToolViewFacet {
    using VincentToolStorage for VincentToolStorage.ToolStorage;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /**
     * @notice Thrown when a tool hash does not exist
     * @param toolIpfsCidHash The hash of the tool's IPFS CID that doesn't exist
     */
    error ToolHashNotFound(bytes32 toolIpfsCidHash);

    /**
     * @notice Thrown when an empty tool IPFS CID is provided
     */
    error EmptyToolIpfsCid();

    /**
     * @notice Thrown when no tools are registered in the system
     */
    error NoToolsRegistered();

    /**
     * @notice Thrown when no tools are approved in the system
     */
    error NoToolsApproved();

    /**
     * @notice Retrieves a tool's IPFS CID from its hash
     * @param toolIpfsCidHash The hash of the tool's IPFS CID
     * @return The tool's IPFS CID
     */
    function getToolIpfsCidByHash(bytes32 toolIpfsCidHash) external view returns (bytes memory) {
        bytes memory toolIpfsCid = VincentToolStorage.toolStorage().ipfsCidHashToIpfsCid[toolIpfsCidHash];

        // Check if the tool exists
        if (toolIpfsCid.length == 0) {
            revert ToolHashNotFound(toolIpfsCidHash);
        }

        return toolIpfsCid;
    }

    /**
     * @notice Retrieves all registered tools
     * @return toolIpfsCids Array of registered tool IPFS CIDs
     */
    function getAllRegisteredTools() external view returns (bytes[] memory toolIpfsCids) {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        uint256 toolCount = ts_.registeredTools.length();

        // Check if there are any registered tools
        if (toolCount == 0) {
            revert NoToolsRegistered();
        }

        toolIpfsCids = new bytes[](toolCount);
        for (uint256 i = 0; i < toolCount; i++) {
            toolIpfsCids[i] = ts_.ipfsCidHashToIpfsCid[ts_.registeredTools.at(i)];
        }
    }

    /**
     * @notice Get all approved tools
     * @return toolIpfsCids Array of approved tool IPFS CIDs
     */
    function getAllApprovedTools() external view returns (bytes[] memory toolIpfsCids) {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        uint256 toolCount = ts_.approvedIpfsCidHashes.length();

        // Check if there are any approved tools
        if (toolCount == 0) {
            revert NoToolsApproved();
        }

        toolIpfsCids = new bytes[](toolCount);
        for (uint256 i = 0; i < toolCount; i++) {
            bytes32 hashedIpfsCid = ts_.approvedIpfsCidHashes.at(i);
            toolIpfsCids[i] = ts_.ipfsCidHashToIpfsCid[hashedIpfsCid];
        }
    }

    /**
     * @notice Check if a tool is approved
     * @param toolIpfsCid The IPFS CID of the tool to check
     * @return isApproved Whether the tool is approved
     */
    function isToolApproved(bytes calldata toolIpfsCid) external view returns (bool isApproved) {
        // Check for empty input
        if (toolIpfsCid.length == 0) {
            revert EmptyToolIpfsCid();
        }

        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();
        bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));
        return ts_.approvedIpfsCidHashes.contains(hashedIpfsCid);
    }

    /**
     * @notice Get the current approved tools manager
     * @return manager The address of the current approved tools manager
     */
    function getApprovedToolsManager() external view returns (address manager) {
        return VincentToolStorage.toolStorage().approvedToolsManager;
    }
}
