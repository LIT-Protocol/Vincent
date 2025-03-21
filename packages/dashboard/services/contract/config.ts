import { ethers } from 'ethers';

export type Network = 'datil';

export const VINCENT_DIAMOND_ADDRESS: Record<Network, string> = {
  datil: '0x87cD7840425Fe836ea5fEc2b8Dea40149042AdCe',
};

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

export const rpc = 'https://yellowstone-rpc.litprotocol.com';

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
  args: any[]
): Promise<ethers.BigNumber> {
  try {
    // Estimate the gas required for the transaction
    const estimatedGas = await contract.estimateGas[method](...args);
    
    // Add 20% buffer to the estimated gas
    const buffer = estimatedGas.div(5); // 20% = divide by 5
    const gasLimitWithBuffer = estimatedGas.add(buffer);
    
    console.log(`Gas estimation for ${method}:`, {
      estimated: estimatedGas.toString(),
      withBuffer: gasLimitWithBuffer.toString()
    });
    
    return gasLimitWithBuffer;
  } catch (error) {
    console.error(`Error estimating gas for ${method}:`, error);
    
    // Return a default gas limit if estimation fails
    // This is still better than an arbitrary hardcoded value
    const defaultGasLimit = ethers.BigNumber.from("3000000");
    return defaultGasLimit;
  }
}
