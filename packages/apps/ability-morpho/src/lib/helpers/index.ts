import { laUtils } from '@lit-protocol/vincent-scaffold-sdk';
import { ethers } from 'ethers';

/**
 * Well-known token addresses across different chains
 * Using official Circle USDC and canonical WETH addresses
 */
export const WELL_KNOWN_TOKENS = {
  // Ethereum mainnet
  1: {
    USDC: '0xA0b86991c6218A36c1D19D4a2e9Eb0cE3606eB48', // Circle USDC
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Canonical WETH
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Tether USDT
  },
  // Base
  8453: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Native USDC on Base
    WETH: '0x4200000000000000000000000000000000000006', // WETH on Base
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', // USDT on Base
  },
  // Arbitrum One
  42161: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Native USDC on Arbitrum
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT on Arbitrum
  },
  // Optimism
  10: {
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Native USDC on Optimism
    WETH: '0x4200000000000000000000000000000000000006', // WETH on Optimism
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT on Optimism
  },
  // Polygon
  137: {
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Native USDC on Polygon
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT on Polygon
  },
  // Sepolia testnet
  11155111: {
    USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // Test USDC on Sepolia
    WETH: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c', // Test WETH on Sepolia
    USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0', // Test USDT on Sepolia
  },
} as const;

/**
 * Supported chain IDs and their names
 */
export const SUPPORTED_CHAINS = {
  1: 'ethereum',
  8453: 'base',
  42161: 'arbitrum',
  10: 'optimism',
  137: 'polygon',
  11155111: 'sepolia',
} as const;

/**
 * Chain names to IDs mapping for backwards compatibility
 */
export const CHAIN_IDS = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  optimism: 10,
  polygon: 137,
  sepolia: 11155111,
} as const;

/**
 * ERC4626 Vault ABI - Essential methods for Morpho vaults
 */
