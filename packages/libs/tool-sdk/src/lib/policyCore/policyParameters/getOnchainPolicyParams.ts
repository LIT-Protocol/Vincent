// src/lib/policyCore/policyParameters/getOnchainPolicyParams.ts

import { ethers } from 'ethers';

import type {
  ToolPolicyParameterData,
  ValidateToolExecutionAndGetPoliciesResult,
} from '@lit-protocol/vincent-contracts-sdk';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { bigintReplacer } from '../../utils';

export const getDecodedPolicyParams = async ({
  decodedPolicies,
  policyIpfsCid,
}: {
  decodedPolicies: ToolPolicyParameterData;
  policyIpfsCid: string;
}): Promise<Record<string, any> | undefined> => {
  console.log('All on-chain policy params:', JSON.stringify(decodedPolicies, bigintReplacer));

  const policyParams = decodedPolicies[policyIpfsCid];

  if (policyParams) {
    return policyParams;
  }

  console.log('Found no on-chain parameters for policy IPFS CID:', policyIpfsCid);
  return undefined;
};

export const getPoliciesAndAppVersion = async ({
  delegationRpcUrl,
  appDelegateeAddress,
  agentWalletPkpEthAddress,
  toolIpfsCid,
}: {
  delegationRpcUrl: string;
  appDelegateeAddress: string;
  agentWalletPkpEthAddress: string;
  toolIpfsCid: string;
}): Promise<{
  appId: ethers.BigNumber;
  appVersion: ethers.BigNumber;
  decodedPolicies: ToolPolicyParameterData;
}> => {
  console.log('getPoliciesAndAppVersion', {
    delegationRpcUrl,
    appDelegateeAddress,
    agentWalletPkpEthAddress,
    toolIpfsCid,
  });

  try {
    // Create a signer using the delegationRpcUrl
    const signer = ethers.Wallet.createRandom().connect(
      new ethers.providers.StaticJsonRpcProvider(delegationRpcUrl),
    );

    const contractClient = getClient({
      signer,
    });

    // Use the contracts-sdk to validate tool execution and get policies
    const validationResult: ValidateToolExecutionAndGetPoliciesResult =
      await contractClient.validateToolExecutionAndGetPolicies({
        delegateeAddress: appDelegateeAddress,
        pkpEthAddress: agentWalletPkpEthAddress,
        toolIpfsCid: toolIpfsCid,
      });

    // We exit early here because !validationResult.isPermitted means appDelegateeAddress
    // is not permitted to execute toolIpfsCid for the Vincent App on behalf of the agentWalletPkpTokenId
    // and no further processing is needed
    if (!validationResult.isPermitted) {
      throw new Error(
        `App Delegatee: ${appDelegateeAddress} is not permitted to execute Vincent Tool: ${toolIpfsCid} for App ID: ${validationResult.appId} App Version: ${validationResult.appVersion} using Agent Wallet PKP Address: ${agentWalletPkpEthAddress}`,
      );
    }

    return {
      appId: ethers.BigNumber.from(validationResult.appId),
      appVersion: ethers.BigNumber.from(validationResult.appVersion),
      decodedPolicies: validationResult.decodedPolicies,
    };
  } catch (error) {
    throw new Error(
      `Error getting on-chain policy parameters from Vincent contract using App Delegatee: ${appDelegateeAddress} and Agent Wallet PKP Address: ${agentWalletPkpEthAddress} and Vincent Tool: ${toolIpfsCid}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
