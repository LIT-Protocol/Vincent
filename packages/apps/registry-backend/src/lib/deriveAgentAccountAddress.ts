import type { PublicClient } from 'viem';

import { createKernelAccount, addressToEmptyAccount } from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';

import { deriveSmartAccountIndex } from '@lit-protocol/vincent-contracts-sdk';

export async function deriveAgentAccountAddress({
  publicClient,
  userControllerAddress,
  appId,
}: {
  publicClient: PublicClient;
  userControllerAddress: `0x${string}`;
  appId: number;
}): Promise<`0x${string}`> {
  const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    signer: addressToEmptyAccount(userControllerAddress),
    kernelVersion: KERNEL_V3_3,
  });

  const kernelAccount = await createKernelAccount(publicClient, {
    entryPoint: getEntryPoint('0.7'),
    plugins: {
      sudo: ecdsaValidator,
    },
    kernelVersion: KERNEL_V3_3,
    index: deriveSmartAccountIndex(appId),
  });

  return kernelAccount.address;
}
