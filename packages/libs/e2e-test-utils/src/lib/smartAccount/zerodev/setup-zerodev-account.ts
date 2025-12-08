import type { Address, Chain, PrivateKeyAccount } from 'viem';

import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { toInitConfig, serializePermissionAccount } from '@zerodev/permissions';
import { createKernelAccount, createKernelAccountClient } from '@zerodev/sdk';
import { createPublicClient, zeroAddress } from 'viem';

import type { ZerodevSmartAccountInfo } from '../types';

import {
  kernelVersion,
  entryPoint,
  createZeroDevPaymaster,
  getZerodevTransport,
} from '../../environment/zerodev';
import { getPermissionEmptyValidator } from './get-permission-empty-validator';

export interface SetupSmartAccountParams {
  ownerAccount: PrivateKeyAccount;
  permittedAddress: Address;
  chain: Chain;
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
export async function setupZerodevAccount({
  ownerAccount,
  permittedAddress,
  chain,
}: SetupSmartAccountParams): Promise<ZerodevSmartAccountInfo> {
  // Create public client for the chain using ZeroDev RPC
  // This ensures validator configuration is consistent with the bundler
  const zerodevTransport = getZerodevTransport();
  const publicClient = createPublicClient({
    chain,
    transport: zerodevTransport,
  });

  // Create ZeroDev paymaster using centralized factory
  const zerodevPaymaster = createZeroDevPaymaster(chain);

  console.log('[setupZerodevAccount] Creating validators...');

  // Owner validator (actual signer)
  const ownerValidator = await signerToEcdsaValidator(publicClient, {
    entryPoint,
    kernelVersion,
    signer: ownerAccount,
  });

  // Permission validator (empty validator for PKP address)
  const permissionValidator = await getPermissionEmptyValidator(publicClient, permittedAddress);

  console.log('[setupZerodevAccount] Creating Kernel account...');

  // Create smart account with both validators (matching reference implementation)
  const ownerKernelAccount = await createKernelAccount(publicClient, {
    entryPoint,
    kernelVersion,
    plugins: {
      sudo: ownerValidator,
    },
    initConfig: await toInitConfig(permissionValidator),
  });

  console.log(`[setupZerodevAccount] Smart account address: ${ownerKernelAccount.address}`);

  // Check if account is already deployed
  const accountCode = await publicClient.getCode({
    address: ownerKernelAccount.address,
  });
  const isDeployed = accountCode && accountCode !== '0x';

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

  if (isDeployed) {
    console.log('[setupZerodevAccount] ✅ Smart account already deployed');
  } else {
    console.log('[setupZerodevAccount] Deploying Smart Account with empty UserOp...');

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

    console.log(`[setupZerodevAccount] Deployment UserOp hash: ${deployUserOpHash}`);

    // Wait for deployment
    const deployUserOpReceipt = await ownerKernelClient.waitForUserOperationReceipt({
      hash: deployUserOpHash,
    });

    console.log(
      `[setupZerodevAccount] ✅ Smart Account deployed at tx: ${deployUserOpReceipt.receipt.transactionHash}`,
    );
  }

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

  console.log(
    `[setupZerodevAccount] ✅ Smart account setup complete: ${ownerKernelAccount.address}\n`,
  );

  return {
    account: ownerKernelAccount,
    serializedPermissionAccount,
  };
}
