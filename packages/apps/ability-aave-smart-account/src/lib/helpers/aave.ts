import { ethers, type ContractInterface } from 'ethers';

/**
 * AAVE v3 Pool Contract ABI - Essential methods only
 */
export const AAVE_POOL_ABI: ContractInterface = [
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
];

export const aaveIface = new ethers.utils.Interface(AAVE_POOL_ABI);

/**
 * Chain id to Aave Address Book mapping
 */
export const CHAIN_TO_AAVE_ADDRESS_BOOK: Record<number, () => any> = {
  // Mainnets
  1: () => require('@bgd-labs/aave-address-book').AaveV3Ethereum,
  137: () => require('@bgd-labs/aave-address-book').AaveV3Polygon,
  43114: () => require('@bgd-labs/aave-address-book').AaveV3Avalanche,
  42161: () => require('@bgd-labs/aave-address-book').AaveV3Arbitrum,
  10: () => require('@bgd-labs/aave-address-book').AaveV3Optimism,
  8453: () => require('@bgd-labs/aave-address-book').AaveV3Base,
  250: () => require('@bgd-labs/aave-address-book').AaveV3Fantom,
  56: () => require('@bgd-labs/aave-address-book').AaveV3BNB,
  100: () => require('@bgd-labs/aave-address-book').AaveV3Gnosis,
  534352: () => require('@bgd-labs/aave-address-book').AaveV3Scroll,
  1088: () => require('@bgd-labs/aave-address-book').AaveV3Metis,
  59144: () => require('@bgd-labs/aave-address-book').AaveV3Linea,
  324: () => require('@bgd-labs/aave-address-book').AaveV3ZkSync,
  // Testnets
  11155111: () => require('@bgd-labs/aave-address-book').AaveV3Sepolia,
  84532: () => require('@bgd-labs/aave-address-book').AaveV3BaseSepolia,
  421614: () => require('@bgd-labs/aave-address-book').AaveV3ArbitrumSepolia,
  11155420: () => require('@bgd-labs/aave-address-book').AaveV3OptimismSepolia,
  43113: () => require('@bgd-labs/aave-address-book').AaveV3AvalancheFuji,
  534351: () => require('@bgd-labs/aave-address-book').AaveV3ScrollSepolia,
} as const;

/**
 * Supported chain names
 */
export type SupportedChain = keyof typeof CHAIN_TO_AAVE_ADDRESS_BOOK;

/**
 * Get AAVE addresses for a specific chain using the Aave Address Book
 */
export function getAaveAddresses(chainId: number) {
  // First try to get from the official Address Book
  if (chainId in CHAIN_TO_AAVE_ADDRESS_BOOK) {
    try {
      const addressBook = CHAIN_TO_AAVE_ADDRESS_BOOK[chainId]();
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
export function getATokens(chainId: number): Record<string, string> {
  // First try to get from the official Address Book
  if (chainId in CHAIN_TO_AAVE_ADDRESS_BOOK) {
    try {
      const addressBook = CHAIN_TO_AAVE_ADDRESS_BOOK[chainId]();
      const aTokens: Record<string, string> = {};

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
export function getAvailableMarkets(chainId: number): Record<string, string> {
  // First try to get from the official Address Book
  if (chainId in CHAIN_TO_AAVE_ADDRESS_BOOK) {
    try {
      const addressBook = CHAIN_TO_AAVE_ADDRESS_BOOK[chainId]();
      const markets: Record<string, string> = {};

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
