// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import "../LibVincentDiamondStorage.sol";

contract VincentToolViewFacet {
    using VincentToolStorage for VincentToolStorage.ToolStorage;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    function getToolIpfsCidByHash(bytes32 toolIpfsCidHash) external view returns (string memory) {
        return VincentToolStorage.toolStorage().toolIpfsCidHashToIpfsCid[toolIpfsCidHash];
    }

    function getAllRegisteredTools() external view returns (string[] memory toolIpfsCids) {
        VincentToolStorage.ToolStorage storage ts_ = VincentToolStorage.toolStorage();

        uint256 toolCount = ts_.registeredTools.length();
        toolIpfsCids = new string[](toolCount);
        for (uint256 i = 0; i < toolCount; i++) {
            toolIpfsCids[i] = ts_.toolIpfsCidHashToIpfsCid[ts_.registeredTools.at(i)];
        }
    }
}
