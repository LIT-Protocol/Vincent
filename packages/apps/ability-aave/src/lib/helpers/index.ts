import { ethers } from 'ethers';

/**
 * Test token addresses indexed by chain name
 */
export const TEST_TOKENS: Record<string, Record<string, string>> = {
  sepolia: {
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
    WETH: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c',
    USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    AAVE: '0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a',
    WBTC: '0x29f2D40B0605204364af54EC677bD022dA425d03',
  },
  base: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    WETH: '0x4200000000000000000000000000000000000006',
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    AAVE: '0xEB4c2781e4ebA804CE9a9803C67d0893436bB27D',
    WBTC: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c',
  },
} as const;

export const CHAIN_IDS = {
  sepolia: 11155111,
  base: 8453,
} as const;

/**
 * AAVE v3 Pool Contract ABI - Essential methods only
 */
export const AAVE_POOL_ABI: any[] = [
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

/**
 * ERC20 Token ABI - Essential methods only
 */
export const ERC20_ABI: any[] = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * Interest Rate Modes for AAVE
 */
export const INTEREST_RATE_MODE = {
  NONE: 0,
  STABLE: 1,
  VARIABLE: 2,
} as const;

/**
 * Chain name to Aave Address Book mapping
 */
export const CHAIN_TO_AAVE_ADDRESS_BOOK: Record<string, () => any> = {
  // Mainnets
  ethereum: () => require('@bgd-labs/aave-address-book').AaveV3Ethereum,
  polygon: () => require('@bgd-labs/aave-address-book').AaveV3Polygon,
  avalanche: () => require('@bgd-labs/aave-address-book').AaveV3Avalanche,
  arbitrum: () => require('@bgd-labs/aave-address-book').AaveV3Arbitrum,
  optimism: () => require('@bgd-labs/aave-address-book').AaveV3Optimism,
  base: () => require('@bgd-labs/aave-address-book').AaveV3Base,
  fantom: () => require('@bgd-labs/aave-address-book').AaveV3Fantom,
  bnb: () => require('@bgd-labs/aave-address-book').AaveV3BNB,
  gnosis: () => require('@bgd-labs/aave-address-book').AaveV3Gnosis,
  scroll: () => require('@bgd-labs/aave-address-book').AaveV3Scroll,
  metis: () => require('@bgd-labs/aave-address-book').AaveV3Metis,
  linea: () => require('@bgd-labs/aave-address-book').AaveV3Linea,
  zksync: () => require('@bgd-labs/aave-address-book').AaveV3ZkSync,
  // Testnets
  sepolia: () => require('@bgd-labs/aave-address-book').AaveV3Sepolia,
  basesepolia: () => require('@bgd-labs/aave-address-book').AaveV3BaseSepolia,
  arbitrumsepolia: () => require('@bgd-labs/aave-address-book').AaveV3ArbitrumSepolia,
  optimismsepolia: () => require('@bgd-labs/aave-address-book').AaveV3OptimismSepolia,
  avalanchefuji: () => require('@bgd-labs/aave-address-book').AaveV3AvalancheFuji,
  scrollsepolia: () => require('@bgd-labs/aave-address-book').AaveV3ScrollSepolia,
} as const;

/**
 * Supported chain names
 */
export type SupportedChain = keyof typeof CHAIN_TO_AAVE_ADDRESS_BOOK;

/**
 * Get AAVE addresses for a specific chain using the Aave Address Book
 */
export function getAaveAddresses(chain: string) {
  const chainKey = chain.toLowerCase();

  // First try to get from the official Address Book
  if (chainKey in CHAIN_TO_AAVE_ADDRESS_BOOK) {
    try {
      const addressBook = CHAIN_TO_AAVE_ADDRESS_BOOK[chainKey]();
      return {
        POOL: addressBook.POOL,
        POOL_ADDRESSES_PROVIDER: addressBook.POOL_ADDRESSES_PROVIDER,
      };
    } catch (error) {
      console.warn(`Failed to load from Address Book for ${chain}:`, error);
    }
  }

  throw new Error(
    `Unsupported chain: ${chain}. Supported chains: ${[
      ...Object.keys(CHAIN_TO_AAVE_ADDRESS_BOOK),
    ].join(', ')}`,
  );
}

/**
 * Get test token addresses for a specific chain
 */
export function getTestTokens(chain: string) {
  const chainKey = chain.toLowerCase() as SupportedChain;
  if (!(chainKey in TEST_TOKENS)) {
    throw new Error(
      `Unsupported chain: ${chain}. Supported chains: ${Object.keys(TEST_TOKENS).join(', ')}`,
    );
  }
  return TEST_TOKENS[chainKey];
}

/**
 * Get available markets (asset addresses) for a specific chain using the Aave Address Book
 */
export function getAvailableMarkets(chain: string): Record<string, string> {
  const chainKey = chain.toLowerCase();

  // First try to get from the official Address Book
  if (chainKey in CHAIN_TO_AAVE_ADDRESS_BOOK) {
    try {
      const addressBook = CHAIN_TO_AAVE_ADDRESS_BOOK[chainKey]();
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
      console.warn(`Failed to load markets from Address Book for ${chain}:`, error);
    }
  }

  // Fall back to hardcoded test tokens for backward compatibility
  if (chainKey in TEST_TOKENS) {
    return TEST_TOKENS[chainKey as keyof typeof TEST_TOKENS];
  }

  throw new Error(
    `No markets available for chain: ${chain}. Supported chains: ${[
      ...Object.keys(CHAIN_TO_AAVE_ADDRESS_BOOK),
      ...Object.keys(TEST_TOKENS),
    ].join(', ')}`,
  );
}

/**
 * Get all supported chains
 */
export function getSupportedChains(): string[] {
  return [...Object.keys(CHAIN_TO_AAVE_ADDRESS_BOOK)];
}

/**
 * Utility function to validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Utility function to parse amount with decimals
 */
export function parseAmount(amount: string, decimals = 18): string {
  return ethers.utils.parseUnits(amount, decimals).toString();
}

/**
 * Utility function to format amount from wei
 */
export function formatAmount(amount: string, decimals = 18): string {
  return ethers.utils.formatUnits(amount, decimals);
}

/**
 * Validate operation-specific requirements
 */
export async function validateOperationRequirements(
  operation: string,
  userBalance: string,
  allowance: string,
  borrowCapacity: string,
  convertedAmount: string,
  _interestRateMode?: number,
): Promise<{ valid: boolean; error?: string }> {
  const userBalanceBN = BigInt(userBalance);
  const allowanceBN = BigInt(allowance);
  const borrowCapacityBN = BigInt(borrowCapacity);
  const convertedAmountBN = BigInt(convertedAmount);

  switch (operation) {
    case 'supply':
      // Check if user has enough balance
      if (userBalanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient balance for supply operation.  You have ${userBalance} and need ${convertedAmount}`,
        };
      }
      // Check if user has approved AAVE to spend tokens
      if (allowanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient allowance for supply operation. Please approve AAVE to spend your tokens first. You have ${allowance} and need ${convertedAmount}`,
        };
      }
      break;

    case 'withdraw':
      // For withdraw, we need to check if user has enough aTokens (collateral)
      // This would require checking aToken balance, but for now we'll just check if they have any collateral
      if (borrowCapacityBN === 0n && userBalanceBN === 0n) {
        return {
          valid: false,
          error: 'No collateral available for withdrawal',
        };
      }
      break;

    case 'borrow':
      // Check if user has enough borrowing capacity
      if (borrowCapacityBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient borrowing capacity.  You have ${borrowCapacity} and need ${convertedAmount}`,
        };
      }
      break;

    case 'repay':
      // Check if user has enough balance to repay
      if (userBalanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient balance for repay operation.  You have ${userBalance} and need ${convertedAmount}`,
        };
      }
      // Check if user has approved AAVE to spend tokens for repayment
      if (allowanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient allowance for repay operation. Please approve AAVE to spend your tokens first. You have ${allowance} and need ${convertedAmount}`,
        };
      }
      break;

    default:
      return { valid: false, error: `Unsupported operation: ${operation}` };
  }

  return { valid: true };
}
