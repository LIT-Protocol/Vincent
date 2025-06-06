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

/**
 * RPC endpoint for interacting with the Lit Network Contracts in Yellowstone
 */
export const rpc = LIT_RPC.CHRONICLE_YELLOWSTONE;

/**
 * Type representing the supported network for Vincent MCP
 * Currently only supports the Datil network
 */
export type Network = typeof LIT_NETWORK.Datil;

export const PUBKEY_ROUTER_ABI = [
  'function getEthAddress(uint256 tokenId) public view returns (address)',
  'function getPubkey(uint256 tokenId) public view returns (bytes memory)',
] as const;

export const APP_VIEW_ABI = [
  `function getAppVersion(
      uint256 tokenId,
      uint256 version
    ) view returns (
      (
        uint256 id,
        string name,
        string description,
        bool isDeleted,
        uint8 deploymentStatus,
        address manager,
        uint256 latestVersion,
        address[] delegatees,
        string[] authorizedRedirectUris
      ) app,
      (
        uint256 version,
        bool enabled,
        uint256[] delegatedAgentPkpTokenIds,
        (
          string toolIpfsCid,
          (
            string policyIpfsCid,
            string[] parameterNames,
            uint8[] parameterTypes
          )[] policies
        )[] tools
      ) appVersion
    )`,
] as const;

/**
 * ABIs for different facets of the Vincent Diamond contract
 * Each facet provides specific functionality of the contract
 */
export const FACET_ABIS = {
  AppView: APP_VIEW_ABI,
  PubKeyRouter: PUBKEY_ROUTER_ABI,
};

/**
 * Type representing the available facets of the Vincent Diamond contract
 * Used to specify which facet to interact with
 */
export type ContractFacet = keyof typeof FACET_ABIS;

/**
 * Vincent diamond address. This is the main address that redirects to any other contract involved in Vincent system
 * If included in the diamond, the contract should be accessed through it to guarantee the last version is being used
 */
const VINCENT_DIAMOND_ADDRESSES = {
  [LIT_NETWORK.Datil]: '0x78Cd1d270Ff12BA55e98BDff1f3646426E25D932',
} as const;

/**
 * Mapping of network to Vincent Diamond contract address
 * Used to interact with the correct contract based on the network
 */
export const VINCENT_ADDRESSES: Record<Network, Record<ContractFacet, string>> = {
  [LIT_NETWORK.Datil]: {
    AppView: VINCENT_DIAMOND_ADDRESSES.datil,
    PubKeyRouter: '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475',
  },
} as const;

/**
 * Get a contract instance for a specific facet of the Vincent Diamond
 * @param network The network to connect to
 * @param facet The contract facet to use
 * @returns A contract instance for the specified facet
 */
export function getContract(network: Network, facet: ContractFacet) {
  const abi = FACET_ABIS[facet];

  const provider = new ethers.providers.JsonRpcProvider(rpc);
  return new ethers.Contract(VINCENT_ADDRESSES[network][facet], abi, provider);
}
