// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./VincentTypes.sol";

contract VincentAgentRegistry {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.UintSet;

    EnumerableSet.UintSet private agentPkps;
    mapping(uint256 => VincentTypes.AgentPkp) private agents;
}