import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';

import { env } from '../env';

/**
 * Returns the appropriate chain configuration based on IS_DEVELOPMENT.
 * - Production: Base mainnet (chain ID 8453)
 * - Development: Base Sepolia (chain ID 84532)
 */
export function getBaseChain() {
  return env.IS_DEVELOPMENT ? baseSepolia : base;
}

/**
 * Creates a viem public client configured for the appropriate Base network.
 * Uses BASE_RPC_URL from environment (should point to Base Sepolia in development).
 */
export function getBasePublicClient() {
  const chain = getBaseChain();
  return createPublicClient({
    chain,
    transport: http(env.BASE_RPC_URL),
  });
}

/**
 * Returns the chain ID for the current environment.
 */
export function getBaseChainId(): number {
  return getBaseChain().id;
}
