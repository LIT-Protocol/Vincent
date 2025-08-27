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
  getDelegatedPkpEthAddresses as _getDelegatedPkpEthAddresses,
} from './internal/app/AppView';
import type {
  permitApp as _permitApp,
  rePermitApp as _rePermitApp,
  setAbilityPolicyParameters as _setAbilityPolicyParameters,
  unPermitApp as _unPermitApp,
} from './internal/user/User';
import type {
  getAllPermittedAppIdsForPkp as _getAllPermittedAppIdsForPkp,
  getAllRegisteredAgentPkpEthAddresses as _getAllRegisteredAgentPkpEthAddresses,
  getAllAbilitiesAndPoliciesForApp as _getAllAbilitiesAndPoliciesForApp,
  getLastPermittedAppVersionForPkp as _getLastPermittedAppVersionForPkp,
  getPermittedAppVersionForPkp as _getPermittedAppVersionForPkp,
  getPermittedAppsForPkps as _getPermittedAppsForPkps,
  getUnpermittedAppsForPkps as _getUnpermittedAppsForPkps,
  validateAbilityExecutionAndGetPolicies as _validateAbilityExecutionAndGetPolicies,
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
  enabled: boolean;
  abilities: Ability[];
}

/** @category Interfaces
 * */
export interface RegisterAppParams {
  appId: number;
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
export interface GetDelegatedPkpEthAddressesParams {
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
export interface RePermitAppParams {
  pkpEthAddress: string;
  appId: number;
}

/**
 * @category Interfaces
 * */
export interface SetAbilityPolicyParametersParams {
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
  offset: string;
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
  offset: string;
}

/**
 * @category Interfaces
 * */
export interface PermittedApp {
  appId: number;
  version: number;
  versionEnabled: boolean;
}

/**
 * @category Interfaces
 * */
export interface PkpPermittedApps {
  pkpTokenId: string;
  permittedApps: PermittedApp[];
}

/**
 * @category Interfaces
 * */
export interface GetPermittedAppsForPkpsParams {
  pkpEthAddresses: string[];
  offset: string;
  pageSize: string;
}

/**
 * @category Interfaces
 * */
export interface GetAllAbilitiesAndPoliciesForAppParams {
  pkpEthAddress: string;
  appId: number;
}

/**
 * @category Interfaces
 * */
export interface ValidateAbilityExecutionAndGetPoliciesParams {
  delegateeAddress: string;
  pkpEthAddress: string;
  abilityIpfsCid: string;
}

/**
 * @category Interfaces
 * */
export interface GetLastPermittedAppVersionParams {
  pkpEthAddress: string;
  appId: number;
}

/**
 * @category Interfaces
 * */
export interface UnpermittedApp {
  appId: number;
  previousPermittedVersion: number;
  versionEnabled: boolean;
}

/**
 * @category Interfaces
 * */
export interface PkpUnpermittedApps {
  pkpTokenId: string;
  unpermittedApps: UnpermittedApp[];
}

/**
 * @category Interfaces
 * */
export interface GetUnpermittedAppsForPkpsParams {
  pkpEthAddresses: string[];
  offset: string;
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

  /** Get delegated agent PKP token IDs for a specific app version with pagination
   *
   * Returns the first 100 PKP eth addresses.
   *
   * Provide `offset` to fetch paginated results.
   *
   * @returns Array of delegated agent PKP token IDs
   */
  getDelegatedPkpEthAddresses(
    params: GetDelegatedPkpEthAddressesParams,
  ): ReturnType<typeof _getDelegatedPkpEthAddresses>;

  /** Permits an app version for an Agent Wallet PKP token and optionally sets ability policy parameters
   *
   * @returns { txHash } The transaction hash that permitted the app
   */
  permitApp(params: PermitAppParams, overrides?: Overrides): ReturnType<typeof _permitApp>;

  /** Revokes permission for a PKP to use a specific app version
   *
   * @returns { txHash } The transaction hash that remoked permission for the app
   */
  unPermitApp(params: UnPermitAppParams, overrides?: Overrides): ReturnType<typeof _unPermitApp>;

  /** Sets ability policy parameters for a specific app version
   *
   * @returns { txHash } The transaction hash that set the policy parameters
   */
  setAbilityPolicyParameters(
    params: SetAbilityPolicyParametersParams,
    overrides?: Overrides,
  ): ReturnType<typeof _setAbilityPolicyParameters>;

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
   * @deprecated Use getPermittedAppsForPkps instead
   * @returns Array of app IDs that have permissions for the PKP token and haven't been deleted
   */
  getAllPermittedAppIdsForPkp(
    params: GetAllPermittedAppIdsForPkpParams,
  ): ReturnType<typeof _getAllPermittedAppIdsForPkp>;

  /** Get permitted apps for multiple PKPs with detailed information including versions and enabled status
   *
   * @returns Array of PkpPermittedApps containing permitted app details for each PKP
   */
  getPermittedAppsForPkps(params: GetPermittedAppsForPkpsParams): Promise<PkpPermittedApps[]>;

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

  /** Re-permits an app using the last permitted version for a PKP
   *
   * @returns { txHash } The transaction hash that re-permitted the app
   */
  rePermitApp(params: RePermitAppParams, overrides?: Overrides): ReturnType<typeof _rePermitApp>;

  /** Get the last permitted version for a specific app and PKP
   *
   * @returns The last permitted app version, or null if never permitted
   */
  getLastPermittedAppVersionForPkp(
    params: GetLastPermittedAppVersionParams,
  ): ReturnType<typeof _getLastPermittedAppVersionForPkp>;

  /** Get unpermitted apps for multiple PKPs with their last permitted versions
   *
   * @returns Array of PkpUnpermittedApps containing unpermitted app details for each PKP
   */
  getUnpermittedAppsForPkps(params: GetUnpermittedAppsForPkpsParams): Promise<PkpUnpermittedApps[]>;
}
