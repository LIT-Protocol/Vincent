import { Signer } from 'ethers';

// ==================================================================================
// User Mutation Types
// ==================================================================================

export interface AppPermissionData {
  abilityIpfsCids: string[];
  policyIpfsCids: string[][];
  policyParameterValues: string[][];
}

export interface PermitAppParams {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
  permissionData: AppPermissionData;
}

export interface PermitAppOptions {
  signer: Signer;
  args: PermitAppParams;
  overrides?: any;
}

export interface UnPermitAppParams {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
}

export interface UnPermitAppOptions {
  signer: Signer;
  args: UnPermitAppParams;
  overrides?: any;
}

export interface SetAbilityPolicyParametersParams {
  pkpTokenId: string;
  appId: string;
  appVersion: string;
  abilityIpfsCids: string[];
  policyIpfsCids: string[][];
  policyParameterValues: string[][];
}

export interface SetAbilityPolicyParametersOptions {
  signer: Signer;
  args: SetAbilityPolicyParametersParams;
  overrides?: any;
}

// ==================================================================================
// User View Types
// ==================================================================================

export interface GetAllRegisteredAgentPkpsParams {
  userAddress: string;
  offset: string;
}

export interface GetAllRegisteredAgentPkpsOptions {
  signer: Signer;
  args: GetAllRegisteredAgentPkpsParams;
}

export interface GetPermittedAppVersionForPkpParams {
  pkpTokenId: string;
  appId: string;
}

export interface GetPermittedAppVersionForPkpOptions {
  signer: Signer;
  args: GetPermittedAppVersionForPkpParams;
}

export interface GetAllPermittedAppIdsForPkpParams {
  pkpTokenId: string;
  offset: string;
}

export interface GetAllPermittedAppIdsForPkpOptions {
  signer: Signer;
  args: GetAllPermittedAppIdsForPkpParams;
}

export interface GetAllAbilitiesAndPoliciesForAppParams {
  pkpTokenId: string;
  appId: string;
}

export interface GetAllAbilitiesAndPoliciesForAppOptions {
  signer: Signer;
  args: GetAllAbilitiesAndPoliciesForAppParams;
}

// ==================================================================================
// Response Types
// ==================================================================================

export interface PolicyWithParameters {
  policyIpfsCid: string;
  policyParameterValues: string;
}

export interface AbilityWithPolicies {
  abilityIpfsCid: string;
  policies: PolicyWithParameters[];
}
