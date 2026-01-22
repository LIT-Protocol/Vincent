import type { Address } from 'viem';
import { getKernelAddressFromECDSA } from '@zerodev/ecdsa-validator';
import { KERNEL_V3_1, getEntryPoint } from '@zerodev/sdk/constants';

/**
 * Derive the agent smart account address for a given EOA address.
 *
 * This uses the ZeroDev SDK to deterministically compute the smart account address
 * based on the EOA address and account index hash.
 *
 * @param eoaAddress - The EOA (Externally Owned Account) address
 * @param accountIndexHash - The account index hash from app registration
 * @param publicClient - Viem public client
 * @returns The derived agent smart account address
 *
 * @example
 * ```typescript
 * const agentAddress = await deriveAgentAddress(
 *   '0x123...',
 *   '0xabc...',
 *   publicClient,
 * );
 * ```
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
