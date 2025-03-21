import * as ethers from 'ethers';
import { LIT_RPC } from '@lit-protocol/constants';
import APP_FACET_ABI from './abis/VincentAppViewFacet.abi.json';
import USER_VIEW_FACET_ABI from './abis/VincentUserViewFacet.abi.json';
import USER_FACET_ABI from './abis/VincentUserFacet.abi.json';

// Define contract address and provider
export const VINCENT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VINCENT_DATIL_CONTRACT!;
export const PROVIDER = new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);

/**
 * Returns an instance of the App Registry contract
 * Used for reading app information and versions
 */
export const getAppRegistryContract = () => new ethers.Contract(
  VINCENT_CONTRACT_ADDRESS,
  APP_FACET_ABI,
  PROVIDER
);

/**
 * Returns an instance of the User View Registry contract
 * Used for reading user permissions and app relationships
 */
export const getUserViewRegistryContract = () => new ethers.Contract(
  VINCENT_CONTRACT_ADDRESS,
  USER_VIEW_FACET_ABI,
  PROVIDER
);

/**
 * Returns an instance of the User Registry contract
 * Used for modifying user permissions and app relationships
 */
export const getUserRegistryContract = () => new ethers.Contract(
  VINCENT_CONTRACT_ADDRESS,
  USER_FACET_ABI,
  PROVIDER
);

/**
 * Helper function to connect a wallet to a contract
 * @param contract The contract instance to connect
 * @param wallet The wallet to connect to the contract
 * @returns A new contract instance connected to the wallet
 */
export const connectWalletToContract = (
  contract: ethers.Contract, 
  wallet: ethers.Signer
): ethers.Contract => {
  return contract.connect(wallet);
}; 