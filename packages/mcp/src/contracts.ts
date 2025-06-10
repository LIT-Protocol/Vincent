/**
 * Contract interaction utilities for Vincent MCP
 *
 * This module provides utilities for interacting with the Vincent Diamond contract
 * on the Lit Network. It includes constants, contract ABIs, and functions for
 * fetching data from the contract.
 *
 * @module contracts
 * @category Vincent MCP
 */

import { LIT_NETWORK, LIT_RPC } from '@lit-protocol/constants';
import { ethers } from 'ethers';

import APP_VIEW_FACET_ABI from './abis/VincentAppViewFacet.abi.json';
import { env } from './env';

/**
 * RPC endpoint for interacting with the Lit Network Contracts in Yellowstone
 */
export const rpc = LIT_RPC.CHRONICLE_YELLOWSTONE;

/**
 * Type representing the supported network for Vincent MCP
 * Currently only supports the Datil network
 */
export type Network = typeof LIT_NETWORK.Datil;

const { VINCENT_DATIL_CONTRACT } = env;

/**
 * Mapping of network to Vincent Diamond contract address
 * Used to interact with the correct contract based on the network
 */
export const VINCENT_DIAMOND_ADDRESS: Record<Network, string> = {
  datil: VINCENT_DATIL_CONTRACT,
};

/**
 * ABIs for different facets of the Vincent Diamond contract
 * Each facet provides specific functionality of the contract
 */
export const FACET_ABIS = {
  AppView: APP_VIEW_FACET_ABI,
};

/**
 * Type representing the available facets of the Vincent Diamond contract
 * Used to specify which facet to interact with
 */
export type ContractFacet = keyof typeof FACET_ABIS;

/**
 * Get a contract instance for a specific facet of the Vincent Diamond
 * @param network The network to connect to
 * @param facet The contract facet to use
 * @returns A contract instance for the specified facet
 */
function getContract(network: Network, facet: ContractFacet) {
  const abi = FACET_ABIS[facet];

  const provider = new ethers.providers.JsonRpcProvider(rpc);
  return new ethers.Contract(VINCENT_DIAMOND_ADDRESS[network], abi, provider);
}

/**
 * Fetches the delegated agent PKP token IDs for a specific app version
 *
 * This function queries the Vincent AppView contract to get the PKP token IDs
 * that have delegated to a specific app version. These token IDs can be used
 * to identify the PKPs that are authorized to act as agents for the app.
 *
 * @param appId - The ID of the Vincent application
 * @param version - The version number of the application
 * @returns An array of BigNumber representing the delegated agent PKP token IDs
 *
 * @example
 * ```typescript
 * const tokenIds = await fetchDelegatedAgentPKPTokenIds(123, 1);
 * console.log(`App has ${tokenIds.length} delegated agent PKPs`);
 * ```
 */
export async function fetchDelegatedAgentPKPTokenIds(appId: number, version: number) {
  const contract = getContract(LIT_NETWORK.Datil, 'AppView');
  const appView = await contract.getAppVersion(appId, version);
  return appView.appVersion.delegatedAgentPkpTokenIds as ethers.BigNumber[];
}
