import type { Address, Chain } from 'viem';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import {
  installAppViaVincentApi,
  isInstallAppResponseSponsored,
} from './vincent-api/installAppViaVincentApi';
import { completeAppInstallationViaVincentApi } from './vincent-api/completeAppInstallationViaVincentApi';
import { installAppUsingUserEoa } from './blockchain/installAppUsingUserEoa';
import { createKernelSmartAccount } from './smart-account/createKernelSmartAccount';
import type { SmartAccountInfo } from './types';

export interface UserSmartAccountInfo {
  pkpSignerAddress: Address;
  agentSmartAccountAddress: Address;
  smartAccount: SmartAccountInfo;
  permitTxHash: string;
  deploymentTxHash?: string;
}

/**
 * Setup user's smart account with PKP session key.
 *
 * This handles:
 * - Installing app via registry API to mint PKP
 * - Submitting permitAppVersion transaction directly from user EOA (user pays gas)
 * - Creating local smart account client
 * - Deploying smart account on-chain (if not already deployed)
 *
 * By default, this uses direct transaction submission (sponsorGas: false) where the user's
 * EOA pays for gas. This is recommended for development environments.
 *
 * @param params Smart account setup parameters
 * @returns Smart account information including PKP signer and account addresses
 */
export async function setupUserSmartAccount({
  vincentRegistryRpcUrl,
  vincentApiUrl,
  vincentRegistryChain,
  zerodevProjectId,
  userEoaPrivateKey,
  vincentAppId,
  vincentAppAccountIndexHash,
}: {
  vincentRegistryRpcUrl: string;
  vincentApiUrl: string;
  vincentRegistryChain: Chain;
  zerodevProjectId: string;
  userEoaPrivateKey: `0x${string}`;
  vincentAppId: number;
  vincentAppAccountIndexHash: string;
}): Promise<UserSmartAccountInfo> {
  // Create viem clients
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

  const userEoaAddress = userEoaAccount.address;

  // Step 1: Install app via registry API to create PKP
  // Use direct submission mode (sponsorGas: false) by default for development
  const installData = await installAppViaVincentApi({
    vincentApiUrl,
    appId: vincentAppId,
    userEoaAddress,
    sponsorGas: false,
  });

  const pkpSignerAddress = installData.agentSignerAddress;
  const agentSmartAccountAddress = installData.agentSmartAccountAddress;

  // Step 2: Complete app installation by submitting the permitAppVersion transaction
  let permitTxHash: string;

  if (isInstallAppResponseSponsored(installData)) {
    // Gas-sponsored mode: Sign EIP-712 typed data and submit via Gelato relay
    permitTxHash = await completeAppInstallationViaVincentApi({
      vincentApiUrl,
      userEoaPrivateKey,
      appId: vincentAppId,
      appInstallationDataToSign: installData.appInstallationDataToSign,
    });
  } else {
    // Direct mode: Submit transaction from user's EOA (user pays gas)
    permitTxHash = await installAppUsingUserEoa({
      userEoaWalletClient,
      vincentRegistryPublicClient,
      transactionData: {
        to: installData.transaction.to as `0x${string}`,
        data: installData.transaction.data as `0x${string}`,
      },
    });
  }

  // Wait for the permit transaction to be confirmed
  await vincentRegistryPublicClient.waitForTransactionReceipt({
    hash: permitTxHash as `0x${string}`,
    confirmations: 2,
  });

  // Step 3: Create local smart account client
  const smartAccount = await createKernelSmartAccount(
    userEoaPrivateKey,
    pkpSignerAddress as Address,
    vincentAppAccountIndexHash,
    vincentRegistryChain,
    vincentRegistryRpcUrl,
    zerodevProjectId,
  );

  // Verify the local client's address matches what the API returned
  if (smartAccount.account.address.toLowerCase() !== agentSmartAccountAddress.toLowerCase()) {
    throw new Error(
      `Smart account address mismatch! Local: ${smartAccount.account.address}, API: ${agentSmartAccountAddress}`,
    );
  }

  // Step 4: Deploy the smart account if not already deployed
  const code = await vincentRegistryPublicClient.getCode({
    address: agentSmartAccountAddress as Address,
  });
  const isDeployed = code !== undefined && code !== '0x';

  let deploymentTxHash: string | undefined;

  if (!isDeployed) {
    try {
      // Send a UserOperation with a simple call to trigger deployment
      const userOpHash = await smartAccount.client.sendUserOperation({
        callData: await smartAccount.account.encodeCalls([
          {
            to: '0x0000000000000000000000000000000000000000' as Address,
            value: 0n,
            data: '0x',
          },
        ]),
      });

      // Wait for the UserOperation to be included in a block
      const receipt = await smartAccount.client.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      deploymentTxHash = receipt.receipt.transactionHash;

      // Verify deployment
      const deployedCode = await vincentRegistryPublicClient.getCode({
        address: agentSmartAccountAddress as Address,
      });
      if (!deployedCode || deployedCode === '0x') {
        throw new Error('Smart account deployment failed, code is still empty (0x)');
      }
    } catch (error) {
      console.error('Failed to deploy smart account:', error);
      throw error;
    }
  }

  // Summary
  console.table([
    { Name: 'PKP Signer Address', Value: pkpSignerAddress },
    { Name: 'Smart Account Address', Value: agentSmartAccountAddress },
    { Name: 'Permit Transaction Hash', Value: permitTxHash },
    {
      Name: 'Smart Account Deployment Status',
      Value: isDeployed ? 'Already Deployed' : 'Newly Deployed',
    },
    ...(deploymentTxHash
      ? [{ Name: 'Smart Account Deployment Transaction Hash', Value: deploymentTxHash }]
      : []),
  ]);

  return {
    pkpSignerAddress: pkpSignerAddress as `0x${string}`,
    agentSmartAccountAddress: agentSmartAccountAddress as `0x${string}`,
    smartAccount,
    permitTxHash,
    deploymentTxHash,
  };
}
