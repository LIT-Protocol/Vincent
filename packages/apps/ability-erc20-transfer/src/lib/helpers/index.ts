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
