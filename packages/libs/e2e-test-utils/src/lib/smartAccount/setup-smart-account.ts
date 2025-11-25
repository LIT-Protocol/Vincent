import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { toInitConfig, serializePermissionAccount } from '@zerodev/permissions';
import { createKernelAccount, createKernelAccountClient } from '@zerodev/sdk';
import {
  type Address,
  type Chain,
  type PrivateKeyAccount,
  createPublicClient,
  http,
  zeroAddress,
} from 'viem';

import { kernelVersion, entryPoint, createZeroDevPaymaster } from '../environment/zerodev';
import { getPermissionEmptyValidator } from './get-permission-empty-validator';
import type { SmartAccountInfo } from './types';

export interface SetupSmartAccountParams {
  ownerAccount: PrivateKeyAccount;
  permittedAddress: Address;
  chain: Chain;
  zerodevRpcUrl: string;
}

/**
 * Set up a ZeroDev Kernel smart account for testing with Vincent abilities.
 *
 * This function:
 * 1. Creates an owner validator using the owner's private key
 * 2. Creates a permission validator for the PKP address (empty validator)
 * 3. Deploys the Kernel smart account on-chain
 * 4. Generates a serialized permission account for signing UserOps
 *
 * @param params - Configuration parameters
 * @returns Smart account address and serialized permission account
 */
export async function setupSmartAccount({
  ownerAccount,
  permittedAddress,
  chain,
  zerodevRpcUrl,
}: SetupSmartAccountParams): Promise<SmartAccountInfo> {
  // Create public client for the chain using ZeroDev RPC
  // This ensures validator configuration is consistent with the bundler
  const zerodevTransport = http(zerodevRpcUrl);
  const publicClient = createPublicClient({
    chain,
    transport: zerodevTransport,
  });

  // Create ZeroDev paymaster using centralized factory
  const zerodevPaymaster = createZeroDevPaymaster(chain);

  console.log('[setupSmartAccount] Creating validators...');

  // Owner validator (actual signer)
  const ownerValidator = await signerToEcdsaValidator(publicClient, {
    entryPoint,
    kernelVersion,
    signer: ownerAccount,
  });

  // Permission validator (empty validator for PKP address)
  const permissionValidator = await getPermissionEmptyValidator(publicClient, permittedAddress);

  console.log('[setupSmartAccount] Creating Kernel account...');

  // Create smart account with both validators (matching reference implementation)
  const ownerKernelAccount = await createKernelAccount(publicClient, {
    entryPoint,
    kernelVersion,
    plugins: {
      sudo: ownerValidator,
    },
    initConfig: await toInitConfig(permissionValidator),
  });

  console.log(`[setupSmartAccount] Smart account address: ${ownerKernelAccount.address}`);

  // Check if account is already deployed
  const accountCode = await publicClient.getCode({
    address: ownerKernelAccount.address,
  });
  const isDeployed = accountCode && accountCode !== '0x';

  if (isDeployed) {
    console.log('[setupSmartAccount] ✅ Smart account already deployed, skipping deployment...');
  }

  // Create kernel client with paymaster
  const ownerKernelClient = createKernelAccountClient({
    chain,
    account: ownerKernelAccount,
    bundlerTransport: zerodevTransport,
    client: publicClient,
    paymaster: {
      getPaymasterData(userOperation) {
        return zerodevPaymaster.sponsorUserOperation({ userOperation });
      },
    },
  });

  if (!isDeployed) {
    console.log('[setupSmartAccount] Deploying smart account with empty UserOp...');

    // Deploy smart account with an empty user operation
    const deployUserOpHash = await ownerKernelClient.sendUserOperation({
      callData: await ownerKernelAccount.encodeCalls([
        {
          to: zeroAddress,
          value: BigInt(0),
          data: '0x',
        },
      ]),
    });

    console.log(`[setupSmartAccount] Deployment UserOp hash: ${deployUserOpHash}`);

    // Wait for deployment
    const deployUserOpReceipt = await ownerKernelClient.waitForUserOperationReceipt({
      hash: deployUserOpHash,
    });

    console.log(
      `[setupSmartAccount] Deployed at tx: ${deployUserOpReceipt.receipt.transactionHash}`,
    );
  }

  // Generate serialized permission account for signing
  console.log('[setupSmartAccount] Generating serialized permission account...');

  const permissionKernelAccountToSerialize = await createKernelAccount(publicClient, {
    entryPoint,
    kernelVersion,
    address: ownerKernelAccount.address,
    plugins: {
      sudo: ownerValidator,
      regular: permissionValidator,
    },
  });

  const serializedPermissionAccount = await serializePermissionAccount(
    permissionKernelAccountToSerialize,
  );

  console.log('[setupSmartAccount] ✅ Smart account setup complete\n');

  return {
    address: ownerKernelAccount.address,
    serializedPermissionAccount,
  };
}
