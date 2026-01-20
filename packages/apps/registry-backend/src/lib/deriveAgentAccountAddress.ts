import type { PublicClient } from 'viem';

import { createKernelAccount, addressToEmptyAccount } from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { toSudoPolicy } from '@zerodev/permissions/policies';
import { toPermissionValidator, toInitConfig } from '@zerodev/permissions';

import { deriveSmartAccountIndex } from '@lit-protocol/vincent-contracts-sdk';

/**
 * Derives the agent smart account address using the same pattern as deploySmartAccountToChain.
 * This calculates the counterfactual address with both ECDSA sudo validator and permission validator
 * installed via initConfig pattern.
 *
 * IMPORTANT: This MUST match the exact logic in deploySmartAccountToChain.ts to ensure
 * the registry backend calculates the same address as the deployed smart account.
 *
 * Reference: zerodev-examples/session-keys/install-permissions-with-init-config.ts shows
 * that we can use addressToEmptyAccount for the owner signer when only calculating the address.
 *
 * @param publicClient - Viem public client for the target chain
 * @param userControllerAddress - The EOA address that controls the smart account
 * @param agentSignerAddress - The PKP address that will be the permission validator
 * @param appId - The Vincent app ID
 * @returns The derived agent smart account address
 */
export async function deriveAgentAccountAddress({
  publicClient,
  userControllerAddress,
  agentSignerAddress,
  appId,
}: {
  publicClient: PublicClient;
  userControllerAddress: `0x${string}`;
  agentSignerAddress: `0x${string}`;
  appId: number;
}): Promise<`0x${string}`> {
  // Use empty account for address calculation (no actual private key needed)
  // Reference: zerodev-examples/session-keys/install-permissions-with-init-config.ts:31-32
  // "Notice you don't need the actual owner signer here, only the address"
  const userEmptyAccount = addressToEmptyAccount(userControllerAddress);

  // Create ECDSA validator for the user (sudo)
  // This matches deploySmartAccountToChain.ts:89-93
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: userEmptyAccount,
    kernelVersion: KERNEL_V3_3,
  });

  // Create permission validator for PKP
  // This matches deploySmartAccountToChain.ts:96-105
  const agentSignerECDSA = await toECDSASigner({
    signer: addressToEmptyAccount(agentSignerAddress),
  });

  const agentSignerPermissionPlugin = await toPermissionValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: agentSignerECDSA,
    policies: [toSudoPolicy({})],
    kernelVersion: KERNEL_V3_3,
  });

  // Create kernel account with sudo and permission validator in initConfig
  // This matches deploySmartAccountToChain.ts:110-118
  const kernelAccount = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    plugins: {
      sudo: ecdsaValidator,
    },
    kernelVersion: KERNEL_V3_3,
    index: deriveSmartAccountIndex(appId),
    initConfig: await toInitConfig(agentSignerPermissionPlugin),
  });

  return kernelAccount.address;
}
