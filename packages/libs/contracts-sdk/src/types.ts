import type { Overrides } from 'ethers';

import type {
  addDelegatee as _addDelegatee,
  deleteApp as _deleteApp,
  enableAppVersion as _enableAppVersion,
  registerApp as _registerApp,
  registerNextVersion as _registerNextVersion,
  removeDelegatee as _removeDelegatee,
  undeleteApp as _undeleteApp,
} from './internal/app/App';
import type {
  getAppByDelegateeAddress as _getAppByDelegateeAddress,
  getAppById as _getAppById,
  getAppsByManagerAddress as _getAppsByManagerAddress,
  getAppVersion as _getAppVersion,
  getDelegatedPkpEthAddresses as _getDelegatedPkpEthAddresses,
} from './internal/app/AppView';
import type {
  permitApp as _permitApp,
  setToolPolicyParameters as _setToolPolicyParameters,
  unPermitApp as _unPermitApp,
} from './internal/user/User';
import type {
  getAllPermittedAppIdsForPkp as _getAllPermittedAppIdsForPkp,
  getAllRegisteredAgentPkpEthAddresses as _getAllRegisteredAgentPkpEthAddresses,
  getAllToolsAndPoliciesForApp as _getAllToolsAndPoliciesForApp,
  getPermittedAppVersionForPkp as _getPermittedAppVersionForPkp,
  validateToolExecutionAndGetPolicies as _validateToolExecutionAndGetPolicies,
} from './internal/user/UserView';

/**
 * @category Interfaces
 * */
export interface AppVersionTools {
  toolIpfsCids: string[];
  toolPolicies: string[][];
}

/**
 * @category Interfaces
 * */
export interface App {
  id: number;
  isDeleted: boolean;
  manager: string;
  latestVersion: number;
  delegateeAddresses: string[];
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface Tool {
  toolIpfsCid: string;
  policyIpfsCids: string[];
}

/**
 * @category Interfaces
 * */
export interface AppVersion {
  version: number;
  enabled: boolean;
  tools: Tool[];
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface AppWithVersions {
  app: App;
  versions: AppVersion[];
}

/** @category Interfaces
 * */
export interface RegisterAppParams {
  appId: number;
  delegateeAddresses: string[];
  versionTools: AppVersionTools;
}

/**
 * @category Interfaces
 * */
export interface RegisterNextVersionParams {
  appId: number;
  versionTools: AppVersionTools;
}

/**
 * @category Interfaces
 * */
export interface EnableAppVersionParams {
  appId: number;
  appVersion: number;
  enabled: boolean;
}

/**
 * @category Interfaces
 * */
export interface AddDelegateeParams {
  appId: number;
  delegateeAddress: string;
}

/**
 * @category Interfaces
 * */
export interface RemoveDelegateeParams {
  appId: number;
  delegateeAddress: string;
}

/**
 * @category Interfaces
 * */
export interface DeleteAppParams {
  appId: number;
}

/**
 * @category Interfaces
 * */
export interface UndeleteAppParams {
  appId: number;
}

/**
 * @category Interfaces
 * */
export interface GetAppByIdParams {
  appId: number;
}

/**
 * @category Interfaces
 * */
export interface GetAppVersionParams {
  appId: number;
  version: number;
}

/**
 * @category Interfaces
 * */
export interface GetAppsByManagerParams {
  managerAddress: string;
}

/**
 * @category Interfaces
 * */
export interface GetAppByDelegateeParams {
  delegateeAddress: string;
}

/**
 * @category Interfaces
 * */
export interface GetDelegatedPkpEthAddressesParams {
  appId: number;
  version: number;
  pageOpts?: {
    offset?: number;
    limit?: number;
  };
}

/**
 * Represents the decoded parameters for policies associated with a single tool
 * Keys are policy IPFS CIDs, values are policy parameters for the policy
 * @category Interfaces
 */
export interface ToolPolicyParameterData {
  [policyIpfsCid: string]:
    | {
        // TODO: Add stronger type that narrows to only explicitly CBOR2 serializable values?
        [paramName: string]: any;
      }
    | undefined;
}

/**
 * Represents a nested structure of tool and policy parameters
 * Keys are tool IPFS CIDs, values are ToolPolicyParameterData objects
 *
 * @category Interfaces
 */
export interface PermissionData {
  [toolIpfsCid: string]: ToolPolicyParameterData;
}

/**
 * @category Interfaces
 * */
export interface ValidateToolExecutionAndGetPoliciesResult {
  isPermitted: boolean;
  appId: number;
  appVersion: number;
  decodedPolicies: ToolPolicyParameterData;
}

/**
 * @category Interfaces
 * */
export interface PermitAppParams {
  pkpEthAddress: string;
  appId: number;
  appVersion: number;
  permissionData: PermissionData;
}

/**
 * @category Interfaces
 * */
export interface UnPermitAppParams {
  pkpEthAddress: string;
  appId: number;
  appVersion: number;
}

/**
 * @category Interfaces
 * */
export interface SetToolPolicyParametersParams {
  pkpEthAddress: string;
  appId: number;
  appVersion: number;
  policyParams: PermissionData;
}

/**
 * @category Interfaces
 * */
export interface GetAllRegisteredAgentPkpsParams {
  userPkpAddress: string;
}

/**
 * @category Interfaces
 * */
export interface GetPermittedAppVersionForPkpParams {
  pkpEthAddress: string;
  appId: number;
}

/**
 * @category Interfaces
 * */
export interface GetAllPermittedAppIdsForPkpParams {
  pkpEthAddress: string;
}

/**
 * @category Interfaces
 * */
export interface GetAllToolsAndPoliciesForAppParams {
  pkpEthAddress: string;
  appId: number;
}

/**
 * @category Interfaces
 * */
export interface ValidateToolExecutionAndGetPoliciesParams {
  delegateeAddress: string;
  pkpEthAddress: string;
  toolIpfsCid: string;
}
/** @category API */
export interface ContractClient {
  /** Registers a new app with its initial appVersion (v1)'s permissions
   *
   * @returns { txHash } - The hash of the transaction that registered the app
   */
  registerApp(params: RegisterAppParams, overrides?: Overrides): ReturnType<typeof _registerApp>;

