import { ethers } from 'ethers';

/**
 * ERC-20 helper functions and ABI definitions
 */

/**
 * Standard partial ERC-20 ABI
 */
export const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      {
        name: '_to',
        type: 'address',
      },
      {
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: 'balance',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: '',
        type: 'uint8',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * Creates and returns an instance of an ERC-20 contract connected to the given address and provider.
 *
 * @param provider - The JSON-RPC provider to connect to the blockchain.
 * @param address - The address of the ERC-20 contract.
 * @return An instance of the ethers.js Contract representing the ERC-20 token contract.
 */
export function getErc20Contract(provider: ethers.providers.JsonRpcProvider, address: string) {
  return new ethers.Contract(address, ERC20_ABI, provider);
}

/**
 * Parse amount string to wei units for ERC-20 tokens
 * @param amount - Amount as string (e.g., "1.5")
 * @param decimals - Token decimals (default 18)
 * @returns Amount in wei as string
 */
export function parseTokenAmount(amount: string, decimals = 18): string {
  const amountFloat = parseFloat(amount);
  const multiplier = Math.pow(10, decimals);
  const weiAmount = Math.floor(amountFloat * multiplier);
  return weiAmount.toString();
}

/**
 * Validate Ethereum address format
 * @param address - Address to validate
 * @returns True if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate amount format and ensure it's positive
 * @param amount - Amount string to validate
 * @returns True if valid, false otherwise
 */
export function isValidAmount(amount: string): boolean {
  if (!amount || typeof amount !== 'string') return false;
  if (!/^\d*\.?\d+$/.test(amount)) return false;
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && parsed > 0;
}
