import { createSmartAccountClient } from 'permissionless';
import { toSafeSmartAccount } from 'permissionless/accounts';
import { createPublicClient, encodeFunctionData, parseAbi } from 'viem';

import type { SafeSmartAccountInfo, SetupSmartAccountParams } from '../types';

import {
  createPimlicoPaymaster,
  entryPoint,
  getPimlicoTransport,
  getSafeTransport,
  safeVersion,
} from '../../environment/safe';

/**
 * Set up a Safe smart account for testing with Vincent abilities.
 *
 * This function:
 * 1. Creates a Safe (v1.4.1) smart account with the owner account
 * 2. Deploys the Safe on-chain
 * 3. Adds the PKP address as an additional owner with threshold 1
 * 4. This allows either the owner EOA or the Vincent PKP to sign UserOps
 *
 * @param params - Configuration parameters
 * @returns Safe smart account and client
 */
export async function setupSafeAccount({
  ownerAccount,
  permittedAddress,
  chain,
}: SetupSmartAccountParams): Promise<SafeSmartAccountInfo> {
  // Create transports - separate RPC for chain operations vs bundler operations
  const safeTransport = getSafeTransport(); // Regular RPC for eth_call, getCode, etc.
  const pimlicoTransport = getPimlicoTransport(); // Bundler RPC for UserOps

  // Create public client for the chain using regular RPC
  const publicClient = createPublicClient({
    chain,
    transport: safeTransport,
  });

  // Create Pimlico paymaster client
  const pimlicoClient = createPimlicoPaymaster();

  console.log('[setupSafeAccount] Creating Safe account...');

  // Create the Safe account with the owner
  const safeAccount = await toSafeSmartAccount({
    entryPoint,
    client: publicClient,
    owners: [ownerAccount],
    version: safeVersion,
  });

  console.log(`[setupSafeAccount] Safe Smart Account address: ${safeAccount.address}`);

  // Check if account is already deployed
  const accountCode = await publicClient.getCode({
    address: safeAccount.address,
  });
  const isDeployed = accountCode && accountCode !== '0x';

  // Create Safe client
  const safeClient = createSmartAccountClient({
    account: safeAccount,
    chain,
    bundlerTransport: pimlicoTransport,
    paymaster: pimlicoClient,
    userOperation: {
      estimateFeesPerGas: async () => {
        return (await pimlicoClient.getUserOperationGasPrice()).fast;
      },
    },
  });

  if (isDeployed) {
    console.log('[setupSafeAccount] ✅ Safe account already deployed');

    // Check if PKP is already an owner
    // For now, we'll assume if deployed, it's already configured
    // In production, you might want to read the Safe owners and verify
  } else {
    console.log('[setupSafeAccount] Deploying Safe and adding PKP as owner...');

    // Encode the call to add the PKP as an owner with threshold 1
    const addOwnerCallData = encodeFunctionData({
      abi: parseAbi(['function addOwnerWithThreshold(address owner, uint256 _threshold) public']),
      functionName: 'addOwnerWithThreshold',
      args: [permittedAddress, 1n],
    });

    // Deploy and configure Safe in a single transaction
    const txHash = await safeClient.sendTransaction({
      to: safeAccount.address,
      value: 0n,
      data: addOwnerCallData,
      chain,
    });

    console.log(`[setupSafeAccount] Setup transaction hash: ${txHash}`);

    // Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      confirmations: 2,
      hash: txHash,
    });

    console.log(
      `[setupSafeAccount] ✅ Safe deployed and PKP added as owner at block: ${receipt.blockNumber}`,
    );
  }

  console.log(`[setupSafeAccount] ✅ Safe account setup complete: ${safeAccount.address}\n`);

  return {
    account: safeAccount,
    client: safeClient,
  };
}
