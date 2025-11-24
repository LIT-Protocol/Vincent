import {
  AaveV3Ethereum,
  AaveV3Polygon,
  AaveV3Avalanche,
  AaveV3Arbitrum,
  AaveV3Optimism,
  AaveV3Base,
  AaveV3BNB,
  AaveV3Gnosis,
  AaveV3Scroll,
  AaveV3Metis,
  AaveV3Linea,
  AaveV3ZkSync,
  AaveV3Sepolia,
  AaveV3BaseSepolia,
  AaveV3ArbitrumSepolia,
  AaveV3OptimismSepolia,
  AaveV3ScrollSepolia,
} from '@bgd-labs/aave-address-book';
import {
  VINCENT_CONTRACT_ADDRESS_BOOK,
  FEE_DIAMOND_ABI,
} from '@lit-protocol/vincent-contracts-sdk';
import { Abi, Address, getAddress } from 'viem';

/**
 * Fee Contract ABI for Aave operations
 * These functions route through the fee contract instead of directly to Aave
 */
export const FEE_CONTRACT_ABI: Abi = FEE_DIAMOND_ABI as Abi;

/**
 * AAVE v3 Pool Contract ABI
 */
export const AAVE_POOL_ABI: Abi = [
  // Supply
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'address', name: 'onBehalfOf', type: 'address' },
      { internalType: 'uint16', name: 'referralCode', type: 'uint16' },
    ],
    name: 'supply',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Withdraw
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'address', name: 'to', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Borrow
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'interestRateMode', type: 'uint256' },
      { internalType: 'uint16', name: 'referralCode', type: 'uint16' },
      { internalType: 'address', name: 'onBehalfOf', type: 'address' },
    ],
    name: 'borrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Repay
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'interestRateMode', type: 'uint256' },
      { internalType: 'address', name: 'onBehalfOf', type: 'address' },
    ],
    name: 'repay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // getUserAccountData
  {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserAccountData',
    outputs: [
      { internalType: 'uint256', name: 'totalCollateralBase', type: 'uint256' },
      { internalType: 'uint256', name: 'totalDebtBase', type: 'uint256' },
      {
        internalType: 'uint256',
        name: 'availableBorrowsBase',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'currentLiquidationThreshold',
        type: 'uint256',
      },
      { internalType: 'uint256', name: 'ltv', type: 'uint256' },
      { internalType: 'uint256', name: 'healthFactor', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // setUserUseReserveAsCollateral
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'bool', name: 'useAsCollateral', type: 'bool' },
    ],
    name: 'setUserUseReserveAsCollateral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/**
 * Chain id to Aave Address Book mapping
 */
export const CHAIN_TO_AAVE_ADDRESS_BOOK: Record<number, any> = {
  // Mainnets
  1: AaveV3Ethereum,
  137: AaveV3Polygon,
  43114: AaveV3Avalanche,
  42161: AaveV3Arbitrum,
  10: AaveV3Optimism,
  8453: AaveV3Base,
  56: AaveV3BNB,
  100: AaveV3Gnosis,
  534352: AaveV3Scroll,
  1088: AaveV3Metis,
  59144: AaveV3Linea,
  324: AaveV3ZkSync,
  // Testnets
  11155111: AaveV3Sepolia,
  84532: AaveV3BaseSepolia,
  421614: AaveV3ArbitrumSepolia,
  11155420: AaveV3OptimismSepolia,
  534351: AaveV3ScrollSepolia,
} as const;

/**
 * Get AAVE addresses for a specific chain using the Aave Address Book
 */
export function getAaveAddresses(chainId: number) {
  // First try to get from the official Address Book
  if (chainId in CHAIN_TO_AAVE_ADDRESS_BOOK) {
    try {
      const addressBook = CHAIN_TO_AAVE_ADDRESS_BOOK[chainId];
      return {
        POOL: addressBook.POOL,
        POOL_ADDRESSES_PROVIDER: addressBook.POOL_ADDRESSES_PROVIDER,
      };
    } catch (error) {
      console.warn(`Failed to load from Address Book for chain ${chainId}:`, error);
    }
  }

  throw new Error(
    `Unsupported chain: ${chainId}. Supported chains: ${[
      ...Object.keys(CHAIN_TO_AAVE_ADDRESS_BOOK),
    ].join(', ')}`,
  );
}

/**
 * Get ATokens (aave deposit representation tokens) for a specific chain using the Aave Address Book
 */
export function getATokens(chainId: number): Record<string, Address> {
  // First try to get from the official Address Book
  if (chainId in CHAIN_TO_AAVE_ADDRESS_BOOK) {
    try {
      const addressBook = CHAIN_TO_AAVE_ADDRESS_BOOK[chainId];
      const aTokens: Record<string, Address> = {};

      // Extract asset addresses from the address book
      // The address book contains ASSETS object with token addresses
      if (addressBook.ASSETS) {
        Object.keys(addressBook.ASSETS).forEach((assetKey) => {
          const asset = addressBook.ASSETS[assetKey];
          if (asset.UNDERLYING) {
            aTokens[assetKey] = asset.A_TOKEN;
          }
        });
      }

      return aTokens;
    } catch (error) {
      console.warn(`Failed to load ATokens from Address Book for ${chainId}:`, error);
    }
  }

  throw new Error(
    `No ATokens available for chain: ${chainId}. Supported chains: ${[
      ...Object.keys(CHAIN_TO_AAVE_ADDRESS_BOOK),
    ].join(', ')}`,
  );
}

/**
 * Get available markets (asset addresses) for a specific chain using the Aave Address Book
 */
export function getAvailableMarkets(chainId: number): Record<string, Address> {
  // First try to get from the official Address Book
  if (chainId in CHAIN_TO_AAVE_ADDRESS_BOOK) {
    try {
      const addressBook = CHAIN_TO_AAVE_ADDRESS_BOOK[chainId];
      const markets: Record<string, Address> = {};

      // Extract asset addresses from the address book
      // The address book contains ASSETS object with token addresses
      if (addressBook.ASSETS) {
        Object.keys(addressBook.ASSETS).forEach((assetKey) => {
          const asset = addressBook.ASSETS[assetKey];
          if (asset.UNDERLYING) {
            markets[assetKey] = asset.UNDERLYING;
          }
        });
      }

      return markets;
    } catch (error) {
      console.warn(`Failed to load markets from Address Book for ${chainId}:`, error);
    }
  }

  throw new Error(
    `No markets available for chain: ${chainId}. Supported chains: ${[
      ...Object.keys(CHAIN_TO_AAVE_ADDRESS_BOOK),
    ].join(', ')}`,
  );
}

/**
 * Chain ID to fee contract chain name mapping
 */
const CHAIN_ID_TO_FEE_CHAIN_NAME: Record<number, keyof typeof VINCENT_CONTRACT_ADDRESS_BOOK.fee> = {
  1: 'ethereum',
  137: 'polygon',
  43114: 'avalanche',
  42161: 'arbitrum',
  10: 'optimism',
  8453: 'base',
  56: 'bnb',
  84532: 'baseSepolia',
} as const;

/**
 * Get fee contract address for a specific chain
 * @param chainId The chain ID
 * @returns The fee contract address, or null if not available for this chain
 */
export function getFeeContractAddress(chainId: number): Address | null {
  const chainName = CHAIN_ID_TO_FEE_CHAIN_NAME[chainId];
  if (!chainName) {
    return null;
  }

  const feeConfig = VINCENT_CONTRACT_ADDRESS_BOOK.fee[chainName];
  if (!feeConfig) {
    return null;
  }

  return getAddress(feeConfig.address);
}
