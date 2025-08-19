# Vincent Ability ERC20 Transfer

A Vincent Ability for secure ERC-20 token transfers with integrated policy-based governance, balance
validation, and multi-network support.

## Overview

The `erc20-transfer` ability enables secure ERC-20 token transfers through the Vincent Framework,
providing:

- Secure transfers using PKP (Programmable Key Pair) wallets
- Automatic token decimals detection
- Policy-based governance with integrated rate limiting
- Balance validation for both native gas fees and token amounts
- Multi-network support (precheck uses rpcUrl; execute resolves RPC via the `chain` parameter)
- Real-time transaction execution with detailed logging and error handling

## Key Features

### 🪙 ERC-20 Token Support

- Works with any ERC-20 token
- Automatically fetches token decimals from the contract
- Token balance validation before transfer execution
- Standard ERC-20 transfer function integration

### 🔐 PKP-Based Security

- Uses Lit Protocol's PKP wallets for secure transaction signing
- Delegated execution with proper permission validation
- No private key exposure during transaction execution

### 🚦 Policy Integration

- Integrated with `send-counter-limit` policy for rate limiting
- Configurable transaction limits per time window
- Automatic policy enforcement during execution

### 🌐 Multi-Network Support

- Precheck uses the provided RPC URL (rpcUrl)
- Execute resolves RPC via the `chain` parameter using Lit Actions
- Works with any EVM-compatible network

### ✅ Comprehensive Validation

- Ethereum address format validation for recipient and token contract
- Amount validation (must be a positive decimal string)
- RPC URL required for precheck
- Native balance check for gas fees
- Token balance check before transfer

## Parameters

All functions accept the following parameters:

| Parameter                   | Type      | Description                                                                                                                                 |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `rpcUrl`                    | `string`  | RPC URL used during precheck validations                                                                                                    |
| `chain`                     | `string`  | Lit [supported EVM chain name](https://developer.litprotocol.com/resources/supported-chains) used during execute (e.g., 'base', 'ethereum') |
| `to`                        | `string`  | Recipient address (0x...)                                                                                                                   |
| `tokenAddress`              | `string`  | ERC-20 token contract address (0x...)                                                                                                       |
| `amount`                    | `string`  | Amount in human-readable string (e.g., "1.23")                                                                                              |
| `alchemyGasSponsor`         | `boolean` | Whether to use Alchemy's gas sponsorship (EIP-7702)                                                                                         |
| `alchemyGasSponsorApiKey`   | `string`  | Alchemy API key for gas sponsorship (required if alchemyGasSponsor is true)                                                                 |
| `alchemyGasSponsorPolicyId` | `string`  | Alchemy gas policy ID for sponsorship (required if alchemyGasSponsor is true)                                                               |

## Usage Examples

### USDC Transfer on Base Network

```typescript
const transferParams = {
  rpcUrl: 'https://base.llamarpc.com',
  chain: 'base',
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base USDC
  amount: '10.50',
};
```

### Custom Token Transfer

```typescript
const transferParams = {
  rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
  chain: 'ethereum',
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenAddress: '0xYourTokenContractAddress',
  amount: '100.0',
};
```

### Small Amount Transfer (for testing)

```typescript
const transferParams = {
  rpcUrl: 'https://base.llamarpc.com',
  chain: 'base',
  to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
  tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  amount: '0.000001',
};
```

## Execution Flow

### 1. Precheck Phase

- Validates recipient address format
- Validates token contract address format
- Validates transfer amount (positive, reasonable limits)
- Validates token decimals (0-18 range)
- Validates RPC URL format (if provided)
- Validates chain ID (if provided)
- Returns validation status

### 2. Execute Phase

- Connects to specified chain
- Retrieves PKP public key from delegation context
- Converts PKP public key to Ethereum address
- Parses token amount using retrieved number of decimals
- Validates native balance for gas fees
- Validates token balance for transfer amount
- Executes ERC-20 transfer using `laUtils.transaction.handler.contractCall`
- Triggers policy commit phase for rate limiting
- Returns transaction hash and metadata

## Policy Integration

The ability automatically integrates with the `send-counter-limit` policy if enabled by the Vincent App User:

- **Precheck**: Validates ability parameters
- **Execute**: Performs the actual ERC-20 transfer
- **Policy Commit**: Records the transaction for rate limiting

### Policy Configuration

```typescript
// Example: Allow 2 ERC-20 transfers per 10 seconds
const policyConfig = {
  maxSends: 2n,
  timeWindowSeconds: 10n,
};
```

## Error Handling

The ability provides detailed error messages for various failure scenarios:

### Address Validation Errors

```
"Invalid recipient address format"
"Invalid token contract address format"
```

### Amount Validation Errors

```
"Invalid amount format or amount must be greater than 0"
"Amount too large (maximum 1,000,000 tokens per transaction)"
```

### Balance Validation Errors

```
"Insufficient native balance for gas. Need 0.0001 ETH, but only have 0.00005 ETH"
"Insufficient token balance. Need 100.0 tokens, but only have 50.0 tokens"
```

### Network Errors

```
"Invalid RPC URL format"
"Unable to obtain blockchain provider for transfer operations"
"PKP public key not available from delegation context"
```

### Transaction Errors

```
"Unknown error occurred"
```

## Response Format

### Success Response

```typescript
{
  txHash: "0x...",
    to
:
  "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    amount
:
  "10.50",
    tokenAddress
:
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    timestamp
:
  1703123456789
}
```

### Error Response

```typescript
{
  error: 'Detailed error message';
}
```

## Development

### Building

```bash
npm install
npm run build
```

### Testing

This ability is tested through the Vincent E2E testing framework:

- `npm run vincent:e2e:erc20` - Tests ERC-20 transfers with rate limiting

### Architecture

The ability follows the Vincent two-phase execution model:

1. **Precheck** - Parameter validation outside Lit Actions
2. **Execute** - Transaction execution within Lit Actions

## Security Considerations

- **Balance validation**: Comprehensive checks for both native gas fees and token balances
- **PKP security**: Uses Lit Protocol's secure PKP system
- **Policy enforcement**: Integrated rate limiting prevents abuse
- **Network validation**: RPC URL and chain validation prevents malicious endpoints

## Supported Networks

- **Base Mainnet** (Chain ID: 8453)
- **Ethereum Mainnet** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Arbitrum** (Chain ID: 42161)
- **Any EVM-compatible network supported by Lit**

### Popular Token Addresses

#### Base Network

- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **WETH**: `0x4200000000000000000000000000000000000006`

#### Ethereum Mainnet

- **USDC**: `0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8`
- **USDT**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`

## Dependencies

- `@lit-protocol/vincent-scaffold-sdk` - Core Vincent framework
- `@lit-protocol/vincent-ability-sdk` - Ability development framework
- `ethers.js` - Blockchain interaction
- `zod` - Schema validation and type safety
