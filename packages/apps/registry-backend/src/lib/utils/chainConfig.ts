import { createPublicClient, http } from 'viem';
import { base, baseSepolia } from 'viem/chains';

import { env } from '../../env';

/**
 * Supported network identifiers mapped to their chain configurations
 */
export const SUPPORTED_NETWORKS = {
  'base-mainnet': {
    chainId: 8453,
    chain: base,
    alchemySubdomain: 'base-mainnet',
  },
  'base-sepolia': {
    chainId: 84532,
    chain: baseSepolia,
    alchemySubdomain: 'base-sepolia',
  },
} as const;

export type SupportedNetwork = keyof typeof SUPPORTED_NETWORKS;

/**
 * Returns the chain configuration for a given network identifier
 */
export function getChainForNetwork(network: string) {
  const config = SUPPORTED_NETWORKS[network as SupportedNetwork];
  if (!config) {
    throw new Error(
      `Unsupported network: ${network}. Supported: ${Object.keys(SUPPORTED_NETWORKS).join(', ')}`,
    );
  }
  return config;
}

/**
 * Returns the Alchemy RPC URL for a given network
 */
export function getRpcUrlForNetwork(network: string): string {
  const config = getChainForNetwork(network);
  return `https://${config.alchemySubdomain}.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`;
}

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
 * Uses SMART_ACCOUNT_CHAIN_RPC_URL from environment.
 */
export function getBasePublicClient() {
  const chain = getBaseChain();
  return createPublicClient({
    chain,
    transport: http(env.SMART_ACCOUNT_CHAIN_RPC_URL),
  });
}

/**
 * Returns the chain ID for the current environment.
 */
export function getBaseChainId(): number {
  return getBaseChain().id;
}
