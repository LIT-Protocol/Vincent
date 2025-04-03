import { IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { BigNumber } from 'ethers';

export interface AuthenticatedConsentFormProps {
  userPKP: IRelayPKP;
  sessionSigs: SessionSigs;
  agentPKP?: IRelayPKP;
  isSessionValidation?: boolean;
}

export interface AppView {
  name: string;
  description: string;
  manager: string;
  latestVersion: BigNumber | number;
  delegatees: string[] | any[];
  authorizedRedirectUris: string[];
  deploymentStatus?: number; // 0: DEV, 1: TEST, 2: PROD
}

export interface VersionParameter {
  toolIndex: number;
  policyIndex: number;
  paramIndex: number;
  name: string;
  type: number;
  value: any;
}

export interface PolicyParameter {
  name: string;
  paramType: number;
  value: string;
}

export interface PolicyWithParameters {
  policyIpfsCid: string;
  parameters: PolicyParameter[];
}

export interface ToolWithPolicies {
  toolIpfsCid: string;
  policies: PolicyWithParameters[];
} 