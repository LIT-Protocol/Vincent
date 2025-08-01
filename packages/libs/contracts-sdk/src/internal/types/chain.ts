import type { BigNumber } from 'ethers';

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
  appId: BigNumber;
  appVersion: BigNumber;
  policies: PolicyWithParameters[];
}

export interface AppVersionChain {
  version: BigNumber;
  enabled: boolean;
  abilities: {
    abilityIpfsCid: string;
    policyIpfsCids: string[];
  }[];
}

export interface AppChain {
  id: BigNumber;
  isDeleted: boolean;
  manager: string;
  latestVersion: BigNumber;
  delegatees: string[];
}

export interface AppWithVersionsChain {
  app: AppChain;
  versions: AppVersionChain[];
}
