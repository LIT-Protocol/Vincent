// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./diamond-base/libraries/LibDiamond.sol";
import "./IPKPNftFacet.sol";

library VincentAppStorage {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    bytes32 internal constant APP_STORAGE_SLOT = keccak256("lit.vincent.app.storage");

    struct AppVersion {
        EnumerableSet.Bytes32Set toolIpfsCidHashes;
        // EnumerableSet instead of an array since the App needs to know all the delegated Agents
        EnumerableSet.UintSet delegatedAgentPkps;
        // Tool IPFS CID hash => Tool Policy IPFS CID hashes
        mapping(bytes32 => EnumerableSet.Bytes32Set) toolIpfsCidHashToToolPolicyIpfsCidHashes;
        bool enabled;
    }

    struct App {
        EnumerableSet.AddressSet delegatees;
        AppVersion[] appVersions;
        address manager;
        bool isDeleted;
    }

    struct AppStorage {
        mapping(uint256 => App) appIdToApp;
        mapping(address => EnumerableSet.UintSet) managerAddressToAppIds;
        mapping(address => uint256) delegateeAddressToAppId;
    }

    function appStorage() internal pure returns (AppStorage storage as_) {
        bytes32 slot = APP_STORAGE_SLOT;
        assembly {
            as_.slot := slot
        }
    }
}

library VincentLitActionStorage {
    using EnumerableSet for EnumerableSet.Bytes32Set;

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

    bytes32 internal constant USER_STORAGE_SLOT = keccak256("lit.vincent.user.storage");

    struct AgentStorage {
        // Set of App IDs that have a permitted version
        EnumerableSet.UintSet permittedApps;
        // App ID -> Permitted App Version
        mapping(uint256 => uint256) permittedAppVersion;
        // App ID -> App version -> Tool IPFS CID hash -> Tool Policy storage -> Tool Policy IPFS CID hash -> User's CBOR2 encoded Policy parameter values
        mapping(uint256 => mapping(uint256 => mapping(bytes32 => mapping(bytes32 => bytes)))) toolPolicyParameterValues;
    }

    struct UserStorage {
        // EnumerableSet instead of an array because we register the Agent PKP during the first App registration so we need to check for duplicates.
        // User PKP ETH address => Registered Agent PKP token IDs
        mapping(address => EnumerableSet.UintSet) userAddressToRegisteredAgentPkps;
        // PKP Token ID -> Agent Storage
        mapping(uint256 => AgentStorage) agentPkpTokenIdToAgentStorage;
        // PKP NFT contract interface - set once during initialization in the diamond constructor
        IPKPNFTFacet PKP_NFT_FACET;
    }

    function userStorage() internal pure returns (UserStorage storage us) {
        bytes32 slot = USER_STORAGE_SLOT;
        assembly {
            us.slot := slot
        }
    }
}
