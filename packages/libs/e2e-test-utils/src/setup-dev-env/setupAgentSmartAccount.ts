import type { Address, Chain } from 'viem';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { deriveSmartAccountIndex } from '@lit-protocol/vincent-contracts-sdk';

import { installApp, isInstallAppResponseSponsored } from './vincent-registry-api/installApp';
import { completeAppInstallation } from './vincent-registry-api/completeAppInstallation';
import { installAppUsingUserEoa } from './blockchain/installAppUsingUserEoa';
import { deploySmartAccount } from './smart-account/deploySmartAccount';
import { createPermissionApproval } from './smart-account/createPermissionApproval';

export interface AgentSmartAccountInfo {
  agentSignerAddress: Address;
  agentSmartAccountAddress: Address;
  deploymentTxHash?: string;
  serializedPermissionAccount: string;
}

export async function setupAgentSmartAccount({
  vincentRegistryRpcUrl,
  vincentApiUrl,
  vincentRegistryChain,
  zerodevProjectId,
  userEoaPrivateKey,
  vincentAppId,
  funderPrivateKey,
  fundAmountBeforeDeployment,
  sponsorGasForAppInstallation = false,
}: {
  vincentRegistryRpcUrl: string;
  vincentApiUrl: string;
  vincentRegistryChain: Chain;
  zerodevProjectId: string;
  userEoaPrivateKey: `0x${string}`;
  vincentAppId: number;
  funderPrivateKey: `0x${string}`;
  fundAmountBeforeDeployment?: bigint;
  sponsorGasForAppInstallation?: boolean;
}): Promise<AgentSmartAccountInfo> {
  console.log('=== Setting up agent smart account ===');

  const vincentRegistryPublicClient = createPublicClient({
    chain: vincentRegistryChain,
    transport: http(vincentRegistryRpcUrl),
  });

  const userEoaAccount = privateKeyToAccount(userEoaPrivateKey);

  const userEoaWalletClient = createWalletClient({
    account: userEoaAccount,
    chain: vincentRegistryChain,
    transport: http(vincentRegistryRpcUrl),
  });

  // Step 1: Install app via registry API to create PKP (or retrieve existing PKP if already installed)
  const installData = await installApp({
    vincentApiUrl,
    appId: vincentAppId,
    userEoaAddress: userEoaAccount.address,
    sponsorGas: sponsorGasForAppInstallation,
  });

  // Step 2: Determine if app is already permitted (either from API flag or by checking on-chain)
  // If alreadyInstalled is true, the API already confirmed the app is permitted on-chain
  const isAlreadyPermitted = installData.alreadyInstalled === true;

  // Step 4: Deploy the smart account (with only EOA validator)
  const { smartAccountAddress: deployedAddress, deploymentTxHash } = await deploySmartAccount({
    userEoaPrivateKey,
    accountIndexHash: deriveSmartAccountIndex(vincentAppId).toString(),
    targetChain: vincentRegistryChain,
    targetChainRpcUrl: vincentRegistryRpcUrl,
    zerodevProjectId,
    funderPrivateKey,
    fundAmountBeforeDeployment,
  });

  // Step 5: Create permission approval for the PKP session key
  const serializedPermissionAccount = await createPermissionApproval({
    userEoaPrivateKey,
    sessionKeyAddress: installData.agentSignerAddress as Address,
    accountIndexHash: deriveSmartAccountIndex(vincentAppId).toString(),
    targetChain: vincentRegistryChain,
    targetChainRpcUrl: vincentRegistryRpcUrl,
  });

  // Verify the deployed address matches what the API returned
  if (deployedAddress.toLowerCase() !== installData.agentSmartAccountAddress.toLowerCase()) {
    throw new Error(
      `Smart account address mismatch! Deployed: ${deployedAddress}, API: ${installData.agentSmartAccountAddress}`,
    );
  }

  // Step 3: Complete app installation by submitting the permitAppVersion transaction (if not already permitted)
  let permitTxHash: string | undefined;

  if (isAlreadyPermitted) {
    console.log('=== App already permitted, skipping installation transaction ===');
  } else {
    // App is not yet permitted on-chain, submit the permit transaction
    if (isInstallAppResponseSponsored(installData)) {
      // Gas-sponsored mode: Sign EIP-712 typed data and submit via Gelato relay
      permitTxHash = await completeAppInstallation({
        vincentApiUrl,
        userEoaPrivateKey,
        appId: vincentAppId,
        appInstallationDataToSign: installData.appInstallationDataToSign,
      });
    } else if ('rawTransaction' in installData) {
      // Direct mode: Submit transaction from user's EOA (user pays gas)
      permitTxHash = await installAppUsingUserEoa({
        userEoaWalletClient,
        vincentRegistryPublicClient,
        transactionData: {
          to: installData.rawTransaction.to as Address,
          data: installData.rawTransaction.data as `0x${string}`,
        },
      });
    } else {
      throw new Error('Invalid install response: missing transaction data');
    }

    // Wait for the permit transaction to be confirmed
    await vincentRegistryPublicClient.waitForTransactionReceipt({
      hash: permitTxHash as `0x${string}`,
      confirmations: 2,
    });
  }

  // Summary
  console.table({
    'PKP Signer Address': installData.agentSignerAddress,
    'Smart Account Address': installData.agentSmartAccountAddress,
    ...(permitTxHash
      ? { 'Permit Transaction Hash': permitTxHash }
      : { 'Permit Status': 'Already permitted, skipped' }),
    'Smart Account Deployment Status': deploymentTxHash ? 'Newly Deployed' : 'Already Deployed',
    ...(deploymentTxHash ? { 'Smart Account Deployment Transaction Hash': deploymentTxHash } : {}),
  });

  return {
    agentSmartAccountAddress: installData.agentSmartAccountAddress as Address,
    agentSignerAddress: installData.agentSignerAddress as Address,
    deploymentTxHash,
    serializedPermissionAccount,
  };
}
