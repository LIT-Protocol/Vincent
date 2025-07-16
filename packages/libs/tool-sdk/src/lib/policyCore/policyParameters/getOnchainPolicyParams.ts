// src/lib/policyCore/policyParameters/getOnchainPolicyParams.ts

import { ethers } from 'ethers';
import {
  validateToolExecutionAndGetPolicies,
  type ToolPolicyParameterData,
  type ValidateToolExecutionAndGetPoliciesResult,
} from '@lit-protocol/vincent-contracts-sdk';

export const getDecodedPolicyParams = async ({
  decodedPolicies,
  policyIpfsCid,
}: {
  decodedPolicies: ToolPolicyParameterData;
  policyIpfsCid: string;
}): Promise<Record<string, any> | undefined> => {
  console.log('All on-chain policy params:', JSON.stringify(decodedPolicies));

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
  agentWalletPkpTokenId,
  toolIpfsCid,
}: {
  delegationRpcUrl: string;
  appDelegateeAddress: string;
  agentWalletPkpTokenId: string;
  toolIpfsCid: string;
}): Promise<{
  appId: ethers.BigNumber;
  appVersion: ethers.BigNumber;
  decodedPolicies: ToolPolicyParameterData;
}> => {
  console.log('getPoliciesAndAppVersion', {
    delegationRpcUrl,
    appDelegateeAddress,
    agentWalletPkpTokenId,
    toolIpfsCid,
  });

  try {
    // Create a signer using the delegationRpcUrl
    const provider = new ethers.providers.StaticJsonRpcProvider(delegationRpcUrl);

    // Use the contracts-sdk to validate tool execution and get policies
    const validationResult: ValidateToolExecutionAndGetPoliciesResult =
      await validateToolExecutionAndGetPolicies({
        signer: ethers.Wallet.createRandom().connect(provider),
        args: {
          delegatee: appDelegateeAddress,
          pkpTokenId: agentWalletPkpTokenId,
          toolIpfsCid: toolIpfsCid,
        },
      });

    // We exit early here because !validationResult.isPermitted means appDelegateeAddress
    // is not permitted to execute toolIpfsCid for the Vincent App on behalf of the agentWalletPkpTokenId
    // and no further processing is needed
    if (!validationResult.isPermitted) {
      throw new Error(
        `App Delegatee: ${appDelegateeAddress} is not permitted to execute Vincent Tool: ${toolIpfsCid} for App ID: ${validationResult.appId} App Version: ${validationResult.appVersion} using Agent Wallet PKP Token ID: ${agentWalletPkpTokenId}`,
      );
    }

    return {
      appId: ethers.BigNumber.from(validationResult.appId),
      appVersion: ethers.BigNumber.from(validationResult.appVersion),
      decodedPolicies: validationResult.decodedPolicies,
    };
  } catch (error) {
    throw new Error(
      `Error getting on-chain policy parameters from Vincent contract using App Delegatee: ${appDelegateeAddress} and Agent Wallet PKP Token ID: ${agentWalletPkpTokenId} and Vincent Tool: ${toolIpfsCid}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