  /** Register a new version on an existing application
   *
   * @throws - If for some reason the new app creation event is not found after a successful transaction, this method will throw an error.
   * @returns { txHash, newAppVersion} The transaction hash and the new app version incremented on-chain.
   */
  registerNextVersion(
    params: RegisterNextVersionParams,
    overrides?: Overrides,
  ): ReturnType<typeof _registerNextVersion>;

  /** Enable or disable a specific app version
   *
   * @returns { txHash } The hash of the transaction that set the app enabled state
   */
  enableAppVersion(
    params: EnableAppVersionParams,
    overrides?: Overrides,
  ): ReturnType<typeof _enableAppVersion>;

  /** Add a new delegatee to an app
   *
   * @returns { txHash } The hash of the transaction that added the new delegatee
   */
  addDelegatee(params: AddDelegateeParams, overrides?: Overrides): ReturnType<typeof _addDelegatee>;

  /** Remove a delegatee from an app
   *
   * @returns { txHash } The hash of the transaction that removed the existing delegatee
   */
  removeDelegatee(
    params: RemoveDelegateeParams,
    overrides?: Overrides,
  ): ReturnType<typeof _removeDelegatee>;

  /** Delete an application by setting its isDeleted flag to true
   *
   *
   * @returns { txHash } The hash of the transaction that marked the app deleted
   */
  deleteApp(params: DeleteAppParams, overrides?: Overrides): ReturnType<typeof _deleteApp>;

  /** Undelete an app by setting its isDeleted flag to false
   *
   * @returns { txHash } The hash of the transaction that undeleted the app
   */
  undeleteApp(params: UndeleteAppParams, overrides?: Overrides): ReturnType<typeof _undeleteApp>;

  /** Get detailed information about an app by its ID
   *
   * @returns Detailed view of the app containing its metadata and relationships, or null if the app is not registered
   */
  getAppById(params: GetAppByIdParams): ReturnType<typeof _getAppById>;

