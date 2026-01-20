import type { Address, Chain } from 'viem';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ethers } from 'ethers';
import { deriveSmartAccountIndex, getClient } from '@lit-protocol/vincent-contracts-sdk';

import {
  installAppViaVincentApi,
  isInstallAppResponseSponsored,
} from './vincent-api/installAppViaVincentApi';
import { completeAppInstallationViaVincentApi } from './vincent-api/completeAppInstallationViaVincentApi';
import { installAppUsingUserEoa } from './blockchain/installAppUsingUserEoa';
import { createKernelSmartAccount } from './smart-account/createKernelSmartAccount';
import { deploySmartAccountToChain } from './smart-account/deploySmartAccountToChain';
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
 * @param params.fundAmountBeforeDeployment - Optional amount to fund the smart account before deployment (in wei). If not provided, funding step is skipped.
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
  fundAmountBeforeDeployment,
}: {
  vincentRegistryRpcUrl: string;
  vincentApiUrl: string;
  vincentRegistryChain: Chain;
  zerodevProjectId: string;
  userEoaPrivateKey: `0x${string}`;
  vincentAppId: number;
  funderPrivateKey: `0x${string}`;
  fundAmountBeforeDeployment?: bigint;
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
    isAlreadyPermitted = userAddress?.toLowerCase() === userEoaAddress.toLowerCase();
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

  // Step 4: Deploy the smart account with permission plugin enabled
  const { smartAccountAddress: deployedAddress, deploymentTxHash } =
    await deploySmartAccountToChain({
      userEoaPrivateKey,
      agentSignerAddress: pkpSignerAddress as Address,
      accountIndexHash: deriveSmartAccountIndex(vincentAppId).toString(),
      targetChain: vincentRegistryChain,
      targetChainRpcUrl: vincentRegistryRpcUrl,
      zerodevProjectId,
      funderPrivateKey,
      fundAmountBeforeDeployment,
    });

  // Verify the deployed address matches what the API returned
  if (deployedAddress.toLowerCase() !== agentSmartAccountAddress.toLowerCase()) {
    throw new Error(
      `Smart account address mismatch! Deployed: ${deployedAddress}, API: ${agentSmartAccountAddress}`,
    );
  }

  // Step 5: Create local smart account client using the serialized permission account
  const smartAccount = await createKernelSmartAccount(
    userEoaPrivateKey,
    pkpSignerAddress as Address,
    deriveSmartAccountIndex(vincentAppId).toString(),
    vincentRegistryChain,
    vincentRegistryRpcUrl,
    zerodevProjectId,
  );

  // Summary
  console.table({
    'PKP Signer Address': pkpSignerAddress,
    'Smart Account Address': agentSmartAccountAddress,
    ...(permitTxHash
      ? { 'Permit Transaction Hash': permitTxHash }
      : { 'Permit Status': 'Already permitted, skipped' }),
    'Smart Account Deployment Status': deploymentTxHash ? 'Newly Deployed' : 'Already Deployed',
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
