// src/lib/policyCore/policyParameters/getOnchainPolicyParams.ts

import { ethers } from 'ethers';

import type { AllOnChainPolicyParams, Policy } from './types';
import { decodePolicyParams } from './decodePolicyParams';

export const getOnePolicysOnChainParams = async ({
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
  const allOnChainPolicyParams = await _fetchAllOnChainParams({
    delegationRpcUrl,
    vincentContractAddress,
    appDelegateeAddress,
    agentWalletPkpTokenId,
    toolIpfsCid,
  });

  const onChainPolicyParams = allOnChainPolicyParams.policies.find(
    (policy: Policy) => policy.policyIpfsCid === policyIpfsCid,
  );

  if (onChainPolicyParams) {
    return decodePolicyParams({
      params: onChainPolicyParams.parameters,
    });
  }

  return undefined;
};

export const getPoliciesAndAppVersion = async ({
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
  appId: ethers.BigNumber;
  appVersion: ethers.BigNumber;
  policies: Policy[];
}> => {
  const allOnChainPolicyParams = await _getAllOnChainPolicyParams({
    delegationRpcUrl,
    vincentContractAddress,
    appDelegateeAddress,
    agentWalletPkpTokenId,
    toolIpfsCid,
  });

  return {
    policies: allOnChainPolicyParams.policies,
    appId: allOnChainPolicyParams.appId,
    appVersion: allOnChainPolicyParams.appVersion,
  };
};

async function _fetchAllOnChainParams({
  vincentContractAddress,
  delegationRpcUrl,
  appDelegateeAddress,
  agentWalletPkpTokenId,
  toolIpfsCid,
}: {
  vincentContractAddress: string;
  delegationRpcUrl: string;
  appDelegateeAddress: string;
  agentWalletPkpTokenId: string;
  toolIpfsCid: string;
}): Promise<AllOnChainPolicyParams> {
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
}

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
  const allOnChainPolicyParams = await _fetchAllOnChainParams({
    vincentContractAddress: vincentContractAddress,
    delegationRpcUrl: delegationRpcUrl,
    appDelegateeAddress: appDelegateeAddress,
    agentWalletPkpTokenId: agentWalletPkpTokenId,
    toolIpfsCid: toolIpfsCid,
  });

  // We exit early here because !allOnChainPolicyParams.isPermitted means appDelegateeAddress
  // is not permitted to execute toolIpfsCid for the Vincent App on behalf of the agentWalletPkpTokenId
  // and no further processing is needed
  if (!allOnChainPolicyParams.isPermitted) {
    throw new Error(
      `App Delegatee: ${appDelegateeAddress} is not permitted to execute Vincent Tool: ${toolIpfsCid} for App ID: ${allOnChainPolicyParams.appId.toString()} App Version: ${allOnChainPolicyParams.appVersion.toString()} using Agent Wallet PKP Token ID: ${agentWalletPkpTokenId}`,
    );
  }

  return allOnChainPolicyParams;
};
