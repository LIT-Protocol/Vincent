import { ethers } from "ethers";

const providerURL = "yellowstone-rpc.litprotocol.com";

export const VINCENT_APP_REGISTRY_ADDRESS = "0x05a2DD011b2A9cE27322F037F7031AC402a63060";

export const VINCENT_APP_REGISTRY_ABI = [
    // App Management Functions
    'function registerApp() external returns (uint256 appId)',
    'function enableApp(uint256 appId) external',
    'function disableApp(uint256 appId) external',
    'function getApp(uint256 appId) external view returns (tuple(address manager, bool enabled, uint256[] roleIds))',
    'function getRegisteredAppManagers() external view returns (address[])',
    'function getRegisteredApps() external view returns (uint256[])',
    'function getAppManager(uint256 appId) external view returns (address)',
    'function isAppManager(uint256 appId, address manager) external view returns (bool)',
    'function isAppEnabled(uint256 appId) external view returns (bool)',
  
    // Delegatee Functions  
    'function addDelegatee(uint256 appId, address delegatee) external',
    'function removeDelegatee(uint256 appId, address delegatee) external',
    'function getAppDelegatees(uint256 appId) external view returns (address[])',
    'function getAppManagerForDelegatee(uint256 appId, address delegatee) external view returns (address)',
    'function isDelegateeForApp(uint256 appId, address delegatee) external view returns (bool)',
  
    // Role Functions
    'function registerRole(uint256 appId, string calldata name, string calldata description, string[] calldata toolIpfsCids, string[][] calldata parameterNames) external returns (uint256 roleId)',
    'function updateRole(uint256 appId, uint256 roleId, string calldata name, string calldata description, string[] calldata toolIpfsCids, string[][] calldata parameterNames) external',
    'function enableRole(uint256 appId, uint256 roleId) external',
    'function disableRole(uint256 appId, uint256 roleId) external',
    'function enableRoleTool(uint256 appId, uint256 roleId, uint256 roleVersion, string calldata toolIpfsCid) external',
    'function disableRoleTool(uint256 appId, uint256 roleId, uint256 roleVersion, string calldata toolIpfsCid) external',
    'function getActiveRoleVersion(uint256 appId, uint256 roleId) external view returns (uint256)',
    'function getRoleDetails(uint256 appId, uint256 roleId, uint256 version) external view returns (string memory name, string memory description, bool enabled, bytes32[] memory toolIpfsCidHashes)',
  
    // Tool Functions
    'function getUnhashedToolCid(bytes32 hashedCid) external view returns (string memory)',
    'function getUnhashedParameterName(bytes32 hashedName) external view returns (string memory)',
    'function getToolDetails(uint256 appId, uint256 roleId, uint256 roleVersion, bytes32 toolIpfsCidHash) public view returns (bool enabled, bytes32[] memory parameterNameHashes)',
    'function getToolDetails(uint256 appId, uint256 roleId, uint256 roleVersion, string calldata toolIpfsCid) external view returns (bool enabled, bytes32[] memory parameterNameHashes)',
    'function isToolInRole(uint256 appId, uint256 roleId, uint256 roleVersion, bytes32 toolIpfsCidHash) public view returns (bool exists, bool enabled)',
    'function isToolInRole(uint256 appId, uint256 roleId, uint256 roleVersion, string calldata toolIpfsCid) external view returns (bool exists, bool enabled)',
    'function isToolEnabled(uint256 appId, uint256 roleId, uint256 roleVersion, bytes32 toolIpfsCidHash) public view returns (bool)',
    'function isToolEnabled(uint256 appId, uint256 roleId, uint256 roleVersion, string calldata toolIpfsCid) external view returns (bool)',
    'function isParameterNameForTool(uint256 appId, uint256 roleId, uint256 roleVersion, bytes32 toolIpfsCidHash, bytes32 parameterNameHash) public view returns (bool)',
    'function isParameterNameForTool(uint256 appId, uint256 roleId, uint256 roleVersion, string calldata toolIpfsCid, string calldata parameterName) external view returns (bool)',
  
    // Events
    'event ManagerRegistered(address indexed manager)',
    'event AppRegistered(uint256 indexed appId, address indexed manager)',
    'event AppEnabled(uint256 indexed appId)',
    'event AppDisabled(uint256 indexed appId)',
    'event RoleRegistered(uint256 indexed appId, uint256 indexed roleId, uint256 version)',
    'event RoleUpdated(uint256 indexed appId, uint256 indexed roleId, uint256 version)',
    'event RoleToolEnabled(uint256 indexed appId, uint256 indexed roleId, uint256 roleVersion, bytes32 indexed toolIpfsCidHash)',
    'event RoleToolDisabled(uint256 indexed appId, uint256 indexed roleId, uint256 roleVersion, bytes32 indexed toolIpfsCidHash)',
  
    // Errors
    'error NotAppManager(uint256 appId)',
    'error AppNotRegistered(uint256 appId)',
    'error InvalidDelegatee(address delegatee)',
    'error ToolArraysLengthMismatch()',
    'error ToolParameterLengthMismatch(uint256 toolIndex)',
    'error RoleNotRegistered(uint256 appId, uint256 roleId)',
    'error ToolNotFoundForRole(uint256 appId, uint256 roleId, uint256 roleVersion, string toolIpfsCid)',
    'error RoleVersionNotFound(uint256 appId, uint256 roleId, uint256 version)',
    'error ToolIpfsCidUnknown(string toolIpfsCid)',
    'error ToolParameterUnknown(string parameterName)'
  ];

export const getProviderOrSigner = async (isSigner = false) => {
    const provider = new ethers.providers.JsonRpcProvider(providerURL);
    const contract = new ethers.Contract(VINCENT_APP_REGISTRY_ADDRESS, VINCENT_APP_REGISTRY_ABI, provider);
    if (isSigner) {
        const signer = provider.getSigner();
        const contractWithSigner = contract.connect(signer);
        return contractWithSigner;
    }
    return contract;
};
