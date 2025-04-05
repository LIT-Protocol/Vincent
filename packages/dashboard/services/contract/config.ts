import { ethers } from 'ethers';

export type Network = 'datil';

export const VINCENT_DIAMOND_ADDRESS: Record<Network, string> = {
  datil: process.env.NEXT_PUBLIC_VINCENT_DATIL_CONTRACT || '',
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
    // Format and log a more detailed error message
    console.error(`Error estimating gas for ${method}:`, error);

    // Extract detailed error information
    const errorObj = error as any;
    const errorMessage = errorObj.message || '';
    const errorCode = errorObj.code || '';
    const errorData = errorObj.data || '';
    const errorReason = errorObj.reason || '';

    // Extract revert reason if available
    let revertReason = '';
    if (errorMessage && typeof errorMessage === 'string') {
      if (errorMessage.includes('execution reverted')) {
        const match = errorMessage.match(/execution reverted: (.*?)(?:,|$)/);
        if (match && match[1]) {
          revertReason = match[1].trim();
        }
      }
    }

    // Log all details for debugging
    console.error('Detailed error information:', {
      method,
      args,
      errorMessage,
      errorCode,
      errorData,
      errorReason,
      revertReason
    });

    // For gas estimation errors, it's usually better to fail the transaction
    // with a helpful message rather than using a default gas limit
    if (errorMessage.includes('cannot estimate gas') ||
      errorMessage.includes('execution reverted')) {
      const detailedMessage = revertReason
        ? `Cannot estimate gas for ${method}: ${revertReason}`
        : `Cannot estimate gas for ${method}: The transaction would fail. This might be due to invalid arguments, insufficient permissions, or contract restrictions.`;

      throw new Error(detailedMessage);
    }

    // If not a gas estimation error, return a default gas limit
    console.warn(`Using default gas limit for ${method} due to estimation failure`);
    const defaultGasLimit = ethers.BigNumber.from("3000000");
    return defaultGasLimit;
  }
}
