// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";

contract VincentToolFacet {
    using VincentToolStorage for VincentToolStorage.ToolStorage;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    event NewToolRegistered(bytes32 indexed toolIpfsCidHash);

    function registerTool(string calldata toolIpfsCid) public {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        bytes32 hashedIpfsCid = keccak256(abi.encodePacked(toolIpfsCid));

        if (!ts_.registeredTools.contains(hashedIpfsCid)) {
            ts_.registeredTools.add(hashedIpfsCid);
            ts_.toolIpfsCidHashToIpfsCid[hashedIpfsCid] = toolIpfsCid;
            emit NewToolRegistered(hashedIpfsCid);
        }
    }

    function registerTools(string[] calldata toolIpfsCids) external {
        for (uint256 i = 0; i < toolIpfsCids.length; i++) {
            registerTool(toolIpfsCids[i]);
        }
    }
}
