import * as ethers from 'ethers';
import { LIT_RPC } from '@lit-protocol/constants';
import APP_VIEW_FACET_ABI from '@/services/contract/abis/VincentAppViewFacet.abi.json';
import USER_VIEW_FACET_ABI from '@/services/contract/abis/VincentUserViewFacet.abi.json';
import USER_FACET_ABI from '@/services/contract/abis/VincentUserFacet.abi.json';
import { env } from '@/config/env';

const { VITE_VINCENT_DATIL_CONTRACT } = env;

// Define contract address and provider
export const VINCENT_CONTRACT_ADDRESS = VITE_VINCENT_DATIL_CONTRACT;
export const PROVIDER = new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);

/**
 * Returns an instance of the App Registry contract
 * Used for reading app information and versions
 */
export const getAppViewRegistryContract = () => new ethers.Contract(
  VINCENT_CONTRACT_ADDRESS,
  APP_VIEW_FACET_ABI,
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
