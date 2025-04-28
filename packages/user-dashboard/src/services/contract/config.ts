import { ethers } from 'ethers';
import { LIT_NETWORK, LIT_RPC } from "@lit-protocol/constants";

import { env } from '@/config/env';

const { VITE_VINCENT_DATIL_CONTRACT, VITE_GAS_BUFFER_DIVISOR } = env;

export type Network = typeof LIT_NETWORK.Datil;

export const VINCENT_DIAMOND_ADDRESS: Record<Network, string> = {
  datil: VITE_VINCENT_DATIL_CONTRACT,
};

if (!VINCENT_DIAMOND_ADDRESS.datil) {
  throw new Error('Vincent Diamond contract address for datil network is undefined. Check your environment variables.');
}

import APP_VIEW_FACET_ABI from './abis/VincentAppViewFacet.abi.json';
import APP_FACET_ABI from './abis/VincentAppFacet.abi.json';
import TOOL_FACET_ABI from './abis/VincentToolFacet.abi.json';
import TOOL_VIEW_FACET_ABI from './abis/VincentToolViewFacet.abi.json';
import USER_FACET_ABI from './abis/VincentUserFacet.abi.json';
import USER_VIEW_FACET_ABI from './abis/VincentUserViewFacet.abi.json';

export type ContractFacet = 'AppView' | 'App' | 'ToolView' | 'Tool' | 'UserView' | 'User';

export const FACET_ABIS = {
  AppView: APP_VIEW_FACET_ABI,
  App: APP_FACET_ABI,
  ToolView: TOOL_VIEW_FACET_ABI,
  Tool: TOOL_FACET_ABI,
  UserView: USER_VIEW_FACET_ABI,
  User: USER_FACET_ABI,
};

export const rpc = LIT_RPC.CHRONICLE_YELLOWSTONE;

/**
 * Get a contract instance for a specific facet of the Vincent Diamond
 * @param network The network to connect to
 * @param facet The contract facet to use
 * @param isSigner Whether to use a signer (for transactions) or provider (for read-only)
 * @param customSigner Optional custom signer to use instead of browser signer
 * @returns A contract instance for the specified facet
 */
export async function getContract(
  network: Network,
  facet: ContractFacet,
  isSigner: boolean = false,
  customSigner?: ethers.Signer
) {
  const abi = FACET_ABIS[facet];

  if (isSigner) {
    if (customSigner) {
      return new ethers.Contract(VINCENT_DIAMOND_ADDRESS[network], abi, customSigner);
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    const signer = provider.getSigner();
    return new ethers.Contract(VINCENT_DIAMOND_ADDRESS[network], abi, signer);
  } else {
    const provider = new ethers.providers.JsonRpcProvider(rpc);
    return new ethers.Contract(VINCENT_DIAMOND_ADDRESS[network], abi, provider);
  }
}

/**
 * Utility function to estimate gas for a transaction and add a 20% buffer
 * @param contract The contract instance to use for estimation
 * @param method The method name to call
 * @param args The arguments to pass to the method
 * @returns A Promise resolving to the estimated gas limit with buffer
 */
export async function estimateGasWithBuffer(
  contract: ethers.Contract,
  method: string,
  args: unknown[]
): Promise<ethers.BigNumber> {
  try {
    // Estimate the gas required for the transaction
    const estimatedGas = await contract.estimateGas[method](...args);

    // Add 10% buffer to the estimated gas
    const buffer = estimatedGas.div(VITE_GAS_BUFFER_DIVISOR);
    const gasLimitWithBuffer = estimatedGas.add(buffer);

    return gasLimitWithBuffer;
  } catch (error: unknown) {
    console.error('Error estimating gas:', error);
    throw new Error('Gas estimation failed');
  }
}
