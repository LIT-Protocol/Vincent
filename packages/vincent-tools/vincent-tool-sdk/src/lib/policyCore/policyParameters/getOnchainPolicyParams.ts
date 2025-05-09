// src/lib/policyCore/policyParameters/getOnchainPolicyParams.ts

import { ethers } from 'ethers';

import type { AllOnChainPolicyParams } from './types';
import { decodePolicyParams } from './decodePolicyParams';

export const getOnchainPolicyParams = async ({
  delegationRpcUrl,
  vincentContractAddress,
  appDelegateeAddress,
  agentWalletPkpTokenId,
  toolIpfsCid,
  policyIpfsCid,
}: {
  delegationRpcUrl: string;
  vincentContractAddress: string;
  appDelegateeAddress: string;
  agentWalletPkpTokenId: string;
  toolIpfsCid: string;
  policyIpfsCid: string;
}): Promise<unknown | undefined> => {
  const allOnChainPolicyParams = await _getAllOnChainPolicyParams({
    delegationRpcUrl,
    vincentContractAddress,
    appDelegateeAddress,
    agentWalletPkpTokenId,
    toolIpfsCid,
  });

  // We exit early here because !allOnChainPolicyParams.isPermitted means appDelegateeAddress
  // is not permitted to execute toolIpfsCid for the Vincent App on behalf of the agentWalletPkpTokenId
  // and no further processing is needed
  if (!allOnChainPolicyParams.isPermitted) {
    throw new Error(
      `App Delegatee: ${appDelegateeAddress} is not permitted to execute Vincent Tool: ${toolIpfsCid} for App ID: ${allOnChainPolicyParams.appId.toString()} App Version: ${allOnChainPolicyParams.appVersion.toString()} using Agent Wallet PKP Token ID: ${agentWalletPkpTokenId}`,
    );
  }

  const onChainPolicyParams = allOnChainPolicyParams.policies.find(
    (policy) => policy.policyIpfsCid === policyIpfsCid,
  );

  if (onChainPolicyParams) {
    return decodePolicyParams({
      params: onChainPolicyParams.parameters,
    });
  }

  return undefined;
};

export const getAllUserPoliciesRegisteredForTool = async ({
  delegationRpcUrl,
  vincentContractAddress,
  appDelegateeAddress,
  agentWalletPkpTokenId,
  toolIpfsCid,
}: {
  delegationRpcUrl: string;
  vincentContractAddress: string;
  appDelegateeAddress: string;
  agentWalletPkpTokenId: string;
  toolIpfsCid: string;
}): Promise<{
  registeredUserPolicyIpfsCids: string[];
  appId: ethers.BigNumber;
  appVersion: ethers.BigNumber;
}> => {
  const allOnChainPolicyParams = await _getAllOnChainPolicyParams({
    delegationRpcUrl,
    vincentContractAddress,
    appDelegateeAddress,
    agentWalletPkpTokenId,
    toolIpfsCid,
  });

  // We exit early here because !allOnChainPolicyParams.isPermitted means appDelegateeAddress
  // is not permitted to execute toolIpfsCid for the Vincent App on behalf of the agentWalletPkpTokenId
  // and no further processing is needed
  if (!allOnChainPolicyParams.isPermitted) {
    throw new Error(
      `App Delegatee: ${appDelegateeAddress} is not permitted to execute Vincent Tool: ${toolIpfsCid} for App ID: ${allOnChainPolicyParams.appId.toString()} App Version: ${allOnChainPolicyParams.appVersion.toString()} using Agent Wallet PKP Token ID: ${agentWalletPkpTokenId}`,
    );
  }

  return {
    registeredUserPolicyIpfsCids: allOnChainPolicyParams.policies.map(
      (policy) => policy.policyIpfsCid,
    ),
    appId: allOnChainPolicyParams.appId,
    appVersion: allOnChainPolicyParams.appVersion,
  };
};

const _getAllOnChainPolicyParams = async ({
  delegationRpcUrl,
  vincentContractAddress,
  appDelegateeAddress,
  agentWalletPkpTokenId,
  toolIpfsCid,
}: {
  delegationRpcUrl: string;
  vincentContractAddress: string;
  appDelegateeAddress: string;
  agentWalletPkpTokenId: string;
  toolIpfsCid: string;
}): Promise<AllOnChainPolicyParams> => {
  try {
    const VINCENT_CONTRACT_ABI = [
      `function validateToolExecutionAndGetPolicies(address delegatee, uint256 pkpTokenId, string calldata toolIpfsCid) external view returns (tuple(bool isPermitted, uint256 appId, uint256 appVersion, tuple(string policyIpfsCid, tuple(string name, uint8 paramType, bytes value)[] parameters)[] policies) validation)`,
    ];

    const vincentContract = new ethers.Contract(
      vincentContractAddress,
      VINCENT_CONTRACT_ABI,
      new ethers.providers.StaticJsonRpcProvider(delegationRpcUrl),
    );

    return vincentContract.validateToolExecutionAndGetPolicies(
      appDelegateeAddress,
      agentWalletPkpTokenId,
      toolIpfsCid,
    );
  } catch (error) {
    throw new Error(
      `Error getting on-chain policy parameters from Vincent contract: ${vincentContractAddress} using App Delegatee: ${appDelegateeAddress} and Agent Wallet PKP Token ID: ${agentWalletPkpTokenId} and Vincent Tool: ${toolIpfsCid}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
