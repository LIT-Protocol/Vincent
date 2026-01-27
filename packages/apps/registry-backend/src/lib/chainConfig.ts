import { createPublicClient, http, type Chain } from 'viem';
import { base, baseSepolia } from 'viem/chains';

import { env } from '../env';

/**
 * Returns the Vincent Registry chain configuration based on VINCENT_REGISTRY_CHAIN_ID.
 * This is where the Vincent Diamond contract is deployed.
 */
export function getVincentRegistryChain(): Chain {
  const chainId = env.VINCENT_REGISTRY_CHAIN_ID;

  if (chainId === base.id) {
    return base;
  } else if (chainId === baseSepolia.id) {
    return baseSepolia;
  }

  throw new Error(`Unsupported Vincent Registry chain ID: ${chainId}`);
}

/**
 * Creates a viem public client configured for the Vincent Registry chain.
 * Uses VINCENT_REGISTRY_RPC_URL from environment.
 */
export function getVincentRegistryPublicClient() {
  const chain = getVincentRegistryChain();
  return createPublicClient({
    chain,
    transport: http(env.VINCENT_REGISTRY_RPC_URL),
  });
}

/**
 * Returns the chain ID for the Vincent Registry chain.
 */
export function getVincentRegistryChainId(): number {
  return env.VINCENT_REGISTRY_CHAIN_ID;
}

/**
 * Returns the smart account chain configuration based on SMART_ACCOUNT_CHAIN_ID.
 * This is where smart accounts are deployed and operated.
 */
export function getSmartAccountChain(): Chain {
  const chainId = env.SMART_ACCOUNT_CHAIN_ID;

  if (chainId === base.id) {
    return base;
  } else if (chainId === baseSepolia.id) {
    return baseSepolia;
  }

  throw new Error(`Unsupported smart account chain ID: ${chainId}`);
}

/**
 * Creates a viem public client configured for the smart account chain.
 * Uses SMART_ACCOUNT_CHAIN_RPC_URL from environment.
 */
export function getSmartAccountPublicClient() {
  const chain = getSmartAccountChain();
  return createPublicClient({
    chain,
    transport: http(env.SMART_ACCOUNT_CHAIN_RPC_URL),
  });
}

/**
 * Returns the chain ID for the smart account chain.
 */
export function getSmartAccountChainId(): number {
  return env.SMART_ACCOUNT_CHAIN_ID;
}
