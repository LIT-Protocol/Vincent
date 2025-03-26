// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";

contract VincentLitActionViewFacet {
    using VincentLitActionStorage for VincentLitActionStorage.LitActionStorage;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /**
     * @notice Thrown when a Lit Action hash does not exist
     * @param litActionIpfsCidHash The hash of the Lit Action's IPFS CID that doesn't exist
     */
    error LitActionHashNotFound(bytes32 litActionIpfsCidHash);

    /**
     * @notice Thrown when an empty Lit Action IPFS CID is provided
     */
    error EmptyLitActionIpfsCid();

    /**
     * @notice Thrown when no Lit Actions are registered in the system
     */
    error NoLitActionsRegistered();

    /**
     * @notice Thrown when no Lit Actions are approved in the system
     */
    error NoLitActionsApproved();

    /**
     * @notice Retrieves a Lit Action's IPFS CID from its hash
     * @param litActionIpfsCidHash The hash of the Lit Action's IPFS CID
     * @return The Lit Action's IPFS CID
     */
    function getLitActionIpfsCidByHash(bytes32 litActionIpfsCidHash) external view returns (string memory) {
        string memory litActionIpfsCid =
            VincentLitActionStorage.litActionStorage().ipfsCidHashToIpfsCid[litActionIpfsCidHash];

        // Check if the Lit Action exists
        if (bytes(litActionIpfsCid).length == 0) {
            revert LitActionHashNotFound(litActionIpfsCidHash);
        }

        return litActionIpfsCid;
    }

    /**
     * @notice Get all approved Lit Actions
     * @return litActionIpfsCids Array of approved Lit Action IPFS CIDs
     */
    function getAllApprovedLitActions() external view returns (string[] memory litActionIpfsCids) {
        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();

        uint256 litActionCount = ls_.approvedIpfsCidHashes.length();

        // Check if there are any approved Lit Actions
        if (litActionCount == 0) {
            revert NoLitActionsApproved();
        }

        litActionIpfsCids = new string[](litActionCount);
        for (uint256 i = 0; i < litActionCount; i++) {
            bytes32 hashedIpfsCid = ls_.approvedIpfsCidHashes.at(i);
            litActionIpfsCids[i] = ls_.ipfsCidHashToIpfsCid[hashedIpfsCid];
        }
    }

    /**
     * @notice Check if a Lit Action is approved
     * @param litActionIpfsCid The IPFS CID of the Lit Action to check
     * @return isApproved Whether the Lit Action is approved
     */
    function isLitActionApproved(string calldata litActionIpfsCid) external view returns (bool isApproved) {
        // Check for empty input
        if (bytes(litActionIpfsCid).length == 0) {
            revert EmptyLitActionIpfsCid();
        }

        VincentLitActionStorage.LitActionStorage storage ls_ = VincentLitActionStorage.litActionStorage();
        bytes32 hashedIpfsCid = keccak256(abi.encodePacked(litActionIpfsCid));
        return ls_.approvedIpfsCidHashes.contains(hashedIpfsCid);
    }

    /**
     * @notice Get the current approved Lit Actions manager
     * @return manager The address of the current approved Lit Actions manager
     */
    function getApprovedLitActionsManager() external view returns (address manager) {
        return VincentLitActionStorage.litActionStorage().approvedLitActionsManager;
    }
}
