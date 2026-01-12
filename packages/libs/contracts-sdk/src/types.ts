import type { Overrides } from 'ethers';

import type {
  addDelegatee as _addDelegatee,
  deleteApp as _deleteApp,
  enableAppVersion as _enableAppVersion,
  registerApp as _registerApp,
  registerNextVersion as _registerNextVersion,
  removeDelegatee as _removeDelegatee,
  setDelegatee as _setDelegatee,
  undeleteApp as _undeleteApp,
} from './internal/app/App';
import type {
  getAppByDelegateeAddress as _getAppByDelegateeAddress,
  getAppById as _getAppById,
  getAppIdByDelegatee as _getAppIdByDelegatee,
  getAppsByManagerAddress as _getAppsByManagerAddress,
  getAppVersion as _getAppVersion,
  getDelegatedAgentAddresses as _getDelegatedAgentAddresses,
} from './internal/app/AppView';
import type {
  permitApp as _permitApp,
  rePermitApp as _rePermitApp,
  setAbilityPolicyParameters as _setAbilityPolicyParameters,
  unPermitApp as _unPermitApp,
} from './internal/user/User';
import type {
  getAllRegisteredAgentAddressesForUser as _getAllRegisteredAgentAddressesForUser,
  getPermittedAppForAgents as _getPermittedAppForAgents,
  getUnpermittedAppForAgents as _getUnpermittedAppForAgents,
  getUserAddressForAgent as _getUserAddressForAgent,
  getAllAbilitiesAndPoliciesForApp as _getAllAbilitiesAndPoliciesForApp,
  validateAbilityExecutionAndGetPolicies as _validateAbilityExecutionAndGetPolicies,
  isDelegateePermitted as _isDelegateePermitted,
} from './internal/user/UserView';

/**
 * @category Interfaces
 * */