  /** Get detailed information about a specific version of an app
   *
   * @returns Object containing basic app information and version-specific information including tools and policies, or null if the app version is not registered
   */
  getAppVersion(params: GetAppVersionParams): ReturnType<typeof _getAppVersion>;

  /** Get all apps managed by a specific address with all their versions
   *
   * @returns Array of apps with all their versions managed by the specified address
   */
  getAppsByManagerAddress(
    params: GetAppsByManagerParams,
  ): ReturnType<typeof _getAppsByManagerAddress>;

  /** Get the app associated with a delegatee address
   *
   * @returns Detailed view of the app the delegatee is associated with
   */
  getAppByDelegateeAddress(
    params: GetAppByDelegateeParams,
  ): ReturnType<typeof _getAppByDelegateeAddress>;

  /** Get delegated agent PKP token IDs for a specific app version with pagination
   *
   * Returns the first 100 PKP eth addresses.
   *
   * Provide `pageOpts.offset` to fetch more than the initial 100
   *
   * Provide `pageOpts.limit` to fetch more or less than 100-at-a-time
   * @returns Array of delegated agent PKP token IDs
   */
  getDelegatedPkpEthAddresses(
    params: GetDelegatedPkpEthAddressesParams,
  ): ReturnType<typeof _getDelegatedPkpEthAddresses>;

  /** Permits an app version for an Agent Wallet PKP token and optionally sets tool policy parameters
   *
   * @returns { txHash } The transaction hash that permitted the app
   */
  permitApp(params: PermitAppParams, overrides?: Overrides): ReturnType<typeof _permitApp>;

  /** Revokes permission for a PKP to use a specific app version
   *
   * @returns { txHash } The transaction hash that remoked permission for the app
   */
  unPermitApp(params: UnPermitAppParams, overrides?: Overrides): ReturnType<typeof _unPermitApp>;

  /** Sets tool policy parameters for a specific app version
   *
   * @returns { txHash } The transaction hash that set the policy parameters
   */
  setToolPolicyParameters(
    params: SetToolPolicyParametersParams,
    overrides?: Overrides,
  ): ReturnType<typeof _setToolPolicyParameters>;

  /** Get all PKP tokens that are registered as agents for a specific user address
   *
   * @returns Array of PKP eth addresses that are registered as agents for the user. Empty array if none found.
   */
  getAllRegisteredAgentPkpEthAddresses(
    params: GetAllRegisteredAgentPkpsParams,
  ): ReturnType<typeof _getAllRegisteredAgentPkpEthAddresses>;

  /** Get the permitted app version for a specific PKP token and app
   *
   * @returns The permitted app version for the PKP token and app
   */
  getPermittedAppVersionForPkp(
    params: GetPermittedAppVersionForPkpParams,
  ): ReturnType<typeof _getPermittedAppVersionForPkp>;

  /** Get all app IDs that have permissions for a specific PKP token, excluding deleted apps
   *
   * @returns Array of app IDs that have permissions for the PKP token and haven't been deleted
   */
  getAllPermittedAppIdsForPkp(
    params: GetAllPermittedAppIdsForPkpParams,
  ): ReturnType<typeof _getAllPermittedAppIdsForPkp>;

  /** Get all permitted tools, policies, and policy parameters for a specific app and PKP in a nested object structure
   *
   * @returns Nested object structure where keys are tool IPFS CIDs and values are objects with policy IPFS CIDs as keys
   */
  getAllToolsAndPoliciesForApp(
    params: GetAllToolsAndPoliciesForAppParams,
  ): ReturnType<typeof _getAllToolsAndPoliciesForApp>;

  /** Validates tool execution and gets policies for a specific tool
   *
   * @returns Object containing validation result with isPermitted, appId, appVersion, and policies
   */
  validateToolExecutionAndGetPolicies(
    params: ValidateToolExecutionAndGetPoliciesParams,
  ): ReturnType<typeof _validateToolExecutionAndGetPolicies>;
}
