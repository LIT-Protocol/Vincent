import type {
  GetAllRegisteredAgentAddressesParams,
  GetAllAbilitiesAndPoliciesForAppParams,
  GetPermittedAppVersionForAgentParams,
  GetPermittedAppForAgentsParams,
  GetUnpermittedAppForAgentsParams,
  GetUserAddressForAgentParams,
  PermitAppParams,
  RePermitAppParams,
  SetAbilityPolicyParametersParams,
  UnPermitAppParams,
  ValidateAbilityExecutionAndGetPoliciesParams,
  IsDelegateePermittedParams,
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
export interface RePermitAppOptions extends BaseWritableOptions {
  args: RePermitAppParams;
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
export interface GetAllRegisteredAgentAddressesOptions extends BaseOptions {
  args: GetAllRegisteredAgentAddressesParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetPermittedAppVersionForAgentOptions extends BaseOptions {
  args: GetPermittedAppVersionForAgentParams;
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
export interface GetPermittedAppForAgentsOptions extends BaseOptions {
  args: GetPermittedAppForAgentsParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetUnpermittedAppForAgentsOptions extends BaseOptions {
  args: GetUnpermittedAppForAgentsParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetUserAddressForAgentOptions extends BaseOptions {
  args: GetUserAddressForAgentParams;
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
export interface IsDelegateePermittedOptions extends BaseOptions {
  args: IsDelegateePermittedParams;
}
