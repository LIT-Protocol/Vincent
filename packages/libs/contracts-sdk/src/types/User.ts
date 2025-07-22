import type { Overrides, Signer } from 'ethers';

/**
 * Represents the decoded parameters for policies associated with a single tool
 * Keys are policy IPFS CIDs, values are policy parameters for the policy
 * @category Interfaces
 * @inline
 * @expand
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
 * @inline
 * @expand
 */
export interface PermissionData {
  [toolIpfsCid: string]: ToolPolicyParameterData;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface PermitAppParams {
  pkpEthAddress: string;
  appId: number;
  appVersion: number;
  permissionData: PermissionData;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface PermitAppOptions {
  signer: Signer;
  args: PermitAppParams;
  overrides?: Overrides;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface UnPermitAppParams {
  pkpEthAddress: string;
  appId: number;
  appVersion: number;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface UnPermitAppOptions {
  signer: Signer;
  args: UnPermitAppParams;
  overrides?: Overrides;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface SetToolPolicyParametersParams {
  pkpEthAddress: string;
  appId: number;
  appVersion: number;
  policyParams: PermissionData;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface SetToolPolicyParametersOptions {
  signer: Signer;
  args: SetToolPolicyParametersParams;
  overrides?: Overrides;
}

// ==================================================================================
// User View Types
// ==================================================================================

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAllRegisteredAgentPkpsParams {
  userPkpAddress: string;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAllRegisteredAgentPkpsOptions {
  signer: Signer;
  args: GetAllRegisteredAgentPkpsParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetPermittedAppVersionForPkpParams {
  pkpEthAddress: string;
  appId: number;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetPermittedAppVersionForPkpOptions {
  signer: Signer;
  args: GetPermittedAppVersionForPkpParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAllPermittedAppIdsForPkpParams {
  pkpEthAddress: string;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAllPermittedAppIdsForPkpOptions {
  signer: Signer;
  args: GetAllPermittedAppIdsForPkpParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAllToolsAndPoliciesForAppParams {
  pkpEthAddress: string;
  appId: number;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface GetAllToolsAndPoliciesForAppOptions {
  signer: Signer;
  args: GetAllToolsAndPoliciesForAppParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface ValidateToolExecutionAndGetPoliciesParams {
  delegateeAddress: string;
  pkpEthAddress: string;
  toolIpfsCid: string;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface ValidateToolExecutionAndGetPoliciesOptions {
  signer: Signer;
  args: ValidateToolExecutionAndGetPoliciesParams;
}

/**
 * @category Interfaces
 * @inline
 * @expand
 * */
export interface ValidateToolExecutionAndGetPoliciesResult {
  isPermitted: boolean;
  appId: number;
  appVersion: number;
  decodedPolicies: ToolPolicyParameterData;
}
