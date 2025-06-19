import { BigNumber } from 'ethers';

interface PolicyWithParameters {
  policyIpfsCid: string;
  parameters: PolicyParameter[];
}

interface PolicyParameter {
  name: string;
  type: string | number;
  value?: string;
}

interface AppView {
  appId: number;
  appName: string;
  description: string;
  authorizedRedirectUris: string[];
  delegatees: string[];
  toolPolicies: any[]; // Array of version data
  managementWallet: string;
  currentVersion: number;
  latestVersion?: BigNumber | number;
  deploymentStatus?: number; // 0: DEV, 1: TEST, 2: PROD
  isDeleted?: boolean;
}

export type { PolicyWithParameters, PolicyParameter, AppView };
