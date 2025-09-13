---
title: Morpho
---

# Morpho

The Morpho Ability enables Vincent Apps to interact with Morpho lending vaults on behalf of Vincent Users. This allows Vincent Apps to provide yield-generating DeFi functionality through Morpho's lending markets, including depositing assets to earn yield, withdrawing funds, and managing vault positions.

## Key Features

- **Yield Vault Operations**: Supports deposit, withdraw, and redeem operations with Morpho's ERC-4626 compliant vaults using Vincent Wallets within a secure Trusted Execution Environment
- **Multi-Chain Support**: Works across multiple networks where Morpho vaults are deployed including Ethereum, Base, Arbitrum, Optimism, and Polygon
- **Comprehensive Vault Discovery**: Utilizes the Morpho Vault API to discover and filter vaults by asset, chain, APY, TVL, and other criteria
- **Gas Sponsorship**: Optional integration with Alchemy's gas sponsorship for gasless transactions via EIP-7702

## How It Works

The Morpho Ability is built using the [Vincent Ability SDK](../Ability-Developers/Creating-Abilities.md) and operates in two phases:

1. **Precheck Phase**: Validates all prerequisites for the Morpho operation
   - Validates operation type, vault address, and amount format
   - Verifies the vault exists using the built-in Morpho Vault client and retrieves asset information
   - For deposits, checks the Vincent App User's Vincent Wallet's token balance and allowance
   - For withdrawals/redeems, checks the Vincent App User's Vincent Wallet's has a vault share balance
   - For withdrawals, converts the requested asset amount to the required vault shares using ERC-4626 `convertToShares`
   - Estimates gas costs for the operation
   - Returns detailed validation results with current balance/shares

2. **Execution Phase**: Executes the Morpho vault operation
   - Discovers and retrieves vault information using the Morpho Vault API, which enables filtering by asset, chain, APY, TVL, and more
   - Constructs the appropriate Morpho vault transaction using ERC-4626 standard methods
   - Signs and submits the transaction (with optional EIP-7702 Alchemy gas sponsorship)
   - Returns transaction hash and operation details

## Getting Started

Depending on your role in the Vincent Ecosystem, you'll be interacting with this Ability in different ways. Click on the link below that matches your role to see how to get started:

- **Vincent App Developers**: If you're building a Vincent App that needs to interact with Morpho vaults, go [here](#adding-the-ability-to-your-vincent-app).
- **Vincent App Delegatees**: If you're executing this ability on behalf of Vincent App Users, go [here](#executing-the-ability-as-a-delegatee).

## Adding the Ability to your Vincent App

If you want to enable your App Delegatees to perform Morpho vault operations on behalf of your Vincent App Users, you can add this Ability to your App.

