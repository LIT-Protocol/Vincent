import type {
  GetAllPermittedAppIdsForPkpParams,
  GetAllRegisteredAgentPkpsParams,
  GetAllToolsAndPoliciesForAppParams,
  GetPermittedAppVersionForPkpParams,
  PermitAppParams,
  SetToolPolicyParametersParams,
  UnPermitAppParams,
  ValidateToolExecutionAndGetPoliciesParams,
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
export interface SetToolPolicyParametersOptions extends BaseWritableOptions {
  args: SetToolPolicyParametersParams;
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
export interface GetAllToolsAndPoliciesForAppOptions extends BaseOptions {
  args: GetAllToolsAndPoliciesForAppParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface ValidateToolExecutionAndGetPoliciesOptions extends BaseOptions {
  args: ValidateToolExecutionAndGetPoliciesParams;
}
