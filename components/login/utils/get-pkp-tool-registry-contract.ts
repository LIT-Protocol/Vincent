// import { ethers } from 'ethers';
// import { LIT_RPC } from "@lit-protocol/constants"

// /**
//  * Creates an instance of the PKP Tool Registry contract.
//  * This function initializes a contract instance with the core functions needed for
//  * delegatee verification and policy management within Lit Actions.
//  * 
//  * @param pkpToolRegistryAddress - The Ethereum address of the PKP Tool Registry contract.
//  * @returns A promise that resolves to an ethers Contract instance connected to the PKP Tool Registry.
//  */

// const REGISTRY_ADDRESSES = {
//     'datil-dev': '0x2707eabb60D262024F8738455811a338B0ECd3EC',
//     'datil-test': '0x525bF2bEb622D7C05E979a8b3fFcDBBEF944450E',
//     'datil': '0xBDEd44A02b64416C831A0D82a630488A854ab4b1',
//   } as const;

// export const getPkpToolRegistryContract = async (
//     litNetwork: keyof typeof REGISTRY_ADDRESSES
//   ) => {
//     // Create contract instance
//     const PKP_TOOL_REGISTRY_ABI = [
//       // Tool Facet Functions
//       'function registerTools(uint256 pkpTokenId, string[] calldata toolIpfsCids, bool enabled) external',
//       'function removeTools(uint256 pkpTokenId, string[] calldata toolIpfsCids) external',
  
//       'function enableTools(uint256 pkpTokenId, string[] calldata toolIpfsCids) external',
//       'function disableTools(uint256 pkpTokenId, string[] calldata toolIpfsCids) external',
  
//       'function permitToolsForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external',
//       'function unpermitToolsForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external',
  
//       'function getRegisteredTools(uint256 pkpTokenId, string[] calldata toolIpfsCids) external view returns (tuple(string toolIpfsCid, bool toolEnabled)[] memory toolsInfo)',
//       'function getAllRegisteredTools(uint256 pkpTokenId) external view returns (tuple(string toolIpfsCid, bool toolEnabled)[] memory toolsInfo)',
//       'function getRegisteredToolsAndDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids) external view returns (tuple(string toolIpfsCid, bool toolEnabled, address[] delegatees, string[] delegateesPolicyIpfsCids, bool[] delegateesPolicyEnabled) memory toolInfo)',
//       'function getAllRegisteredToolsAndDelegatees(uint256 pkpTokenId) external view returns (tuple(string toolIpfsCid, bool toolEnabled, address[] delegatees, string[] delegateesPolicyIpfsCids, bool[] delegateesPolicyEnabled)[] memory toolsInfo)',
//       'function getToolsWithPolicy(uint256 pkpTokenId) external view returns (tuple(string toolIpfsCid, bool toolEnabled, address[] delegatees, string[] delegateesPolicyIpfsCids, bool[] delegateesPolicyEnabled)[] memory toolsInfo)',
//       'function getToolsWithoutPolicy(uint256 pkpTokenId) external view returns (tuple(string toolIpfsCid, bool toolEnabled, address[] delegatees)[] memory toolsWithoutPolicy)',
  
//       'function isToolRegistered(uint256 pkpTokenId, string calldata toolIpfsCid) external view returns (bool isRegistered, bool isEnabled)',
//       'function isToolPermittedForDelegatee(uint256 pkpTokenId, string calldata toolIpfsCid, address delegatee) external view returns (bool isPermitted, bool isEnabled)',
//       'function getPermittedToolsForDelegatee(uint256 pkpTokenId, address delegatee) external view returns (tuple(string toolIpfsCid, bool toolEnabled, address delegatee, string policyIpfsCid, bool policyEnabled)[] memory permittedTools)',
  
//       // Delegatee Facet Functions
//       'function addDelegatees(uint256 pkpTokenId, address[] calldata delegatees) external',
//       'function removeDelegatees(uint256 pkpTokenId, address[] calldata delegatees) external',
//       'function getDelegatees(uint256 pkpTokenId) external view returns (address[] memory)',
//       'function getDelegatedPkps(address delegatee) external view returns (uint256[] memory)',
//       'function isPkpDelegatee(uint256 pkpTokenId, address delegatee) external view returns (bool)',
  