export const ERC4626_VAULT_ABI: any[] = [
  // Deposit
  {
    inputs: [
      { internalType: 'uint256', name: 'assets', type: 'uint256' },
      { internalType: 'address', name: 'receiver', type: 'address' },
    ],
    name: 'deposit',
    outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Withdraw
  {
    inputs: [
      { internalType: 'uint256', name: 'assets', type: 'uint256' },
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'address', name: 'owner', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Redeem
  {
    inputs: [
      { internalType: 'uint256', name: 'shares', type: 'uint256' },
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'address', name: 'owner', type: 'address' },
    ],
    name: 'redeem',
    outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // Asset (underlying token address)
  {
    inputs: [],
    name: 'asset',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },

  // Balance of shares
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },

  // Convert assets to shares
  {
    inputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
    name: 'convertToShares',
    outputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },

  // Convert shares to assets
  {
    inputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },

  // Total assets managed by the vault
  {
    inputs: [],
    name: 'totalAssets',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
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
 * Supported chain type
 */
export type SupportedChainId = keyof typeof WELL_KNOWN_TOKENS;
export type SupportedChainName = keyof typeof CHAIN_IDS;

/**
 * Supported token symbols for vault filtering
 */
export type TokenSymbol = 'USDC' | 'WETH' | 'USDT';

/**
 * Supported sorting fields for vault queries
 */
export type VaultSortBy = 'netApy' | 'totalAssets' | 'totalAssetsUsd' | 'creationTimestamp';

/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Chain identifier (can be chain ID number or chain name string)
 */
export type ChainIdentifier = number | string;

/**
 * Common vault filtering presets for quick searches
 */
export type VaultFilterPresets = {
  /** Find high-yield vaults across all chains */
  highYield: VaultFilterOptions;
  /** Find stable, low-risk vaults */
  stable: VaultFilterOptions;
  /** Find vaults with high TVL */
  highTvl: VaultFilterOptions;
};

/**
 * Pre-configured filter presets for common use cases
 */
export const VAULT_FILTER_PRESETS: VaultFilterPresets = {
  highYield: {
    minNetApy: 0.08,
    minTvl: 1000000,
    sortBy: 'netApy',
    sortOrder: 'desc',
    excludeIdle: true,
    limit: 10,
  },
  stable: {
    minTvl: 5000000,
    maxNetApy: 0.15,
    whitelistedOnly: true,
    sortBy: 'totalAssetsUsd',
    sortOrder: 'desc',
    excludeIdle: true,
    limit: 10,
  },
  highTvl: {
    minTvl: 10000000,
    sortBy: 'totalAssetsUsd',
    sortOrder: 'desc',
    excludeIdle: true,
    limit: 20,
  },
};

/**
 * Get well-known token addresses for a specific chain
 */
export function getTokenAddresses(chainId: number) {
  if (!(chainId in WELL_KNOWN_TOKENS)) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(WELL_KNOWN_TOKENS).join(
        ', ',
      )}`,
    );
  }
  return WELL_KNOWN_TOKENS[chainId as SupportedChainId];
}

/**
 * Get token address for a specific token symbol and chain
 */
export function getTokenAddress(symbol: string, chainId: number): string {
  const tokens = getTokenAddresses(chainId);
  const upperSymbol = symbol.toUpperCase() as keyof typeof tokens;

  if (!(upperSymbol in tokens)) {
    throw new Error(
      `Token ${symbol} not found on chain ${chainId}. Available tokens: ${Object.keys(tokens).join(
        ', ',
      )}`,
    );
  }

  return tokens[upperSymbol];
}

/**
 * Check if a chain is supported by Morpho
 */
export function isSupportedChain(chainId: number): boolean {
  return chainId in WELL_KNOWN_TOKENS;
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(WELL_KNOWN_TOKENS).map(Number);
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: number): string {
  return SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS] || `chain-${chainId}`;
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
 * Validate operation-specific requirements for Morpho vaults
 */
export async function validateOperationRequirements(
  operation: string,
  userBalance: string,
  allowance: string,
  vaultShares: string,
  convertedAmount: string,
): Promise<{ valid: boolean; error?: string }> {
  const userBalanceBN = BigInt(userBalance);
  const allowanceBN = BigInt(allowance);
  const vaultSharesBN = BigInt(vaultShares);
  const convertedAmountBN = BigInt(convertedAmount);

  switch (operation) {
    case 'deposit':
      // Check if user has enough balance
      if (userBalanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient balance for deposit operation. You have ${userBalance} and need ${convertedAmount}`,
        };
      }
      // Check if user has approved vault to spend tokens
      if (allowanceBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient allowance for deposit operation. Please approve vault to spend your tokens first. You have ${allowance} and need ${convertedAmount}`,
        };
      }
      break;

    case 'withdraw':
      // For withdraw, we need to check if user has enough vault shares
      if (vaultSharesBN === 0n) {
        return {
          valid: false,
          error: 'No vault shares available for withdrawal',
        };
      }
      // Note: We'll need to convert the amount to shares in the actual implementation
      break;

    case 'redeem':
      // For redeem, we need to check if user has enough vault shares
      if (vaultSharesBN === 0n) {
        return {
          valid: false,
          error: 'No vault shares available for redeem',
        };
      }
      // For redeem, the amount is in shares, so check directly
      if (vaultSharesBN < convertedAmountBN) {
        return {
          valid: false,
          error: `Insufficient vault shares for redeem operation. You have ${vaultShares} shares and need ${convertedAmount} shares`,
        };
      }
      break;

    default:
      return { valid: false, error: `Unsupported operation: ${operation}` };
  }

  return { valid: true };
}

/**
 * Comprehensive Morpho Vault Information
 *
 * Contains all vault details including address, asset info, chain data,
 * performance metrics, and status information.
 *
 * @example
 * ```typescript
 * const vaults = await getVaults({ limit: 1 });
 * const vault = vaults[0];
 *
 * console.log(`Vault: ${vault.name}`);
 * console.log(`Asset: ${vault.asset.symbol}`);
 * console.log(`Chain: ${vault.chain.network}`);
 * console.log(`Net APY: ${vault.metrics.netApy}%`);
 * console.log(`TVL: $${vault.metrics.totalAssetsUsd.toLocaleString()}`);
 * ```
 */
export interface MorphoVaultInfo {
  /** Vault contract address (0x format) */
  address: string;
  /** Human-readable vault name */
  name: string;
  /** Vault token symbol */
  symbol: string;
  /** Underlying asset information */
  asset: {
    /** Asset contract address */
    address: string;
    /** Asset symbol (e.g., "USDC", "WETH") */
    symbol: string;
    /** Full asset name */
    name: string;
    /** Token decimals */
    decimals: number;
  };
  /** Blockchain information */
  chain: {
    /** Chain ID (1=Ethereum, 8453=Base, etc.) */
    id: number;
    /** Chain name ("ethereum", "base", etc.) */
    network: string;
  };
  /** Performance and financial metrics */
  metrics: {
    /** Gross APY percentage (before fees) */
    apy: number;
    /** Net APY percentage (after fees) - most accurate for users */
    netApy: number;
    /** Total assets in vault (in token units as string) */
    totalAssets: string;
    /** Total Value Locked in USD */
    totalAssetsUsd: number;
    /** Vault fee percentage */
    fee: number;
    /** Additional reward tokens and APRs */
    rewards?: Array<{
      /** Reward token address */
      asset: string;
      /** Supply APR for this reward */
      supplyApr: number;
      /** Yearly supply tokens amount */
      yearlySupplyTokens: string;
    }>;
  };
  /** Whether vault is whitelisted by Morpho */
  whitelisted: boolean;
  /** Vault creation timestamp */
  creationTimestamp: number;
  /** Whether vault has low activity (< $100 TVL) */
  isIdle?: boolean;
}

/**
 * Unified Vault Filter Options for the getVaults() function
 *
 * Supports comprehensive filtering by asset, chain, performance metrics, and more.
 * All filters use server-side GraphQL queries for optimal performance.
 *
 * @example
 * ```typescript
 * // Find high-yield USDC vaults on Base
 * const vaults = await getVaults({
 *   assetSymbol: "USDC",
 *   chainId: 8453,
 *   minNetApy: 0.05,
 *   sortBy: "netApy",
 *   sortOrder: "desc",
 *   limit: 10
 * });
 * ```
 */
export interface VaultFilterOptions {
  // Asset filtering
  /** Filter by token symbol (e.g., "USDC", "WETH", "USDT") */
  assetSymbol?: TokenSymbol | string;
  /** Filter by specific token contract address */
  assetAddress?: string;

  // Chain filtering (supports both name and ID for flexibility)
  /** Chain identifier - supports chain name or ID */
  chain?: string | number;
  /** Specific chain ID (1=Ethereum, 8453=Base, 42161=Arbitrum, etc.) */
  chainId?: number;

  // Performance filtering
  /** Minimum Net APY percentage (after fees) */
  minNetApy?: number;
  /** Maximum Net APY percentage (after fees) */
  maxNetApy?: number;
  /** Minimum total assets in vault (in token units) */
  minTotalAssets?: number;
  /** Maximum total assets in vault (in token units) */
  maxTotalAssets?: number;
  /** Minimum Total Value Locked in USD */
  minTvl?: number;
  /** Maximum Total Value Locked in USD */
  maxTvl?: number;

  // Vault status filtering
  /** Only include whitelisted vaults */
  whitelistedOnly?: boolean;
  /** Exclude low-activity vaults (< $100 TVL) */
  excludeIdle?: boolean;

  // Sorting and pagination
  /** Field to sort results by */
  sortBy?: VaultSortBy;
  /** Sort order: ascending or descending */
  sortOrder?: SortOrder;
  /** Maximum number of results to return */
  limit?: number;
}

/**
 * Vault Search Options
 */
export interface VaultSearchOptions {
  query?: string; // Search in name, symbol, or asset
  chains?: Array<string | number>;
  limit?: number;
  offset?: number;
}

/**
 * Morpho GraphQL API Client
 */
export class MorphoVaultClient {
  private readonly apiUrl = 'https://blue-api.morpho.org/graphql';

  /**
   * Fetch vault data from Morpho GraphQL API
   */
  private async fetchVaultData(query: string, variables?: any): Promise<any> {
    try {
      // console.log("fetchVaultData", query, variables);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`HTTP error! status: ${response.status} and body: ${body}`);
      }

      const data: any = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL error: ${data.errors.map((e: any) => e.message).join(', ')}`);
      }

      return data.data;
    } catch (error) {
      console.error('Failed to fetch vault data:', error);
      throw error;
    }
  }

  /**
   * Get all vaults with comprehensive information
   * Now uses proper server-side filtering via GraphQL VaultFilters
   */
  async getAllVaults(options: VaultFilterOptions = {}): Promise<MorphoVaultInfo[]> {
    // Build GraphQL where clause from options
    const whereClause = this.buildVaultFilters(options);

    const query = `
      query GetAllVaults($first: Int, $orderBy: VaultOrderBy, $orderDirection: OrderDirection, $where: VaultFilters) {
        vaults(first: $first, orderBy: $orderBy, orderDirection: $orderDirection, where: $where) {
          items {
            address
            name
            symbol
            whitelisted
            creationTimestamp
            asset {
              address
              symbol
              name
              decimals
            }
            chain {
              id
              network
            }
            state {
              apy
              netApy
              totalAssets
              totalAssetsUsd
              fee
              rewards {
                asset {
                  address
                  symbol
                }
                supplyApr
                yearlySupplyTokens
              }
            }
          }
        }
      }
    `;

    // Fetch more results than requested to account for client-side filtering
    // If excludeIdle is true, we might need to filter some out, so fetch extra
    // But never exceed 1000 (GraphQL API limit)
    const calculateFetchLimit = (requestedLimit?: number): number => {
      if (!requestedLimit) return 100; // Default limit

      // Always cap at 1000 to respect GraphQL API limits
      const cappedLimit = Math.min(requestedLimit, 1000);

      if (options.excludeIdle) {
        // For excludeIdle filtering, fetch extra but never exceed 1000
        return Math.max(cappedLimit, 1000);
      }

      // No client-side filtering, use requested limit (capped at 1000)
      return cappedLimit;
    };

    const fetchLimit = calculateFetchLimit(options.limit);

    const variables = {
      first: fetchLimit,
      orderBy: this.mapSortBy(options.sortBy || 'totalAssetsUsd'),
      orderDirection: options.sortOrder === 'asc' ? 'Asc' : 'Desc',
      where: whereClause,
    };

    const data = await this.fetchVaultData(query, variables);
    const vaults = data.vaults.items.map((vault: any) => this.mapVaultData(vault));

    // console.log("vaults after server-side filtering", vaults.length);

    // Apply only remaining client-side filters not supported by GraphQL
    const filtered = this.applyRemainingClientFilters(vaults, options);
    // console.log("vaults after additional client filtering", filtered.length);

    // Apply the limit AFTER client-side filtering to ensure we get the expected number of results
    const finalResults = options.limit ? filtered.slice(0, options.limit) : filtered;

    // Log a warning if we couldn't fetch enough results due to API limits
    if (options.limit && options.limit > 1000 && finalResults.length < options.limit) {
      console.warn(
        `Warning: Requested ${options.limit} vaults but GraphQL API limit is 1000. Got ${finalResults.length} results.`,
      );
    }

    return finalResults;
  }

  /**
   * Unified function to get vaults with flexible filtering
   * Supports filtering by asset, chain, and all other options
   */
  async getVaults(options: VaultFilterOptions = {}): Promise<MorphoVaultInfo[]> {
    // If specific asset or chain filters are provided, enhance the options
    const enhancedOptions = { ...options };

    // Handle chain filtering - support both chainId and chain name/ID
    if (options.chainId) {
      enhancedOptions.chain = options.chainId;
    }

    return this.getAllVaults(enhancedOptions);
  }

  /**
   * Get top vaults by APY
   */
  async getTopVaultsByNetApy(limit = 10, minTvl = 0): Promise<MorphoVaultInfo[]> {
    return this.getAllVaults({
      sortBy: 'netApy',
      sortOrder: 'desc',
      limit,
      minTvl,
      excludeIdle: true,
    });
  }

  /**
   * Get top vaults by TVL
   */
  async getTopVaultsByTvl(limit = 10): Promise<MorphoVaultInfo[]> {
    return this.getAllVaults({
      sortBy: 'totalAssetsUsd',
      sortOrder: 'desc',
      limit,
      excludeIdle: true,
    });
  }

  /**
   * Search vaults by name, symbol, or asset
   */
  async searchVaults(searchOptions: VaultSearchOptions): Promise<MorphoVaultInfo[]> {
    const allVaults = await this.getAllVaults({ limit: 500 }); // Reduced to avoid GraphQL limit issues

    if (!searchOptions.query) {
      return allVaults.slice(0, searchOptions.limit || 50);
    }

    const query = searchOptions.query.toLowerCase();
    const filtered = allVaults.filter(
      (vault) =>
        vault.name.toLowerCase().includes(query) ||
        vault.symbol.toLowerCase().includes(query) ||
        vault.asset.symbol.toLowerCase().includes(query) ||
        vault.asset.name.toLowerCase().includes(query),
    );

    return filtered.slice(0, searchOptions.limit || 50);
  }

  /**
   * Get vault details by address
   */
  async getVaultByAddress(address: string, chainId: number): Promise<MorphoVaultInfo | null> {
    const query = `
      query GetVaultByAddress($address: String!, $chainId: Int!) {
        vaultByAddress(address: $address, chainId: $chainId) {
          address
          name
          symbol
          whitelisted
          creationTimestamp
          asset {
            address
            symbol
            name
            decimals
          }
          chain {
            id
            network
          }
          state {
            apy
            netApy
            totalAssets
            totalAssetsUsd
            fee
            rewards {
              asset {
                address
                symbol
              }
              supplyApr
              yearlySupplyTokens
            }
          }
        }
      }
    `;

    const variables = { address, chainId };

    try {
      const data = await this.fetchVaultData(query, variables);
      return data.vaultByAddress ? this.mapVaultData(data.vaultByAddress) : null;
    } catch (error) {
      console.error(`Failed to fetch vault ${address}:`, error);
      return null;
    }
  }

  /**
   * Get best vaults for a specific asset
   */
  async getBestVaultsForAsset(assetSymbol: string, limit = 5): Promise<MorphoVaultInfo[]> {
    const vaults = await this.getAllVaults({
      sortBy: 'netApy',
      sortOrder: 'desc',
      limit: 100,
      minTvl: 10000, // Minimum $10k TVL
      excludeIdle: true,
    });

    return vaults
      .filter((vault) => vault.asset.symbol.toLowerCase() === assetSymbol.toLowerCase())
      .slice(0, limit);
  }

  /**
   * Map vault data from GraphQL response
   */
  private mapVaultData(vault: any): MorphoVaultInfo {
    return {
      address: vault.address,
      name: vault.name,
      symbol: vault.symbol,
      asset: {
        address: vault.asset.address,
        symbol: vault.asset.symbol,
        name: vault.asset.name,
        decimals: vault.asset.decimals,
      },
      chain: {
        id: vault.chain.id,
        network: vault.chain.network,
      },
      metrics: {
        apy: vault.state.apy || 0,
        netApy: vault.state.netApy || 0,
        totalAssets: vault.state.totalAssets || '0',
        totalAssetsUsd: vault.state.totalAssetsUsd || 0,
        fee: vault.state.fee || 0,
        rewards:
          vault.state.rewards?.map((reward: any) => ({
            asset: reward.asset.address,
            supplyApr: reward.supplyApr,
            yearlySupplyTokens: reward.yearlySupplyTokens,
          })) || [],
      },
      whitelisted: vault.whitelisted,
      creationTimestamp: vault.creationTimestamp,
      isIdle: vault.state.totalAssetsUsd < 100, // Consider vaults with < $100 TVL as idle
    };
  }

  /**
   * Build GraphQL VaultFilters from filter options
   * Uses proper server-side filtering for better performance
   */
  private buildVaultFilters(options: VaultFilterOptions): any {
    const filters: any = {};

    // Chain filtering - server-side supported
    if (options.chain !== undefined || options.chainId !== undefined) {
      let targetChainId: number | undefined;

      if (options.chainId !== undefined) {
        targetChainId = options.chainId;
      } else if (options.chain !== undefined) {
        targetChainId =
          typeof options.chain === 'string'
            ? CHAIN_IDS[options.chain as keyof typeof CHAIN_IDS]
            : options.chain;
      }

      if (targetChainId !== undefined) {
        filters.chainId_in = [targetChainId];
      }
    }

    // Asset filtering - server-side supported
    if (options.assetAddress) {
      filters.assetAddress_in = [options.assetAddress.toLowerCase()];
    }

    if (options.assetSymbol) {
      filters.assetSymbol_in = [options.assetSymbol.toUpperCase()];
    }

    // Whitelisted status filtering - server-side supported
    if (options.whitelistedOnly) {
      filters.whitelisted = true;
    }

    // Net APY filtering - server-side supported
    if (options.minNetApy !== undefined) {
      filters.netApy_gte = options.minNetApy;
    }

    if (options.maxNetApy !== undefined) {
      filters.netApy_lte = options.maxNetApy;
    }

    // TVL filtering - server-side supported
    if (options.minTvl !== undefined) {
      filters.totalAssetsUsd_gte = options.minTvl;
    }

    if (options.maxTvl !== undefined) {
      filters.totalAssetsUsd_lte = options.maxTvl;
    }

    // Total assets filtering - server-side supported
    if (options.minTotalAssets !== undefined) {
      filters.totalAssets_gte = options.minTotalAssets.toString();
    }

    if (options.maxTotalAssets !== undefined) {
      filters.totalAssets_lte = options.maxTotalAssets.toString();
    }

    // Return null if no filters to avoid empty where clause
    return Object.keys(filters).length > 0 ? filters : null;
  }

  /**
   * Apply remaining client-side filters not supported by GraphQL
   * Only handles computed properties like isIdle
   */
  private applyRemainingClientFilters(
    vaults: MorphoVaultInfo[],
    options: VaultFilterOptions,
  ): MorphoVaultInfo[] {
    let filtered = vaults;

    // Idle vault filtering (computed client-side)
    if (options.excludeIdle) {
      filtered = filtered.filter((vault) => !vault.isIdle);
    }

    return filtered;
  }

  /**
   * Map sortBy option to GraphQL enum
   */
  private mapSortBy(sortBy: string): string {
    switch (sortBy) {
      case 'netApy':
        return 'NetApy';
      case 'totalAssets':
        return 'TotalAssets';
      case 'totalAssetsUsd':
        return 'TotalAssetsUsd';
      case 'creationTimestamp':
        return 'CreationTimestamp';
      default:
        return 'TotalAssetsUsd';
    }
  }
}

