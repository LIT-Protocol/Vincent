// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

library VincentTypes {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.UintSet;

    struct Tool {
        bool enabled;
        // Set of parameter names (stored as keccak256 hashes)
        EnumerableSet.Bytes32Set parameterNameHashes;
    }

    struct Role {
        uint256 version;
        bool enabled;
        string name;
        string description;
        EnumerableSet.Bytes32Set toolIpfsCidHashes;
        mapping(bytes32 => Tool) toolIpfsCidHashToTool;
    }

    /**
     * Structs containing mappings cannot be used as return types,
     * so we use this struct to return a view of the app.
     */
    struct AppView {
        address manager;
        bool enabled;
        uint256[] roleIds;
    }

    struct App {
        address manager;
        bool enabled;
        EnumerableSet.UintSet roleIds;
        // Role ID to Active Role Version
        mapping(uint256 => uint256) activeRoleVersions;
        // Role ID to Role Version to Role
        mapping(uint256 => mapping(uint256 => Role)) versionedRoles;
    }
}
