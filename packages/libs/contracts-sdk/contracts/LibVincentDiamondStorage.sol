// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./diamond-base/libraries/LibDiamond.sol";

library VincentAppStorage {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    bytes32 internal constant APP_STORAGE_SLOT = keccak256("lit.vincent.app.storage");

    struct AppVersion {
        EnumerableSet.Bytes32Set abilityIpfsCidHashes;
        // EnumerableSet instead of an array since the App needs to know all the delegated Agents
        EnumerableSet.AddressSet delegatedAgentAddresses;
        // Ability IPFS CID hash => Ability Policy IPFS CID hashes
        mapping(bytes32 => EnumerableSet.Bytes32Set) abilityIpfsCidHashToAbilityPolicyIpfsCidHashes;
        bool enabled;
    }

    struct App {
        EnumerableSet.AddressSet delegatees;
        AppVersion[] appVersions;
        address manager;
        bool isDeleted;
    }

    struct AppStorage {
        mapping(uint40 => App) appIdToApp; // Since we're using numbers upto 10B on the Registry to create appId without requiring BitInt in JS
        mapping(address => EnumerableSet.UintSet) managerAddressToAppIds;
        mapping(address => uint40) delegateeAddressToAppId;
    }

    function appStorage() internal pure returns (AppStorage storage as_) {
        bytes32 slot = APP_STORAGE_SLOT;
        assembly {
            as_.slot := slot
        }
    }
}

library VincentLitActionStorage {
    bytes32 internal constant LITACTION_STORAGE_SLOT = keccak256("lit.vincent.litaction.storage");

    struct LitActionStorage {
        // Lit Action IPFS CID hash => IPFS CID
        mapping(bytes32 => string) ipfsCidHashToIpfsCid;
    }

    function litActionStorage() internal pure returns (LitActionStorage storage ls) {
        bytes32 slot = LITACTION_STORAGE_SLOT;
        assembly {
            ls.slot := slot
        }
    }
}

library VincentUserStorage {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 internal constant USER_STORAGE_SLOT = keccak256("lit.vincent.user.storage");

    struct AgentStorage {
        address pkpSigner;
        uint256 pkpSignerPubKey;
        uint40 permittedAppId;
        uint24 permittedAppVersion;
        uint40 lastPermittedAppId;
        uint24 lastPermittedAppVersion;
        address lastPermittedPkpSigner;
        uint256 lastPermittedPkpSignerPubKey;
        // App version -> Ability IPFS CID hash -> Ability Policy IPFS CID hash -> User's CBOR2 encoded Policy parameter values
        mapping(uint24 => mapping(bytes32 => mapping(bytes32 => bytes))) abilityPolicyParameterValues;
    }

    struct UserStorage {
        // User Address => Registered Agent Addresses
        mapping(address => EnumerableSet.AddressSet) userAddressToRegisteredAgentAddresses;
        // Agent Address -> Agent Storage
        mapping(address => AgentStorage) agentAddressToAgentStorage;
    }

    function userStorage() internal pure returns (UserStorage storage us) {
        bytes32 slot = USER_STORAGE_SLOT;
        assembly {
            us.slot := slot
        }
    }
}