/**
 * Create a singleton instance of MorphoVaultClient
 */
export const morphoVaultClient = new MorphoVaultClient();

/**
 * Helper function to get best vaults for a specific asset
 */
export async function getBestVaultsForAsset(
  assetSymbol: string,
  limit = 5,
): Promise<MorphoVaultInfo[]> {
  return morphoVaultClient.getBestVaultsForAsset(assetSymbol, limit);
}

/**
 * Helper function to get top vaults by APY
 */
export async function getTopVaultsByNetApy(limit = 10, minTvl = 10000): Promise<MorphoVaultInfo[]> {
  return morphoVaultClient.getTopVaultsByNetApy(limit, minTvl);
}

/**
 * Helper function to get top vaults by TVL
 */
export async function getTopVaultsByTvl(limit = 10): Promise<MorphoVaultInfo[]> {
  return morphoVaultClient.getTopVaultsByTvl(limit);
}

/**
 * Helper function to search vaults
 */
export async function searchVaults(query: string, limit = 20): Promise<MorphoVaultInfo[]> {
  return morphoVaultClient.searchVaults({ query, limit });
}

/**
 * 🚀 **Quick Vault Search with Presets**
 *
 * Get vaults using pre-configured filter presets for common use cases.
 *
 * @param preset - Pre-configured filter preset
 * @param overrides - Additional options to override preset defaults
 * @returns Promise resolving to array of vault information
 *
 * @example
 * ```typescript
 * // Find high-yield vaults
 * const highYieldVaults = await getVaultsByPreset("highYield");
 *
 * // Find high-yield USDC vaults specifically
 * const usdcHighYield = await getVaultsByPreset("highYield", {
 *   assetSymbol: "USDC"
 * });
 *
 * // Find stable vaults on Base chain
 * const stableBaseVaults = await getVaultsByPreset("stable", {
 *   chainId: 8453
 * });
 * ```
 */
