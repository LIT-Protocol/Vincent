import type { BigNumber } from 'ethers';

export interface PolicyWithParameters {
  policyIpfsCid: string;
  policyParameterValues: string;
}

export interface ToolWithPolicies {
  toolIpfsCid: string;
  policies: PolicyWithParameters[];
}

export interface PermissionDataOnChain {
  toolIpfsCids: string[];
  policyIpfsCids: string[][];
  policyParameterValues: string[][];
}

export interface ToolExecutionValidation {
  isPermitted: boolean;
  appId: BigNumber;
  appVersion: BigNumber;
  policies: PolicyWithParameters[];
}

export interface AppVersionChain {
  version: BigNumber;
  enabled: boolean;
  tools: {
    toolIpfsCid: string;
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