Adding Abilities to your Vincent App is done using the [Vincent App Dashboard](https://dashboard.heyvincent.ai/). Visit the [Create Vincent App](../App-Agent-Developers/Creating-Apps.md) guide to learn more about how to add Abilities to your App during creation, or check out the [Upgrading Your App](../App-Agent-Developers/Upgrading-Apps.md) guide to learn how to add Abilities to an existing App.

## Executing the Ability as a Vincent App Delegatee

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>To learn more about executing Vincent Abilities, see the <a href="../App-Agent-Developers/Executing-Abilities.md">Executing Abilities</a> guide.</p>
</div>

### Prerequisites

Before executing Morpho vault operations, the following conditions must be met. You can use the Ability's `precheck` function to check if these conditions are met, or you can check them manually.

#### Native Token Balance for Gas Fees

The Vincent App User's Vincent Wallet must have enough native tokens (ETH, MATIC, etc.) to cover the transaction gas fees for the Morpho operation.

#### ERC20 Token Approval

For deposit operations, the Vincent App User's Vincent Wallet must have approved the Morpho vault contract to spend the underlying tokens.

If your Vincent App has enabled the [ERC20 Approval Ability](./Erc20Approval.md), you can use it to handle submitting the approval transaction using the App User's Vincent Wallet.

#### Operation-Specific Requirements

Each Morpho operation has specific validation requirements that are checked during the `precheck` phase:

**Deposit Operation:**

- The Vincent App User's Vincent Wallet must have sufficient balance of the underlying token (e.g., USDC, WETH)
- Morpho vault contract must be approved to spend the required token amount
- Both balance and allowance must be greater than or equal to the deposit amount

**Withdraw Operation:**

- The Vincent App User's Vincent Wallet must have vault shares deposited in the Morpho vault
- The Vincent Wallet must have sufficient vault shares to cover the withdrawal amount (converted from asset amount to shares)
- The vault must have sufficient liquidity to fulfill the withdrawal

**Redeem Operation:**

- The Vincent App User's Vincent Wallet must have vault shares in the specified Morpho vault
- The Vincent Wallet must have sufficient vault share balance to cover the redeem amount
- The vault must have sufficient underlying assets to exchange for the redeemed shares

### Executing the `precheck` Function

This Ability's `precheck` function validates all prerequisites for executing a Morpho vault operation and provides detailed account information.

Before executing the `precheck` function, you'll need to provide the following parameters for the Morpho operation:

```typescript
{
  /**
   * The Morpho operation to perform (deposit, withdraw, redeem)
   */
  operation: 'deposit' | 'withdraw' | 'redeem';
  /**
   * The Morpho vault contract address
   */
  vaultAddress: string;
  /**
   * The amount to operate with, as a decimal string
   * For deposit/withdraw: amount of underlying asset (e.g., "100.5" for 100.5 USDC)
   * For redeem: amount of vault shares
   */
  amount: string;
  /**
   * The blockchain network to perform the operation on
   */
  chain: string;
  /**
   * Custom RPC URL (optional, for precheck only)
   */
  rpcUrl?: string;
  /**
   * Enable Alchemy gas sponsorship (optional)
   */
  alchemyGasSponsor?: boolean;
  /**
   * Alchemy API key (required if gas sponsorship enabled)
   */
  alchemyGasSponsorApiKey?: string;
  /**
   * Alchemy policy ID (required if gas sponsorship enabled)
   */
  alchemyGasSponsorPolicyId?: string;
}
```

To execute `precheck`, you'll need to:

- Create an instance of the `VincentAbilityClient` using the `getVincentAbilityClient` function (imported from `@lit-protocol/vincent-app-sdk/abilityClient`)
  - Pass in the Ability's `bundledVincentAbility` object (imported from `@lit-protocol/vincent-ability-morpho`)
  - Pass in the `ethersSigner` you'll be using to sign the request to Lit with your Delegatee private key
- Prepare the required parameters to call the `precheck` function
- Use the `VincentAbilityClient` instance to call the `precheck` function

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-morpho';

// Create ability client
const abilityClient = getVincentAbilityClient({
  bundledVincentAbility: bundledVincentAbility,
  ethersSigner: yourEthersSigner,
});

// Example: Deposit 100 USDC into a Morpho vault on Base
const morphoParams = {
  operation: 'deposit' as const,
  vaultAddress: '0x...', // Morpho USDC vault address on Base
  amount: '100.0', // 100 USDC
  chain: 'base',
  rpcUrl: 'https://mainnet.base.org', // Optional for precheck
};

const precheckResult = await abilityClient.precheck(morphoParams, {
  delegatorPkpEthAddress: '0x...', // The Vincent App User's Vincent Wallet address
});

if (precheckResult.success) {
  const result = precheckResult.result;
  console.log('Operation valid:', result.operationValid);
  console.log('User balance:', result.userBalance);
  console.log('Current allowance:', result.allowance);
  console.log('Vault shares:', result.vaultShares);
  console.log('Estimated gas:', result.estimatedGas);
} else {
  // Handle different types of failures
  if (precheckResult.runtimeError) {
    console.error('Runtime error:', precheckResult.runtimeError);
  }
  if (precheckResult.schemaValidationError) {
    console.error('Schema validation error:', precheckResult.schemaValidationError);
  }
  if (precheckResult.result) {
    console.error('Morpho precheck failed:', precheckResult.result.error);
  }
}
```

#### Precheck Success Response

A successful `precheck` response will contain detailed validation information:

```typescript
{
  /**
   * Whether the requested operation is valid
   */
  operationValid: boolean;
  /**
   * Whether the specified vault address is valid
   */
  vaultValid: boolean;
  /**
   * Whether the specified amount is valid
   */
  amountValid: boolean;
  /**
   * The user's current balance of the vault's underlying asset (for deposits)
   */
  userBalance?: string;
  /**
   * The current allowance approved for the vault contract (for deposits)
   */
  allowance?: string;
  /**
   * The user's current vault share balance (for withdrawals/redeems)
   */
  vaultShares?: string;
  /**
   * Estimated gas cost for the operation
   */
  estimatedGas?: number;
}
```

#### Precheck Failure Response

A failure `precheck` response will contain:

```typescript
{
  /**
   * A string containing the error message if the precheck failed
   */
  error: string;
}
```

### Executing the `execute` Function

This Ability's `execute` function performs the actual Morpho vault operation.

The `execute` function expects the same parameters as the `precheck` function (except `rpcUrl` which is not allowed), and can be executed using the same `VincentAbilityClient` instance:

```typescript
// Remove rpcUrl for execute - chain parameter is used instead
const executeParams = {
  operation: 'deposit' as const,
  vaultAddress: '0x...', // Morpho USDC vault address on Base
  amount: '100.0', // 100 USDC
  chain: 'base',
  // Optional: Enable gas sponsorship
  alchemyGasSponsor: true,
  alchemyGasSponsorApiKey: 'YOUR_API_KEY',
  alchemyGasSponsorPolicyId: 'YOUR_POLICY_ID',
};

const executeResult = await abilityClient.execute(executeParams, {
  delegatorPkpEthAddress: '0x...', // The Vincent App User's Vincent Wallet address
});

if (executeResult.success) {
  const result = executeResult.result;

  console.log('Transaction hash:', result.txHash);
  console.log('Operation:', result.operation);
  console.log('Vault address:', result.vaultAddress);
  console.log('Amount:', result.amount);
  console.log('Timestamp:', result.timestamp);
} else {
  // Handle different types of failures
  if (executeResult.runtimeError) {
    console.error('Runtime error:', executeResult.runtimeError);
  }
  if (executeResult.schemaValidationError) {
    console.error('Schema validation error:', executeResult.schemaValidationError);
  }
  if (executeResult.result) {
    console.error('Morpho execution failed:', executeResult.result.error);
  }
}
```

#### Execute Success Response

A successful `execute` response will contain:

```typescript
{
  /**
   * The transaction hash of the executed operation
   */
  txHash: string;
  /**
   * The type of Morpho operation that was executed
   */
  operation: 'deposit' | 'withdraw' | 'redeem';
  /**
   * The vault address involved in the operation
   */
  vaultAddress: string;
  /**
   * The amount of tokens/shares involved in the operation
   */
  amount: string;
  /**
   * The Unix timestamp when the operation was executed
   */
  timestamp: number;
}
```

#### Execute Failure Response

A failure `execute` response will contain:

```typescript
{
  /**
   * A string containing the error message if the execution failed
   */
  error: string;
}
```

## Supported Networks

The Morpho Ability supports operations on the following networks where Morpho vaults are deployed:

### Mainnets

- `ethereum` (chainId: `1`)
- `base` (chainId: `8453`)
- `arbitrum` (chainId: `42161`)
- `optimism` (chainId: `10`)
- `polygon` (chainId: `137`)

### Testnets

- `sepolia` (chainId: `11155111`)

## Important Considerations

### Amount Format

The `amount` parameter should be specified in human-readable format (e.g., "100.5" for 100.5 tokens), not in wei or smallest units.

### Vault Shares vs Underlying Assets

- For `deposit` and `withdraw`: Amount represents underlying assets (e.g., USDC)
- For `redeem`: Amount represents vault shares

### Gas Sponsorship

When using Alchemy gas sponsorship:

- Transactions are gasless for the Vincent App User's Vincent Wallet
- Requires valid Alchemy API key and policy ID
- Uses EIP-7702 for gasless transactions

### Chain Parameter vs RPC URL

- For `precheck`: You can provide either `chain` or `rpcUrl`
- For `execute`: Only `chain` is allowed, `rpcUrl` will cause an error

## Error Handling

Common failure scenarios include:

- **Insufficient Balance**: Not enough tokens for deposit or shares for withdrawal
- **Missing Approval**: Token not approved for Morpho vault contract
- **Invalid Vault**: Vault address doesn't exist or isn't a valid Morpho vault
- **Invalid Chain**: Chain not supported or vault not deployed on that chain
- **Gas Issues**: Insufficient native tokens for transaction gas fees
