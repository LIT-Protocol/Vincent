import type { Chain } from 'viem';

import { createZeroDevPaymasterClient } from '@zerodev/sdk';
import { KERNEL_V3_3, getEntryPoint } from '@zerodev/sdk/constants';
import { http } from 'viem';

const ZERODEV_RPC_URL = process.env.ZERODEV_RPC_URL as string | undefined;
if (!ZERODEV_RPC_URL) {
  throw new Error('Missing ZERODEV_RPC_URL env variable');
}

export const kernelVersion = KERNEL_V3_3;
export const entryPoint = getEntryPoint('0.7');
export const zerodevRpc = ZERODEV_RPC_URL;
export const zerodevTransport = http(zerodevRpc);

/**
 * Creates a ZeroDev paymaster client for the specified chain.
 * This should be called at runtime with the actual chain object.
 */
export function createZeroDevPaymaster(chain: Chain) {
  return createZeroDevPaymasterClient({
    chain,
    transport: zerodevTransport,
  });
}
