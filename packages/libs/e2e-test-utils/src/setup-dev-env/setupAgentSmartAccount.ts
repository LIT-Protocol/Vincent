import type { Address, Chain } from 'viem';

import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { deriveSmartAccountIndex } from '@lit-protocol/vincent-contracts-sdk';

import { installAppUsingUserEoa } from './blockchain/installAppUsingUserEoa';
import { createPermissionApproval } from './smart-account/createPermissionApproval';
import { deploySmartAccount } from './smart-account/deploySmartAccount';
import { completeAppInstallation } from './vincent-registry-api/completeAppInstallation';
import { installApp, isInstallAppResponseSponsored } from './vincent-registry-api/installApp';

export interface AgentSmartAccountInfo {
  agentSignerAddress: Address;
  agentSmartAccountAddress: Address;
  deploymentTxHash?: string;
  serializedPermissionAccount?: string;
  permitAppVersionTxHash?: string;
}

export async function setupAgentSmartAccount({
  vincentRegistryRpcUrl,
  vincentApiUrl,
  vincentRegistryChain,
  smartAccountChainRpcUrl,
  smartAccountChain,
  userEoaPrivateKey,
  vincentAppId,
}: {
  vincentRegistryRpcUrl: string;
  vincentApiUrl: string;
  vincentRegistryChain: Chain;
  smartAccountChainRpcUrl: string;
  smartAccountChain: Chain;
  userEoaPrivateKey: `0x${string}`;
  vincentAppId: number;
}): Promise<AgentSmartAccountInfo> {
  console.log('=== Setting up agent smart account ===');

  const vincentRegistryPublicClient = createPublicClient({
    chain: vincentRegistryChain,
    transport: http(vincentRegistryRpcUrl),
  });

  const smartAccountPublicClient = createPublicClient({
    chain: smartAccountChain,
    transport: http(smartAccountChainRpcUrl),
  });

  // Step 1: Install app via registry API to create PKP and get typed data to sign
  const installData = await installApp({
    vincentApiUrl,
    appId: vincentAppId,
    userEoaPrivateKey,
  });

  // Step 2: Check if app is already installed
  if (installData.alreadyInstalled === true) {
    console.log('=== App already installed, skipping installation ===');
    console.table({
      'PKP Signer Address': installData.agentSignerAddress,
      'Smart Account Address': installData.agentSmartAccountAddress,
      Status: 'Already installed',
    });

    return {
      agentSmartAccountAddress: installData.agentSmartAccountAddress as Address,
      agentSignerAddress: installData.agentSignerAddress as Address,
    };
  }

  // Step 3: Sign typed data and complete installation via API (gas-sponsored)
  const result = await completeAppInstallation({
    vincentApiUrl,
    userEoaPrivateKey,
    appId: vincentAppId,
    appInstallationDataToSign: installData.appInstallationDataToSign,
    agentSmartAccountDeploymentDataToSign: installData.agentSmartAccountDeploymentDataToSign,
    sessionKeyApprovalDataToSign: installData.sessionKeyApprovalDataToSign,
    agentSignerAddress: installData.agentSignerAddress,
  });

  const deploymentTxHash = result.deployAgentSmartAccountTransactionHash;
  const serializedPermissionAccount = result.serializedPermissionAccount;
  const permitAppVersionTxHash = result.completeAppInstallationTransactionHash;

  // Wait for all transactions to be confirmed
  // Note: Session key approval is NOT a transaction - it's just serialization
  // The permission plugin will be enabled when the PKP makes its first transaction
  console.log('[setupAgentSmartAccount] Waiting for transaction confirmations');
  await Promise.all([
    // Smart account deployment happens on smart account chain
    smartAccountPublicClient.waitForTransactionReceipt({
      hash: deploymentTxHash as `0x${string}`,
      confirmations: 2,
    }),
    // Permit app version happens on Vincent Registry chain
    vincentRegistryPublicClient.waitForTransactionReceipt({
      hash: permitAppVersionTxHash as `0x${string}`,
      confirmations: 2,
    }),
  ]);

  console.table({
    'PKP Signer Address': installData.agentSignerAddress,
    'Smart Account Address': installData.agentSmartAccountAddress,
    'Smart Account Deployment Tx': deploymentTxHash,
    'Serialized Permission Account': serializedPermissionAccount.substring(0, 50) + '...',
    'Permit App Version Tx': permitAppVersionTxHash,
  });

  return {
    agentSmartAccountAddress: installData.agentSmartAccountAddress as Address,
    agentSignerAddress: installData.agentSignerAddress as Address,
    deploymentTxHash,
    serializedPermissionAccount,
    permitAppVersionTxHash,
  };
}
