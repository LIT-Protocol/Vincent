import { ethers } from 'ethers';
import bs58 from 'bs58';

/**
 * Converts a base58-encoded IPFS CID to hex format with 0x prefix
 * @param cid Base58-encoded IPFS CID
 * @returns Hex-encoded IPFS CID with 0x prefix
 * @throws Error if the input is not a valid base58 string or conversion fails
 */
export const base58ToHex = (cid: string): string => {
  if (!cid) {
    throw new Error('Input cannot be empty');
  }

  try {
    const bytes = bs58.decode(cid);
    return ethers.utils.hexlify(bytes);
  } catch (error: any) {
    console.error('Error converting base58 to hex:', error);
    throw new Error(`Failed to convert base58 to hex: ${error.message || 'Unknown error'}`);
  }
};
