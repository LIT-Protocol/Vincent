import { createPublicClient, createWalletClient, http, type Address, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createKernelAccount, addressToEmptyAccount } from '@zerodev/sdk';
import { signerToEcdsaValidator, getKernelAddressFromECDSA } from '@zerodev/ecdsa-validator';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { toPermissionValidator, serializePermissionAccount } from '@zerodev/permissions';
import { KERNEL_V3_1, getEntryPoint } from '@zerodev/sdk/constants';

import type { SmartAccountInfo } from './types';

/**
 * Derive the agent smart account address for a given EOA address
 */
export async function deriveAgentAddress(
  eoaAddress: Address,
  accountIndexHash: string,
  publicClient: any,
): Promise<Address> {
  const agentAddress = await getKernelAddressFromECDSA({
    entryPoint: getEntryPoint('0.7'),
    kernelVersion: KERNEL_V3_1,
    eoaAddress,
    index: BigInt(accountIndexHash),
    publicClient: publicClient as any,
  });

  return agentAddress as Address;
}

/**
 * Create a kernel smart account with session key permissions
 */
export async function createKernelSmartAccount(
  userPrivateKey: string,
  agentSignerAddress: Address,
  accountIndexHash: string,
  chain: Chain,
  rpcUrl: string,
): Promise<SmartAccountInfo> {
  console.log('=== Creating Kernel Smart Account ===');

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const userAccount = privateKeyToAccount(userPrivateKey as `0x\${string}`);

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

  console.log('Smart Account Address:', accountAddress);
  console.log('Session Key Approval Created');
  console.log('Agent Signer Address:', agentSignerAddress);

  return {
    account: kernelAccount,
    approval,
  };
}
