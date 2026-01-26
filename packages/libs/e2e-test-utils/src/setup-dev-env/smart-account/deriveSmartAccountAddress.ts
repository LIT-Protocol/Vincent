import type { Address } from 'viem';
import { getKernelAddressFromECDSA } from '@zerodev/ecdsa-validator';
import { KERNEL_V3_1, getEntryPoint } from '@zerodev/sdk/constants';

export async function deriveSmartAccountAddress(
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