//       // Policy Facet Functions
//       'function getToolPoliciesForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external view returns (tuple(string toolIpfsCid, string policyIpfsCid, address delegatee, bool enabled)[] memory toolPolicies)',
//       'function setToolPoliciesForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees, string[] calldata policyIpfsCids, bool enablePolicies) external',
//       'function removeToolPoliciesForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external',
//       'function enableToolPoliciesForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external',
//       'function disableToolPoliciesForDelegatees(uint256 pkpTokenId, string[] calldata toolIpfsCids, address[] calldata delegatees) external',
  
//       // Policy Parameter Facet Functions
//       'function getToolPolicyParameters(uint256 pkpTokenId, string calldata toolIpfsCid, address delegatee, string[] calldata parameterNames) external view returns (tuple(string name, bytes value)[] memory parameters)',
//       'function getAllToolPolicyParameters(uint256 pkpTokenId, string calldata toolIpfsCid, address delegatee) external view returns (tuple(string name, bytes value)[] memory parameters)',
//       'function setToolPolicyParametersForDelegatee(uint256 pkpTokenId, string calldata toolIpfsCid, address delegatee, string[] calldata parameterNames, bytes[] calldata parameterValues) external',
//       'function removeToolPolicyParametersForDelegatee(uint256 pkpTokenId, string calldata toolIpfsCid, address delegatee, string[] calldata parameterNames) external',
  
//       // Error Signatures
//       'error InvalidDelegatee()',
//       'error EmptyDelegatees()',
//       'error DelegateeAlreadyExists(uint256 pkpTokenId, address delegatee)',
//       'error DelegateeNotFound(uint256 pkpTokenId, address delegatee)',
//       'error EmptyIPFSCID()',
//       'error ToolNotFound(string toolIpfsCid)',
//       'error ToolAlreadyRegistered(string toolIpfsCid)',
//       'error ArrayLengthMismatch()',
//       'error InvalidPolicyParameters()',
//       'error PolicyParameterAlreadySet(string parameterName)',
//       'error InvalidPolicyValue()',
//       'error NoPolicySet(uint256 pkpTokenId, string toolIpfsCid, address delegatee)',
//       'error PolicyAlreadySet(uint256 pkpTokenId, string toolIpfsCid, address delegatee)',
//       'error PolicySameEnabledState(uint256 pkpTokenId, string toolIpfsCid, address delegatee)',
//       'error EmptyPolicyIPFSCID()',
//       'error NotPKPOwner()',
  
//       // Events
//       'event ToolsRegistered(uint256 indexed pkpTokenId, bool enabled, string[] toolIpfsCids)',
//       'event ToolsRemoved(uint256 indexed pkpTokenId, string[] toolIpfsCids)',
//       'event ToolsEnabled(uint256 indexed pkpTokenId, string[] toolIpfsCids)',
//       'event ToolsDisabled(uint256 indexed pkpTokenId, string[] toolIpfsCids)',
//       'event ToolsPermitted(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees)',
//       'event AddedDelegatees(uint256 indexed pkpTokenId, address[] delegatees)',
//       'event RemovedDelegatees(uint256 indexed pkpTokenId, address[] delegatees)',
//       'event ToolPoliciesSet(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees, string[] policyIpfsCids)',
//       'event ToolPoliciesRemoved(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees)',
//       'event PoliciesEnabled(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees)',
//       'event PoliciesDisabled(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees)',
//       'event PolicyParametersSet(uint256 indexed pkpTokenId, string toolIpfsCids, address delegatee, string[] parameterNames, bytes[] parameterValues)',
//       'event PolicyParametersRemoved(uint256 indexed pkpTokenId, string toolIpfsCids, address delegatee, string[] parameterNames)',
//       'event ToolsUnpermitted(uint256 indexed pkpTokenId, string[] toolIpfsCids, address[] delegatees)',
//     ];
//     return new ethers.Contract(
//       REGISTRY_ADDRESSES[litNetwork],
//       PKP_TOOL_REGISTRY_ABI,
//       new ethers.providers.JsonRpcProvider(
//         LIT_RPC.CHRONICLE_YELLOWSTONE
//       )
//     );
//   };
  