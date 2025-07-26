import bs58 from 'bs58';

/**
 * Converts a hex-encoded IPFS CID to base58 format with validation
 * @param cid Hex-encoded IPFS CID (with or without 0x prefix)
 * @returns Base58-encoded IPFS CID or throws error if invalid
 * @throws Error if the input is not a valid hex string or conversion fails
 */
export const hexToBase58 = (cid: string): string => {
  if (!cid) {
    throw new Error('Input cannot be empty');
  }

  const hasPrefix = cid.startsWith('0x');
  const hexString = hasPrefix ? cid.substring(2) : cid;

  if (!/^[0-9a-fA-F]+$/.test(hexString)) {
    throw new Error(`Invalid hex string: ${cid}`);
  }

  try {
    const bytes = Buffer.from(hexString, 'hex');
    return bs58.encode(bytes);
  } catch (error: any) {
    console.error('Error converting hex to base58:', error);
    throw new Error(`Failed to convert hex to base58: ${error.message || 'Unknown error'}`);
  }
};
