import { createPublicClient, createWalletClient, http, type Address, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  createKernelAccount,
  createKernelAccountClient,
  addressToEmptyAccount,
} from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { toPermissionValidator, serializePermissionAccount } from '@zerodev/permissions';
import { KERNEL_V3_1, getEntryPoint } from '@zerodev/sdk/constants';

import type { SmartAccountInfo } from '../types';

/**
 * Create a kernel smart account with session key permissions.
 *
 * This function:
 * 1. Creates ECDSA validator for the user (owner)
 * 2. Creates agent signer (session key) as an empty account
 * 3. Creates permission plugin with sudo policy for the agent
 * 4. Creates kernel account with both sudo and regular validators
 * 5. Creates kernel account client with bundler
 *
 * @param userPrivateKey - User's EOA private key
 * @param agentSignerAddress - PKP address to use as session key
 * @param accountIndexHash - Account index hash from app registration
 * @param chain - Chain configuration
 * @param rpcUrl - RPC URL for the chain
 * @param zerodevProjectId - ZeroDev project ID
 * @returns Smart account information including account, client, and approval
 *
 * @example
 * ```typescript
 * const smartAccount = await createKernelSmartAccount(
 *   '0x...',
 *   '0x...' as Address,
 *   'accountIndexHash',
 *   baseMainnet,
 *   'https://rpc.base.org',
 *   'zerodev-project-id',
 * );
 * ```
 */
export async function createKernelSmartAccount(
  userPrivateKey: string,
  agentSignerAddress: Address,
  accountIndexHash: string,
  chain: Chain,
  rpcUrl: string,
  zerodevProjectId: string,
): Promise<SmartAccountInfo> {
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const userAccount = privateKeyToAccount(userPrivateKey as `0x${string}`);

  const walletClient = createWalletClient({
    account: userAccount,
    chain,
    transport: http(rpcUrl),
  });

  // Create ECDSA validator for the user (owner)
  const ecdsaValidator = await signerToEcdsaValidator(publicClient as any, {
    signer: walletClient as any,
    entryPoint: getEntryPoint('0.7'),
    kernelVersion: KERNEL_V3_1,
  });

  // Create agent signer (session key)
  const agentSigner = addressToEmptyAccount(agentSignerAddress);
  const agentSignerECDSA = await toECDSASigner({ signer: agentSigner });

  // Create permission plugin with sudo policy
  const permissionPlugin = await toPermissionValidator(publicClient as any, {
    entryPoint: getEntryPoint('0.7'),
    signer: agentSignerECDSA,
    policies: [toSudoPolicy({})],
    kernelVersion: KERNEL_V3_1,
  });

  // Create kernel account
  const kernelAccount = await createKernelAccount(publicClient as any, {
    entryPoint: getEntryPoint('0.7'),
    plugins: {
      sudo: ecdsaValidator,
      regular: permissionPlugin,
    },
    kernelVersion: KERNEL_V3_1,
    index: BigInt(accountIndexHash),
  });

  const accountAddress = kernelAccount.address;
  const approval = await serializePermissionAccount(kernelAccount);

  // Create ZeroDev bundler URL
  // Using v3 API for Kernel v3.1 (requires chain ID in path)
  const bundlerUrl = `https://rpc.zerodev.app/api/v3/${zerodevProjectId}/chain/${chain.id}`;

  // Create kernel account client with bundler
  const kernelClient = createKernelAccountClient({
    account: kernelAccount,
    chain,
    bundlerTransport: http(bundlerUrl),
    client: publicClient,
  });

  console.table([
    { Name: 'Smart Account Address', Value: accountAddress },
    { Name: 'Agent Signer Address', Value: agentSignerAddress },
    { Name: 'Bundler URL', Value: bundlerUrl },
  ]);

  return {
    account: kernelAccount,
    client: kernelClient,
    publicClient,
    walletClient,
    approval,
  };
}
