// src/lib/policyCore/policyParameters/getOnchainPolicyParams.ts

import { ethers } from 'ethers';

import type {
  AbilityPolicyParameterData,
  ValidateAbilityExecutionAndGetPoliciesResult,
} from '@lit-protocol/vincent-contracts-sdk';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import { bigintReplacer } from '../../utils';

export const getDecodedPolicyParams = async ({
  decodedPolicies,
  policyIpfsCid,
}: {
  decodedPolicies: AbilityPolicyParameterData;
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
  abilityIpfsCid,
}: {
  delegationRpcUrl: string;
  appDelegateeAddress: string;
  agentWalletPkpEthAddress: string;
  abilityIpfsCid: string;
}): Promise<{
  appId: ethers.BigNumber;
  appVersion: ethers.BigNumber;
  decodedPolicies: AbilityPolicyParameterData;
}> => {
  console.log('getPoliciesAndAppVersion', {
    delegationRpcUrl,
    appDelegateeAddress,
    agentWalletPkpEthAddress,
    abilityIpfsCid,
  });

  try {
    // Create a signer using the delegationRpcUrl
    const signer = ethers.Wallet.createRandom().connect(
      new ethers.providers.StaticJsonRpcProvider(delegationRpcUrl),
    );

    const contractClient = getClient({
      signer,
    });

    // Use the contracts-sdk to validate ability execution and get policies
    const validationResult: ValidateAbilityExecutionAndGetPoliciesResult =
      await contractClient.validateAbilityExecutionAndGetPolicies({
        delegateeAddress: appDelegateeAddress,
        pkpEthAddress: agentWalletPkpEthAddress,
        abilityIpfsCid: abilityIpfsCid,
      });

    // We exit early here because !validationResult.isPermitted means appDelegateeAddress
    // is not permitted to execute abilityIpfsCid for the Vincent App on behalf of the agentWalletPkpTokenId
    // and no further processing is needed
    if (!validationResult.isPermitted) {
      throw new Error(
        `App Delegatee: ${appDelegateeAddress} is not permitted to execute Vincent Ability: ${abilityIpfsCid} for App ID: ${validationResult.appId} App Version: ${validationResult.appVersion} using Agent Wallet PKP Address: ${agentWalletPkpEthAddress}`,
      );
    }

    return {
      appId: ethers.BigNumber.from(validationResult.appId),
      appVersion: ethers.BigNumber.from(validationResult.appVersion),
      decodedPolicies: validationResult.decodedPolicies,
    };
  } catch (error) {
    throw new Error(
      `Error getting on-chain policy parameters from Vincent contract using App Delegatee: ${appDelegateeAddress} and Agent Wallet PKP Address: ${agentWalletPkpEthAddress} and Vincent Ability: ${abilityIpfsCid}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
