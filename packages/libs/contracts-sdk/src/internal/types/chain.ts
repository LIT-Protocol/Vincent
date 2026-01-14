export interface PolicyWithParameters {
  policyIpfsCid: string;
  policyParameterValues: string;
}

export interface AbilityWithPolicies {
  abilityIpfsCid: string;
  policies: PolicyWithParameters[];
}

export interface PermissionDataOnChain {
  abilityIpfsCids: string[];
  policyIpfsCids: string[][];
  policyParameterValues: string[][];
}

export interface AbilityExecutionValidation {
  isPermitted: boolean;
  appId: number;
  appVersion: number;
  policies: PolicyWithParameters[];
}

export interface AppVersionChain {
  version: number;
  accountIndexHash: string;
  enabled: boolean;
  delegatedAgents: string[];
  abilities: {
    abilityIpfsCid: string;
    policyIpfsCids: string[];
  }[];
}

export interface AppChain {
  id: number;
  isDeleted: boolean;
  manager: string;
  latestVersion: number;
  delegatees: string[];
  accountIndexHash: string;
}
