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

    /**
     * @notice Enum representing all supported Solidity parameter types
     */
    enum ParameterType {
        INT256,
        INT256_ARRAY,
        UINT256,
        UINT256_ARRAY,
        BOOL,
        BOOL_ARRAY,
        ADDRESS,
        ADDRESS_ARRAY,
        STRING,
        STRING_ARRAY,
        BYTES,
        BYTES_ARRAY
    }

    /**
     * @notice Policy data structure storing parameter names and types
     * @dev Renamed from PolicyStorage to Policy for clarity
     */
    struct Policy {
        EnumerableSet.Bytes32Set policyParameterNameHashes;
        // Policy Parameter Name Hash => Policy Parameter Type
        mapping(bytes32 => ParameterType) policyParameterNameHashToType;
    }

    /**
     * @notice Structure grouping policies for a specific tool
     * @dev Combines the previous separate mappings into a single logical structure
     */
    struct ToolPolicies {
        EnumerableSet.Bytes32Set policyIpfsCidHashes; // Set of policy IDs for this tool
        mapping(bytes32 => Policy) policyIpfsCidHashToPolicy; // Maps each policy ID to its data
    }

    struct VersionedApp {
        EnumerableSet.Bytes32Set toolIpfsCidHashes;
        EnumerableSet.UintSet delegatedAgentPkps;
        // Tool IPFS CID Hash => Tool Policies (contains both policy IDs and their data)
        mapping(bytes32 => ToolPolicies) toolIpfsCidHashToToolPolicies;
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

library VincentLitActionStorage {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    bytes32 internal constant LITACTION_STORAGE_SLOT = keccak256("lit.vincent.litaction.storage");

    struct LitActionStorage {
        // A list of approved/reviewed Lit Action IPFS CID Hashes
        EnumerableSet.Bytes32Set approvedIpfsCidHashes;
        // Policy Parameter Name Hash => Policy Parameter Name
        mapping(bytes32 => string) policyParameterNameHashToName;
        // Lit Action IPFS CID Hash => IPFS CID
        mapping(bytes32 => string) ipfsCidHashToIpfsCid;
        // Address of the manager who can add/remove Lit Actions from the approved list
        address approvedLitActionsManager;
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

    struct PolicyParametersStorage {
        // Not every Policy parameter may be required, so we keep track
        // of the ones the User has set
        EnumerableSet.Bytes32Set policyParameterNameHashes;
        // Policy Parameter Name Hash -> Policy Parameter Value
        mapping(bytes32 => bytes) policyParameterNameHashToValue;
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
