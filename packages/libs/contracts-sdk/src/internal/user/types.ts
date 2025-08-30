import type { BigNumber } from 'ethers';

import type {
  GetAllPermittedAppIdsForPkpParams,
  GetAllRegisteredAgentPkpsParams,
  GetAllAbilitiesAndPoliciesForAppParams,
  GetPermittedAppVersionForPkpParams,
  GetPermittedAppsForPkpsParams,
  PermitAppParams,
  SetAbilityPolicyParametersParams,
  UnPermitAppParams,
  ValidateAbilityExecutionAndGetPoliciesParams,
} from '../../types';
import type { BaseOptions, BaseWritableOptions } from '../types/options';

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface PermitAppOptions extends BaseWritableOptions {
  args: PermitAppParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface UnPermitAppOptions extends BaseWritableOptions {
  args: UnPermitAppParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface SetAbilityPolicyParametersOptions extends BaseWritableOptions {
  args: SetAbilityPolicyParametersParams;
}

// ==================================================================================
// User View Types
// ==================================================================================

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAllRegisteredAgentPkpsOptions extends BaseOptions {
  args: GetAllRegisteredAgentPkpsParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetPermittedAppVersionForPkpOptions extends BaseOptions {
  args: GetPermittedAppVersionForPkpParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAllPermittedAppIdsForPkpOptions extends BaseOptions {
  args: GetAllPermittedAppIdsForPkpParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAllAbilitiesAndPoliciesForAppOptions extends BaseOptions {
  args: GetAllAbilitiesAndPoliciesForAppParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetPermittedAppsForPkpsOptions extends BaseOptions {
  args: GetPermittedAppsForPkpsParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface ValidateAbilityExecutionAndGetPoliciesOptions extends BaseOptions {
  args: ValidateAbilityExecutionAndGetPoliciesParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface ContractPkpPermittedApps {
  pkpTokenId: BigNumber;
  permittedApps: {
    appId: number;
    version: number;
    versionEnabled: boolean;
  }[];
}
