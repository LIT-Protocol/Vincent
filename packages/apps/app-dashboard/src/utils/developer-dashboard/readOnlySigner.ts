import { ethers } from 'ethers';
import { env } from '@/config/env';

const { VITE_VINCENT_YELLOWSTONE_RPC } = env;

/**
 * A read-only provider for fetching blockchain data without requiring a wallet connection.
 * Used for reading on-chain app/version data.
 */
const readOnlyProvider = new ethers.providers.JsonRpcProvider(VITE_VINCENT_YELLOWSTONE_RPC);

/**
 * A read-only signer for the vincent-contracts-sdk.
 * This signer can be used for read operations but will throw if signing is attempted.
 */
export const readOnlySigner = readOnlyProvider.getSigner(ethers.constants.AddressZero);
