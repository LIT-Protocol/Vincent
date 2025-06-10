// src/lib/policyCore/policyParameters/types.ts

import { ethers } from 'ethers';

export interface PolicyParameter {
  name: string;
  paramType: number;
  value: string;
}

export interface Policy {
  policyIpfsCid: string;
  parameters: PolicyParameter[];
}

export type EthersAbiDecodedValue =
  | ethers.BigNumber
  | ethers.BigNumber[]
  | boolean
  | boolean[]
  | string
  | string[]
  | Uint8Array
  | Uint8Array[];

export interface AllOnChainPolicyParams {
  isPermitted: boolean;
  appId: ethers.BigNumber;
  appVersion: ethers.BigNumber;
  policies: Policy[];
}
