import { LIT_NETWORK, RPC_URL_BY_NETWORK } from '@lit-protocol/constants';
import { ethers } from 'ethers';

import { getEnv } from './get-env';

const VINCENT_USER_VIEW_CONTRACT_ABI = [
  'function validateToolExecutionAndGetPolicies(address delegatee,uint256 pkpTokenId,string toolIpfsCid) view returns(bool isPermitted,uint256 appId,uint256 appVersion,tuple(string policyIpfsCid,tuple(string name,uint8 paramType,bytes value)[] parameters)[] policies)',
];

export interface PolicyParameter {
  name: string;
  paramType: number;
  value: string;
}

export interface PolicyInfo {
  policyIpfsCid: string;
  parameters: PolicyParameter[];
}

export interface ToolExecutionValidationResult {
  isPermitted: boolean;
  appId: number;
  appVersion: number;
  policies: PolicyInfo[];
}

export const checkVincentDelegateeCanExecuteTool = async ({
  delegateeAddress,
  pkpTokenId,
  toolIpfsCid,
}: {
  delegateeAddress: string;
  pkpTokenId: ethers.BigNumber;
  toolIpfsCid: string;
}): Promise<ToolExecutionValidationResult> => {
  const VINCENT_ADDRESS = getEnv('VINCENT_ADDRESS');
  if (VINCENT_ADDRESS === undefined) {
    throw new Error(
      `VINCENT_ADDRESS environment variable is not set. Please set it to the address of the Vincent contract.`,
    );
  }

  const provider = new ethers.providers.StaticJsonRpcProvider(
    RPC_URL_BY_NETWORK[LIT_NETWORK.Datil],
  );
  const vincentContract = new ethers.Contract(
    VINCENT_ADDRESS,
    VINCENT_USER_VIEW_CONTRACT_ABI,
    provider,
  );

  const result = await vincentContract.validateToolExecutionAndGetPolicies(
    delegateeAddress,
    pkpTokenId,
    toolIpfsCid,
  );

  return {
    isPermitted: result.isPermitted,
    appId: result.appId.toNumber(),
    appVersion: result.appVersion.toNumber(),
    policies: result.policies.map((policy: any) => ({
      policyIpfsCid: policy.policyIpfsCid,
      parameters: policy.parameters.map((param: any) => ({
        name: param.name,
        paramType: param.paramType,
        value: param.value,
      })),
    })),
  };
};
