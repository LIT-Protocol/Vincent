import { ethers } from "ethers";

const providerURL = "https://yellowstone-rpc.litprotocol.com";

export const VINCENT_APP_REGISTRY_ADDRESS =
    "0xD4383c15158B11a4Fa51F489ABCB3D4E43511b0a";

export const VINCENT_APP_REGISTRY_ABI = [
    "constructor(address pkpNftFacet)",

    "function addDelegatee(address delegatee) external",
    "function removeDelegatee(address delegatee) external",

    "function isDelegatee(address appManager, address delegatee) external view returns (bool)",
    "function getDelegatees(address appManager) external view returns (address[] memory)",
    "function getAppManagerByDelegatee(address delegatee) external view returns (address)",

    "function PKP_NFT_FACET() external view returns (address)",

    "event DelegateeAdded(address indexed appManager, address indexed delegatee)",
    "event DelegateeRemoved(address indexed appManager, address indexed delegatee)",
    "event AppPermitted(address indexed appManager, uint256 indexed agentPkpTokenId)",
    "event AppUnpermitted(address indexed appManager, uint256 indexed agentPkpTokenId)",
];

export const VINCENT_USER_REGISTRY_ADDRESS =
    "0x03250ce6245ea69Cd70557F206923A49003771b9";

export const VINCENT_USER_REGISTRY_ABI = [
    "constructor(address pkpContract_, address appDelegationRegistry_)",

    "function addRole(uint256 agentPkpTokenId, address appManager, bytes32 roleId, string calldata roleVersion, string[] calldata toolIpfsCids, string[][] calldata policyParamNames, bytes[][] calldata policyValues) external",

    "function setAppEnabled(uint256 agentPkpTokenId, address appManager, bool enabled) external",

    "function setToolsEnabled(uint256 agentPkpTokenId, address appManager, string[] calldata toolIpfsCids, bool enabled) external",
    "function updateToolPolicyValue(uint256 agentPkpTokenId, address appManager, string calldata toolIpfsCid, bytes32 paramId, bytes calldata value) external",

    "function hasAgentPkp(uint256 agentPkpTokenId) external view returns (bool)",
    "function getAllAgentPkps() external view returns (uint256[] memory)",

    "function isAppPermittedForAgentPkp(address appManager, uint256 agentPkpTokenId) external view returns (bool)",
    "function getPermittedAgentPkpsForApp(address appManager) external view returns (uint256[] memory)",

    "function getAppsPermittedForAgentPkp(uint256 agentPkpTokenId) external view returns (address[] memory)",
    "function isAppEnabled(uint256 agentPkpTokenId, address appManager) external view returns (bool)",
    "function getAppByDelegateeForAgentPkp(address delegatee, uint256 agentPkpTokenId) external view returns (address appManager, bool isEnabled, string[] memory toolIpfsCids, bool[] memory toolEnabled, string[][] memory policyParamNames, bytes[][] memory policyValues)",

    "function getRolesPermittedForApp(uint256 agentPkpTokenId, address appManager) external view returns (bytes32[] memory)",
    "function hasRole(uint256 agentPkpTokenId, address appManager, bytes32 roleId) external view returns (bool)",
    "function getRoleVersion(uint256 agentPkpTokenId, address appManager, bytes32 roleId) external view returns (string memory)",
    "function getRolesWithVersions(uint256 agentPkpTokenId, address appManager) external view returns (bytes32[] memory roleIds, string[] memory versions)",

    "function getToolsPermittedForApp(uint256 agentPkpTokenId, address appManager) external view returns (bytes32[] memory)",
    "function hasTool(uint256 agentPkpTokenId, address appManager, bytes32 toolId) external view returns (bool)",
    "function isToolEnabled(uint256 agentPkpTokenId, address appManager, bytes32 toolId) external view returns (bool)",
    "function getToolIpfsCid(uint256 agentPkpTokenId, address appManager, bytes32 toolId) external view returns (string memory)",
    "function getToolsWithIpfsCids(uint256 agentPkpTokenId, address appManager) external view returns (bytes32[] memory toolIds, string[] memory ipfsCids)",

    "function getPolicyParamsForTool(uint256 agentPkpTokenId, address appManager, string calldata toolIpfsCid) external view returns (bytes32[] memory)",
    "function getPolicyValue(uint256 agentPkpTokenId, address appManager, bytes32 toolId, bytes32 paramId) external view returns (bytes memory)",
    "function getPolicyParamsWithValues(uint256 agentPkpTokenId, address appManager, string calldata toolIpfsCid) external view returns (bytes32[] memory paramIds, bytes[] memory values)",

    "function getToolId(string calldata toolIpfsCid) external pure returns (bytes32)",
    "function getPolicyParamName(bytes32 paramId) external view returns (string memory)",
    "function getToolIpfsCidByHash(bytes32 toolId) external view returns (string memory)",

    "event AppAdded(uint256 indexed agentPkpTokenId, address indexed appManager, bool enabled)",
    "event AppEnabled(uint256 indexed agentPkpTokenId, address indexed appManager, bool enabled)",
    "event RoleAdded(uint256 indexed agentPkpTokenId, address indexed appManager, bytes32 indexed roleId, string version)",
    "event ToolPolicyAdded(uint256 indexed agentPkpTokenId, address indexed appManager, bytes32 indexed toolId, string ipfsCid)",
    "event ToolEnabled(uint256 indexed agentPkpTokenId, address indexed appManager, bytes32 indexed toolId, bool enabled)",
    "event PolicyValueSet(uint256 indexed agentPkpTokenId, address indexed appManager, bytes32 indexed toolId, bytes32 paramId, bytes value)",

    "function PKP_NFT_FACET() external view returns (address)",
    "function appDelegationRegistry() external view returns (address)",
];

export const getProviderOrSignerForAppRegistry = (isSigner = false) => {
    if (isSigner) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        return new ethers.Contract(
            VINCENT_APP_REGISTRY_ADDRESS,
            VINCENT_APP_REGISTRY_ABI,
            signer
        );
    }
    else {
        const provider = new ethers.providers.JsonRpcProvider(providerURL);
        return new ethers.Contract(
            VINCENT_APP_REGISTRY_ADDRESS,
            VINCENT_APP_REGISTRY_ABI,
            provider
        );
    }
};

export const getProviderOrSignerForUserRegistry = (isSigner = false) => {
    if (isSigner) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        return new ethers.Contract(
            VINCENT_APP_REGISTRY_ADDRESS,
            VINCENT_APP_REGISTRY_ABI,
            signer
        );
    }
    else {
        const provider = new ethers.providers.JsonRpcProvider(providerURL);
        return new ethers.Contract(
            VINCENT_APP_REGISTRY_ADDRESS,
            VINCENT_APP_REGISTRY_ABI,
            provider
        );
    }
};
