import { ethers } from 'ethers';

/**
 * A read-only provider for fetching blockchain data without requiring a wallet connection.
 * Used for reading on-chain app/version data.
 *
 * NOTE: Using Base Sepolia because Vincent contracts are deployed there.
 * This must match the network where users perform write operations via their wallets.
 */
const BASE_SEPOLIA_RPC = 'https://base-sepolia.g.alchemy.com/v2/oRw7rEml01xYpfqAo7stG';
const readOnlyProvider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC);

/**
 * A read-only signer for the vincent-contracts-sdk.
 * This signer can be used for read operations but will throw if signing is attempted.
 */
export const readOnlySigner = readOnlyProvider.getSigner(ethers.constants.AddressZero);
