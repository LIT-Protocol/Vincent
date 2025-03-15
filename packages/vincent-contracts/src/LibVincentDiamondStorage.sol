// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./diamond-base/libraries/LibDiamond.sol";
import "./IPKPNftFacet.sol";

library VincentAppStorage {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 internal constant APP_STORAGE_SLOT = keccak256("lit.vincent.app.storage");

    struct VersionedApp {
        EnumerableSet.Bytes32Set toolIpfsCidHashes;
        EnumerableSet.UintSet delegatedAgentPkps;
        // Tool IPFS CID Hash => Policy IPFS CID Hashes
        mapping(bytes32 => EnumerableSet.Bytes32Set) toolIpfsCidHashToPolicyIpfsCidHashes;
        // Policy IPFS CID Hash => Policy Parameter Name Hashes
        mapping(bytes32 => EnumerableSet.Bytes32Set) policyIpfsCidHashToParameterNameHashes;
        uint256 version;
        bool enabled;
    }

    struct App {
        EnumerableSet.AddressSet delegatees;
        EnumerableSet.Bytes32Set authorizedRedirectUris;
        VersionedApp[] versionedApps;
        address manager;
        string name;
        string description;
    }

    struct AppStorage {
        mapping(uint256 => App) appIdToApp;
        mapping(address => EnumerableSet.UintSet) managerAddressToAppIds;
        mapping(address => uint256) delegateeAddressToAppId;
        mapping(bytes32 => string) authorizedRedirectUriHashToRedirectUri;
        uint256 appIdCounter;
    }

    function appStorage() internal pure returns (AppStorage storage as_) {
        bytes32 slot = APP_STORAGE_SLOT;
        assembly {
            as_.slot := slot
        }
    }
}

library VincentToolStorage {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    bytes32 internal constant TOOL_STORAGE_SLOT = keccak256("lit.vincent.tool.storage");

    struct ToolStorage {
        EnumerableSet.Bytes32Set registeredTools;
        // Tool IPFS CID Hash => Tool IPFS CID
        mapping(bytes32 => string) toolIpfsCidHashToIpfsCid;
        // Policy IPFS CID Hash => Policy IPFS CID
        mapping(bytes32 => string) policyIpfsCidHashToIpfsCid;
        // Policy Parameter Name Hash => Policy Parameter Name
        mapping(bytes32 => string) policyParameterNameHashToName;
    }

    function toolStorage() internal pure returns (ToolStorage storage ts) {
        bytes32 slot = TOOL_STORAGE_SLOT;
        assembly {
            ts.slot := slot
        }
    }
}

library VincentUserStorage {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    bytes32 internal constant USER_STORAGE_SLOT = keccak256("lit.vincent.user.storage");

    struct PolicyParametersStorage {
        // Not every Policy parameter may be required, so we keep track
        // of the ones the User has set
        EnumerableSet.Bytes32Set policyParameterNameHashes;
        // Policy Parameter Name Hash -> Policy Parameter Value
        mapping(bytes32 => string) policyParameterNameHashToValue;
    }

    struct ToolPolicyStorage {
        // Tool Policy CID Hash -> Policy Parameters Storage
        mapping(bytes32 => PolicyParametersStorage) policyIpfsCidHashToPolicyParametersStorage;
        // Set of Policy IPFS CID Hashes that have parameters set
        EnumerableSet.Bytes32Set policyIpfsCidHashesWithParameters;
    }

    struct AgentStorage {
        // Set of App IDs that have a permitted version
        EnumerableSet.UintSet permittedApps;
        // App ID -> Permitted App Version
        mapping(uint256 => uint256) permittedAppVersion;
        // App ID -> Tool IPFS CID Hash -> Tool Policy Storage
        mapping(uint256 => mapping(bytes32 => ToolPolicyStorage)) toolPolicyStorage;
    }

    struct UserStorage {
        // User PKP ETH address => registered Agent PKP token IDs
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
