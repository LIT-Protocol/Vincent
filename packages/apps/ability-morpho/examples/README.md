# Morpho Vault Discovery Examples

This directory contains examples demonstrating the comprehensive vault discovery capabilities of the Morpho ability, with support for multiple blockchain networks and dynamic address resolution.

## 🌟 Key Features

- **✅ Zero Hardcoded Addresses**: All vault and token addresses are discovered dynamically
- **🌐 Multi-Chain Support**: Works across Ethereum, Base, Arbitrum, Optimism, Polygon, and testnets
- **📊 Real-Time Data**: APY, TVL, and vault metrics from Morpho's GraphQL API
- **🔍 Advanced Filtering**: Search by asset, chain, APY range, TVL, and more
- **🏆 Smart Discovery**: Find best vaults based on yield, liquidity, and other criteria

## 📁 Example Files

### `vault-search.js` 🆕

Demonstrates the`getVaults()` function:

- Advanced filtering combinations (asset + chain + performance)
- Multiple criteria search examples
- Migration patterns from legacy functions

## 🚀 Running Examples

```bash
# Navigate to the morpho ability directory
cd vincent-packages/abilitys/morpho

# Run unified vault search examples
node examples/vault-search.js

# Run server-side filtering examples
node examples/server-side-filtering.js
```

## 🔧 API Functions Available

### Unified Vault Discovery

- `getVaults(options)` - Unified function with server-side GraphQL filtering
- `getBestVaultsForAsset(symbol, limit)` - Top vaults for an asset
- `getTopVaultsByApy(limit, minTvl)` - Highest yielding vaults
- `getTopVaultsByTvl(limit)` - Largest vaults by TVL
- `searchVaults(query, limit)` - Search by name/symbol

### Multi-Chain Support

- `getSupportedChainsWithVaults()` - All chains with active vaults
- `getVaultDiscoverySummary(chainId)` - Comprehensive chain analysis

### Token Management

- `getTokenAddress(symbol, chainId)` - Get token address for chain
- `getTokenAddresses(chainId)` - All well-known tokens for chain
- `isSupportedChain(chainId)` - Check chain support

## 🌐 Supported Networks

| Network  | Chain ID | USDC | WETH | USDT |
| -------- | -------- | ---- | ---- | ---- |
| Ethereum | 1        | ✅   | ✅   | ✅   |
| Base     | 8453     | ✅   | ✅   | ✅   |
| Arbitrum | 42161    | ✅   | ✅   | ✅   |
| Optimism | 10       | ✅   | ✅   | ✅   |
| Polygon  | 137      | ✅   | ✅   | ✅   |
| Sepolia  | 11155111 | ✅   | ✅   | ✅   |

## 📊 Example Output

```
🌐 Multi-Chain Morpho Vault Discovery Examples

📋 Example 1: All Morpho-Supported Chains
Found 4 chains with active Morpho vaults:
  • base (Chain ID: 8453): 23 active vaults
  • ethereum (Chain ID: 1): 45 active vaults
  • arbitrum (Chain ID: 42161): 12 active vaults

📊 Example 2: Base Chain Ecosystem Summary
Chain: base (8453)
Total Vaults: 23
Total TVL: $1,234,567,890
Asset Breakdown:
  USDC: 8 vaults, $567M TVL, 12.5% max APY
  WETH: 6 vaults, $234M TVL, 8.3% max APY
  CBETH: 4 vaults, $123M TVL, 9.1% max APY
```

## 🔗 Integration

The vault discovery system is designed to work seamlessly with the Vincent ability framework:

```typescript
// In your Vincent ability
import { getVaults, getTokenAddress } from './helpers';

// Unified vault search with flexible filtering
const vaults = await getVaults({
  assetSymbol: 'WETH',
  chainId: 8453, // Base
  minApy: 0.05,
  minTvl: 1000000,
  limit: 5,
});

// Get best WETH vault on Base
const bestVaults = await getVaults({
  assetSymbol: 'WETH',
  chainId: 8453,
  sortBy: 'apy',
  sortOrder: 'desc',
  limit: 1,
});
const vaultAddress = bestVaults[0]?.address;

// Get WETH token address on Base
const wethAddress = getTokenAddress('WETH', 8453);
```

### 🆕 Unified getVaults() Options

```typescript
interface VaultFilterOptions {
  // Asset filtering
  assetSymbol?: string; // 'WETH', 'USDC', etc.
  assetAddress?: string; // Specific token contract address

  // Chain filtering
  chain?: string | number; // 'base', 'arbitrum', 8453, 42161
  chainId?: number; // Direct chain ID

  // Performance filtering
  minApy?: number; // Minimum APY %
  maxApy?: number; // Maximum APY %
  minTvl?: number; // Minimum TVL in USD
  maxTvl?: number; // Maximum TVL in USD

  // Vault status
  whitelistedOnly?: boolean; // Only whitelisted vaults
  excludeIdle?: boolean; // Exclude low-activity vaults

  // Sorting & pagination
  sortBy?: 'apy' | 'totalAssetsUsd' | 'creationTimestamp';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}
```

## ⚡ Performance Optimization

### Server-Side GraphQL Filtering

The `getVaults()` function now uses proper server-side GraphQL filtering for maximum performance:

**Server-side filters** (applied at GraphQL query level via `VaultFilters`):

- `chainId` / `chain` - Network filtering (`chainId_in`)
- `assetSymbol` / `assetAddress` - Asset filtering (`assetSymbol_in`, `assetAddress_in`)
- `whitelistedOnly` - Whitelisted status filtering (`whitelisted`)
- `minTvl` / `maxTvl` - TVL range filtering (`totalAssetsUsd_gte`, `totalAssetsUsd_lte`)
- `minApy` / `maxApy` - APY range filtering (`apy_gte`, `apy_lte`)
- `minTotalAssets` / `maxTotalAssets` - Total assets filtering (`totalAssets_gte`, `totalAssets_lte`)

**Client-side filters** (applied after data retrieval for computed properties):

- `excludeIdle` - Computed idle status filtering (TVL < $100)

This hybrid approach maximizes performance by filtering at the database level while maintaining support for computed properties.

## 🛡️ Error Handling

All functions include comprehensive error handling:

- Network connectivity issues
- Chain not supported
- Asset not available on chain
- Vault not found
- API rate limiting

The system gracefully degrades and provides meaningful error messages for debugging.
