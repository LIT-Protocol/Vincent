import type { Address, Chain } from 'viem';
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ethers } from 'ethers';
import { deriveSmartAccountIndex, getClient } from '@lit-protocol/vincent-contracts-sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';
import { createKernelAccount, createKernelAccountClient } from '@zerodev/sdk';

import {
  installAppViaVincentApi,
  isInstallAppResponseSponsored,
} from './vincent-api/installAppViaVincentApi';
import { completeAppInstallationViaVincentApi } from './vincent-api/completeAppInstallationViaVincentApi';
import { installAppUsingUserEoa } from './blockchain/installAppUsingUserEoa';
import { createKernelSmartAccount } from './smart-account/createKernelSmartAccount';
import { ensureWalletHasTokens } from './wallets/ensureWalletHasTokens';
import type { SmartAccountInfo } from './types';

export interface UserSmartAccountInfo {
  pkpSignerAddress: Address;
  agentSmartAccountAddress: Address;
  smartAccount: SmartAccountInfo;
  permitTxHash?: string;
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
  funderPrivateKey,
}: {
  vincentRegistryRpcUrl: string;
  vincentApiUrl: string;
  vincentRegistryChain: Chain;
  zerodevProjectId: string;
  userEoaPrivateKey: `0x${string}`;
  vincentAppId: number;
  funderPrivateKey: `0x${string}`;
}): Promise<UserSmartAccountInfo> {
  console.log('=== Setting up user smart account ===');

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

  // Step 2: Check if app is already installed (permitted) on-chain
  const provider = new ethers.providers.JsonRpcProvider(vincentRegistryRpcUrl);
  const wallet = new ethers.Wallet(userEoaPrivateKey, provider);
  const contractClient = getClient({ signer: wallet });

  let isAlreadyPermitted = false;
  try {
    const userAddress = await contractClient.getUserAddressForAgent({
      agentAddress: agentSmartAccountAddress as `0x${string}`,
    });
    isAlreadyPermitted = userAddress.toLowerCase() === userEoaAddress.toLowerCase();
  } catch (error) {
    // If call reverts with AgentNotRegistered, app is not permitted
    isAlreadyPermitted = false;
  }

  // Step 3: Complete app installation by submitting the permitAppVersion transaction (if not already permitted)
  let permitTxHash: string | undefined;

  if (isAlreadyPermitted) {
    console.log('=== App already permitted, skipping installation transaction ===');
  } else {
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
          to: installData.rawTransaction.to as `0x${string}`,
          data: installData.rawTransaction.data as `0x${string}`,
        },
      });
    }

    // Wait for the permit transaction to be confirmed
    await vincentRegistryPublicClient.waitForTransactionReceipt({
      hash: permitTxHash as `0x${string}`,
      confirmations: 2,
    });
  }

  // Step 4: Create local smart account client
  const smartAccount = await createKernelSmartAccount(
    userEoaPrivateKey,
    pkpSignerAddress as Address,
    deriveSmartAccountIndex(vincentAppId).toString(),
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

  // Step 5: Fund the smart account before deployment
  const funderAccount = privateKeyToAccount(funderPrivateKey);
  const funderWalletClient = createWalletClient({
    account: funderAccount,
    chain: vincentRegistryChain,
    transport: http(vincentRegistryRpcUrl),
  });

  console.log('=== Funding smart account for deployment ===');
  const { currentBalance, fundingTxHash } = await ensureWalletHasTokens({
    address: agentSmartAccountAddress as Address,
    funderWalletClient,
    publicClient: vincentRegistryPublicClient,
    minAmount: parseEther('0.002'),
  });

  console.table({
    'Smart Account Address': agentSmartAccountAddress,
    'Current Balance': formatEther(currentBalance),
    'Funding Transaction Hash': fundingTxHash,
  });

  // Step 6: Deploy the smart account if not already deployed
  const code = await vincentRegistryPublicClient.getCode({
    address: agentSmartAccountAddress as Address,
  });
  const isDeployed = code !== undefined && code !== '0x';

  let deploymentTxHash: string | undefined;

  if (!isDeployed) {
    try {
      console.log('=== Deploying smart account ===');

      // For deployment, we need to use the sudo mode (user's EOA), not the session key
      // The session key (PKP) cannot sign because it's on Chronicle Yellowstone
      // Create a sudo-mode kernel account client using the user's EOA
      const sudoValidator = await signerToEcdsaValidator(vincentRegistryPublicClient as any, {
        signer: userEoaWalletClient as any,
        entryPoint: getEntryPoint('0.7'),
        kernelVersion: KERNEL_V3_3,
      });
      const sudoKernelAccount = await createKernelAccount(vincentRegistryPublicClient as any, {
        entryPoint: getEntryPoint('0.7'),
        plugins: {
          sudo: sudoValidator,
        },
        kernelVersion: KERNEL_V3_3,
        index: BigInt(deriveSmartAccountIndex(vincentAppId).toString()),
      });

      const bundlerUrl = `https://rpc.zerodev.app/api/v3/${zerodevProjectId}/chain/${vincentRegistryChain.id}`;
      const sudoKernelClient = createKernelAccountClient({
        account: sudoKernelAccount,
        chain: vincentRegistryChain,
        bundlerTransport: http(bundlerUrl),
        client: vincentRegistryPublicClient,
      });

      // Send a UserOperation with a simple call to trigger deployment using sudo mode
      const userOpHash = await sudoKernelClient.sendUserOperation({
        callData: await sudoKernelAccount.encodeCalls([
          {
            to: '0x0000000000000000000000000000000000000000' as Address,
            value: 0n,
            data: '0x',
          },
        ]),
      });

      // Wait for the UserOperation to be included in a block
      const receipt = await sudoKernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      deploymentTxHash = receipt.receipt.transactionHash;

      // Wait for 2 block confirmations before verifying deployment
      await vincentRegistryPublicClient.waitForTransactionReceipt({
        hash: deploymentTxHash as `0x${string}`,
        confirmations: 2,
      });

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
  console.table({
    'PKP Signer Address': pkpSignerAddress,
    'Smart Account Address': agentSmartAccountAddress,
    ...(permitTxHash
      ? { 'Permit Transaction Hash': permitTxHash }
      : { 'Permit Status': 'Already permitted, skipped' }),
    'Smart Account Deployment Status': isDeployed ? 'Already Deployed' : 'Newly Deployed',
    ...(deploymentTxHash ? { 'Smart Account Deployment Transaction Hash': deploymentTxHash } : {}),
  });

  return {
    pkpSignerAddress: pkpSignerAddress as `0x${string}`,
    agentSmartAccountAddress: agentSmartAccountAddress as `0x${string}`,
    smartAccount,
    permitTxHash,
    deploymentTxHash,
  };
}