export interface AppVersionAbilities {
  abilityIpfsCids: string[];
  abilityPolicies: string[][];
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
  accountIndexHash: string;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface Ability {
  abilityIpfsCid: string;
  policyIpfsCids: string[];
}

/**
 * @category Interfaces
 * */
export interface AppVersion {
  version: number;
  accountIndexHash: string;
  enabled: boolean;
  delegatedAgentAddresses: string[];
  abilities: Ability[];
}

/** @category Interfaces
 * */
export interface RegisterAppParams {
  delegateeAddresses: string[];
  versionAbilities: AppVersionAbilities;
}

/**
 * @category Interfaces
 * */
export interface RegisterNextVersionParams {
  appId: number;
  versionAbilities: AppVersionAbilities;
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
export interface SetDelegateeParams {
  appId: number;
  delegateeAddresses: string[];
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

export interface GetAppIdByDelegateeParams {
  delegateeAddress: string;
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
  offset: string;
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
export interface GetDelegatedAgentAddressesParams {
  appId: number;
  version: number;
  offset: number;
}

/**
 * Represents the decoded parameters for policies associated with a single ability
 * Keys are policy IPFS CIDs, values are policy parameters for the policy
 * @category Interfaces
 */
export interface AbilityPolicyParameterData {
  [policyIpfsCid: string]:
    | {
        // TODO: Add stronger type that narrows to only explicitly CBOR2 serializable values?
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [paramName: string]: any;
      }
    | undefined;
}

/**
 * Represents a nested structure of ability and policy parameters
 * Keys are ability IPFS CIDs, values are AbilityPolicyParameterData objects
 *
 * @category Interfaces
 */
export interface PermissionData {
  [abilityIpfsCid: string]: AbilityPolicyParameterData;
}

/**
 * @category Interfaces
 * */
export interface ValidateAbilityExecutionAndGetPoliciesResult {
  isPermitted: boolean;
  appId: number;
  appVersion: number;
  decodedPolicies: AbilityPolicyParameterData;
}

/**
 * @category Interfaces
 * */
export interface PermitAppParams {
  agentAddress: string;
  pkpSigner: string;
  pkpSignerPubKey: string;
  appId: number;
  appVersion: number;
  permissionData: PermissionData;
}

/**
 * @category Interfaces
 * */
export interface UnPermitAppParams {
  agentAddress: string;
  appId: number;
  appVersion: number;
}

/**
 * @category Interfaces
 * */
export interface RePermitAppParams {
  agentAddress: string;
  appId: number;
}

/**
 * Represents a nested map of existing policy entries to delete, keyed by ability.
 * Keys are ability IPFS CIDs, values are arrays of policy IPFS CIDs that should be removed for that ability.
 *
 * Used by setAbilityPolicyParameters to request deletions without providing new parameters.
 *
 * @example
 * {
 *   "abilityCidA": ["policyCid1", "policyCid2"],
 *   "abilityCidB": ["policyCid3"]
 * }
 *
 * @category Interfaces
 * */
export interface DeletePermissionData {
  [abilityIpfsCid: string]: string[];
}

export interface SetAbilityPolicyParametersParams {
  agentAddress: string;
  appId: number;
  appVersion: number;
  policyParams?: PermissionData;
  deletePermissionData?: DeletePermissionData;
}

/**
 * @category Interfaces
 * */
export interface GetAllRegisteredAgentAddressesForUserParams {
  userAddress: string;
  offset: string;
}

/**
 * @category Interfaces
 * */
export interface GetUserAddressForAgentParams {
  agentAddress: string;
}

/**
 * @category Interfaces
 * */
export interface PermittedApp {
  appId: number;
  version: number;
  pkpSigner: string;
  pkpSignerPubKey: string;
  versionEnabled: boolean;
  isDeleted: boolean;
}

/**
 * @category Interfaces
 * */
export interface AgentPermittedApp {
  agentAddress: string;
  permittedApp: PermittedApp | null;
}

/**
 * @category Interfaces
 * */
export interface GetPermittedAppForAgentsParams {
  agentAddresses: string[];
}

/**
 * @category Interfaces
 * */
export interface GetAllAbilitiesAndPoliciesForAppParams {
  agentAddress: string;
  appId: number;
}

/**
 * @category Interfaces
 * */
export interface ValidateAbilityExecutionAndGetPoliciesParams {
  delegateeAddress: string;
  agentAddress: string;
  abilityIpfsCid: string;
}

/**
 * @category Interfaces
 * */
export interface IsDelegateePermittedParams {
  delegateeAddress: string;
  agentAddress: string;
  abilityIpfsCid: string;
}

/**
 * @category Interfaces
 * */
export interface UnpermittedApp {
  appId: number;
  previousPermittedVersion: number;
  pkpSigner: string;
  pkpSignerPubKey: string;
  versionEnabled: boolean;
  isDeleted: boolean;
}

/**
 * @category Interfaces
 * */
export interface AgentUnpermittedApp {
  agentAddress: string;
  unpermittedApp: UnpermittedApp | null;
}

/**
 * @category Interfaces
 * */
export interface GetUnpermittedAppForAgentsParams {
  agentAddresses: string[];
}
/** @category API */
export interface ContractClient {
  /** Registers a new app with its initial appVersion (v1)'s permissions
   *
   * @returns { txHash, appId, newAppVersion, accountIndexHash } - The hash of the transaction and registry identifiers
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

  /** Set delegatees for an app (replaces all existing delegatees)
   *
   * @returns { txHash } The hash of the transaction that set the delegatees
   */
  setDelegatee(params: SetDelegateeParams, overrides?: Overrides): ReturnType<typeof _setDelegatee>;

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

  /** Get the app ID for a specific delegatee address
   *
   * @returns The app ID for the specified delegatee address
   */
  getAppIdByDelegatee(params: GetAppIdByDelegateeParams): ReturnType<typeof _getAppIdByDelegatee>;

