/**
 * Contract interaction utilities for Vincent MCP
 *
 * This module provides utilities for interacting with the PubKeyRouter contract
 * on the Lit Network.
 *
 * @module contracts
 * @category Vincent MCP
 */

import { ethers } from 'ethers';

import type { LIT_NETWORK } from '@lit-protocol/constants';

import { LIT_RPC } from '@lit-protocol/constants';

/**
 * RPC endpoint for interacting with the Lit Network Contracts in Yellowstone
 */
export const rpc = LIT_RPC.CHRONICLE_YELLOWSTONE;

/**
 * Type representing the supported network for Vincent MCP
 * Currently only supports the Datil network
 */
export type Network = typeof LIT_NETWORK.Datil;

/**
 * ABI for the PubKeyRouter contract
 */
export const PUBKEY_ROUTER_ABI = [
  'function getEthAddress(uint256 tokenId) public view returns (address)',
  'function getPubkey(uint256 tokenId) public view returns (bytes memory)',
] as const;

/**
 * PubKeyRouter contract address
 */
export const PUBKEY_ROUTER_ADDRESS = '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475';

/**
 * Get a PubKeyRouter contract instance
 * @returns A contract instance for the PubKeyRouter
 */
export function getPubKeyRouterContract() {
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  return new ethers.Contract(PUBKEY_ROUTER_ADDRESS, PUBKEY_ROUTER_ABI, provider);
}
