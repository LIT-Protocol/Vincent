// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

library VincentTypes {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.UintSet;

    struct ToolPolicy {
        bool enabled;
        string ipfsCid;
        EnumerableSet.Bytes32Set policyParams;
        mapping(bytes32 => bytes) policyValues;
    }

    struct App {
        bool enabled;
        EnumerableSet.Bytes32Set roleIds;
        mapping(bytes32 => string) roleVersions;
        EnumerableSet.Bytes32Set toolIds;
        mapping(bytes32 => ToolPolicy) toolPolicies;
    }

    struct AgentPkp {
        EnumerableSet.AddressSet appAddresses;
        mapping(address => App) apps;
    }
} 