import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

import { getEnv } from '../env';

const env = getEnv();

/**
 * Public client for Base mainnet.
 * Uses BASE_RPC_URL from environment.
 */
export const publicClient = createPublicClient({
  chain: base,
  transport: http(env.BASE_RPC_URL),
});