export async function getVaultsByPreset(
  preset: keyof VaultFilterPresets,
  overrides: Partial<VaultFilterOptions> = {},
): Promise<MorphoVaultInfo[]> {
  const presetOptions = VAULT_FILTER_PRESETS[preset];
  const mergedOptions = { ...presetOptions, ...overrides };
  return getVaults(mergedOptions);
}

/**
 * 🔍 **Primary Vault Discovery Function**
 *
 * Get Morpho vaults with comprehensive filtering and sorting options.
 * Uses server-side GraphQL queries for optimal performance.
 *
 * @param options - Vault filtering and sorting options
 * @returns Promise resolving to array of vault information
 *
 * @example
 * ```typescript
 * // Find best USDC vaults across all chains
 * const topVaults = await getVaults({
 *   assetSymbol: "USDC",
 *   minNetApy: 0.05,
 *   minTvl: 1000000,
 *   sortBy: "netApy",
 *   sortOrder: "desc",
 *   limit: 5
 * });
 *
 * // Filter by specific chain
 * const baseVaults = await getVaults({
 *   chainId: 8453, // Base
 *   excludeIdle: true,
 *   sortBy: "totalAssetsUsd"
 * });
 *
 * // Search with multiple criteria
 * const premiumVaults = await getVaults({
 *   minNetApy: 10.0,
 *   minTvl: 5000000,
 *   whitelistedOnly: true,
 *   sortBy: "netApy",
 *   limit: 3
 * });
 * ```
 */