  /** Get detailed information about a specific version of an app
   *
   * @returns Object containing basic app information and version-specific information including abilities and policies, or null if the app version is not registered
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

  /** Get delegated agent addresses for a specific app version with pagination
   *
   * @returns Array of delegated agent addresses
   */
  getDelegatedAgentAddresses(
    params: GetDelegatedAgentAddressesParams,
  ): ReturnType<typeof _getDelegatedAgentAddresses>;

  /** Permits an app version for an agent and optionally sets ability policy parameters
   *
   * @returns { txHash } The transaction hash that permitted the app
   */
  permitApp(params: PermitAppParams, overrides?: Overrides): ReturnType<typeof _permitApp>;

  /** Revokes permission for an agent to use a specific app version
   *
   * @returns { txHash } The transaction hash that remoked permission for the app
   */
  unPermitApp(params: UnPermitAppParams, overrides?: Overrides): ReturnType<typeof _unPermitApp>;

  /** Sets ability policy parameters for a specific app version
   * Note that omitting parameters from `policyParams` does not remove any existing values; this function allows atomic/sparse updates.
   *
   * To remove existing policy parameters, provide their IPFS CIDs in the `deletePermissionData` param.
   * @returns { txHash } The transaction hash that set the policy parameters
   */
  setAbilityPolicyParameters(
    params: SetAbilityPolicyParametersParams,
    overrides?: Overrides,
  ): ReturnType<typeof _setAbilityPolicyParameters>;

  /** Get all agent addresses that are registered for a specific user address
   *
   * @returns Array of agent addresses that are registered for the user. Empty array if none found.
   */
  getAllRegisteredAgentAddressesForUser(
    params: GetAllRegisteredAgentAddressesForUserParams,
  ): ReturnType<typeof _getAllRegisteredAgentAddressesForUser>;

  /** Get the currently permitted app (if any) for a set of agent addresses
   *
   * @returns Array of AgentPermittedApp containing permitted app details for each agent
   */
  getPermittedAppForAgents(
    params: GetPermittedAppForAgentsParams,
  ): ReturnType<typeof _getPermittedAppForAgents>;

  /** Get all permitted abilities, policies, and policy parameters for a specific app and PKP in a nested object structure
   *
   * @returns Nested object structure where keys are ability IPFS CIDs and values are objects with policy IPFS CIDs as keys
   */
  getAllAbilitiesAndPoliciesForApp(
    params: GetAllAbilitiesAndPoliciesForAppParams,
  ): ReturnType<typeof _getAllAbilitiesAndPoliciesForApp>;

  /** Validates ability execution and gets policies for a specific ability
   *
   * @returns Object containing validation result with isPermitted, appId, appVersion, and policies
   */
  validateAbilityExecutionAndGetPolicies(
    params: ValidateAbilityExecutionAndGetPoliciesParams,
  ): ReturnType<typeof _validateAbilityExecutionAndGetPolicies>;

  /** Check if a delegatee is permitted to execute an ability for an agent
   *
   * @returns Boolean indicating whether the delegatee has permission
   */
  isDelegateePermitted(
    params: IsDelegateePermittedParams,
  ): ReturnType<typeof _isDelegateePermitted>;

  /** Re-permits an app using the last permitted version for an agent
   *
   * @returns { txHash } The transaction hash that re-permitted the app
   */
  rePermitApp(params: RePermitAppParams, overrides?: Overrides): ReturnType<typeof _rePermitApp>;

  /** Get the last unpermitted app for agents
   *
   * @returns Array of AgentUnpermittedApp containing unpermitted app details for each agent
   */
  getUnpermittedAppForAgents(
    params: GetUnpermittedAppForAgentsParams,
  ): ReturnType<typeof _getUnpermittedAppForAgents>;

  /** Get the user address that registered a specific agent address
   *
   * @returns User address for the agent
   */
  getUserAddressForAgent(
    params: GetUserAddressForAgentParams,
  ): ReturnType<typeof _getUserAddressForAgent>;
}