export async function getVaults(options: VaultFilterOptions = {}): Promise<MorphoVaultInfo[]> {
  return morphoVaultClient.getVaults(options);
}

/**
 * Get supported chains with active vaults
 */
export async function getSupportedChainsWithVaults(): Promise<
  { chainId: number; name: string; vaultCount: number }[]
> {
  const supportedChains = getSupportedChainIds();
  const results = [];

  for (const chainId of supportedChains) {
    try {
      const vaults = await morphoVaultClient.getVaults({
        chainId,
        limit: 1,
        excludeIdle: true,
      });

      if (vaults.length > 0) {
        // Get total count - reduced limit to avoid GraphQL errors
        const allVaults = await morphoVaultClient.getVaults({
          chainId,
          limit: 500, // Reduced to avoid GraphQL limit issues
          excludeIdle: true,
        });

        results.push({
          chainId,
          name: getChainName(chainId),
          vaultCount: allVaults.length,
        });
      }
    } catch (error) {
      console.warn(
        `Could not fetch vaults for chain ${chainId}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return results.sort((a, b) => b.vaultCount - a.vaultCount);
}

/**
 * Get vault discovery summary for a chain
 */
export async function getVaultDiscoverySummary(chainId: number) {
  try {
    const [topByTvl, topByNetApy, assetBreakdown] = await Promise.all([
      morphoVaultClient.getVaults({
        chainId,
        sortBy: 'totalAssetsUsd',
        sortOrder: 'desc',
        limit: 5,
        excludeIdle: true,
      }),
      morphoVaultClient.getVaults({
        chainId,
        sortBy: 'netApy',
        sortOrder: 'desc',
        limit: 5,
        excludeIdle: true,
      }),
      morphoVaultClient.getVaults({
        chainId,
        limit: 500, // Reduced to avoid GraphQL limit issues
        excludeIdle: true,
      }),
    ]);

    // Group by asset
    const assetGroups = assetBreakdown.reduce(
      (acc, vault) => {
        const symbol = vault.asset.symbol;
        if (!acc[symbol]) {
          acc[symbol] = { count: 0, totalTvl: 0, maxNetApy: 0 };
        }
        acc[symbol].count++;
        acc[symbol].totalTvl += vault.metrics.totalAssetsUsd;
        acc[symbol].maxNetApy = Math.max(acc[symbol].maxNetApy, vault.metrics.netApy);
        return acc;
      },
      {} as Record<string, { count: number; totalTvl: number; maxNetApy: number }>,
    );

    return {
      chainId,
      chainName: getChainName(chainId),
      totalVaults: assetBreakdown.length,
      totalTvl: assetBreakdown.reduce((sum, v) => sum + v.metrics.totalAssetsUsd, 0),
      topVaultsByTvl: topByTvl,
      topVaultsByNetApy: topByNetApy,
      assetBreakdown: Object.entries(assetGroups)
        .map(([symbol, data]) => ({ symbol, ...data }))
        .sort((a, b) => b.totalTvl - a.totalTvl),
    };
  } catch (error) {
    console.error(`Error getting vault summary for chain ${chainId}:`, error);
    throw error;
  }
}

/**
 * Generic function to execute any Morpho operation, with optional gas sponsorship
 */
export async function executeMorphoOperation({
  provider,
  pkpPublicKey,
  vaultAddress,
  functionName,
  args,
  chainId,
  alchemyGasSponsor,
  alchemyGasSponsorApiKey,
  alchemyGasSponsorPolicyId,
}: {
  provider?: any;
  pkpPublicKey: string;
  vaultAddress: string;
  functionName: string;
  args: any[];
  chainId: number;
  alchemyGasSponsor?: boolean;
  alchemyGasSponsorApiKey?: string;
  alchemyGasSponsorPolicyId?: string;
}): Promise<string> {
  console.log(
    `[@lit-protocol/vincent-ability-morpho/executeMorphoOperation] Starting ${functionName} operation`,
    { sponsored: !!alchemyGasSponsor },
  );

  // Use gas sponsorship if enabled and all required parameters are provided
  if (alchemyGasSponsor && alchemyGasSponsorApiKey && alchemyGasSponsorPolicyId) {
    console.log(
      `[@lit-protocol/vincent-ability-morpho/executeMorphoOperation] Using EIP-7702 gas sponsorship`,
      { vaultAddress, functionName, args, policyId: alchemyGasSponsorPolicyId },
    );

    try {
      return await laUtils.transaction.handler.sponsoredGasContractCall({
        pkpPublicKey,
        abi: ERC4626_VAULT_ABI,
        contractAddress: vaultAddress,
        functionName,
        args,
        chainId,
        eip7702AlchemyApiKey: alchemyGasSponsorApiKey,
        eip7702AlchemyPolicyId: alchemyGasSponsorPolicyId,
      });
    } catch (error) {
      console.error(
        `[@lit-protocol/vincent-ability-morpho/executeMorphoOperation] EIP-7702 operation failed:`,
        error,
      );
      throw error;
    }
  } else {
    // Use regular transaction without gas sponsorship
    console.log(
      `[@lit-protocol/vincent-ability-morpho/executeMorphoOperation] Using regular transaction`,
    );

    if (!provider) {
      throw new Error('Provider is required for non-sponsored transactions');
    }

    try {
      return await laUtils.transaction.handler.contractCall({
        provider,
        pkpPublicKey,
        callerAddress: ethers.utils.computeAddress(pkpPublicKey),
        abi: ERC4626_VAULT_ABI,
        contractAddress: vaultAddress,
        functionName,
        args,
        chainId,
      });
    } catch (error) {
      console.error(
        `[@lit-protocol/vincent-ability-morpho/executeMorphoOperation] Regular transaction failed:`,
        error,
      );
      throw error;
    }
  }
}
