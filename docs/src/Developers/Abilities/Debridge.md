---
title: deBridge
---

# deBridge

The deBridge Ability enables Vincent Apps to bridge tokens across multiple blockchains using the deBridge protocol on behalf of Vincent Users. This allows Vincent Apps to facilitate cross-chain transfers without requiring users to manually approve each bridging transaction.

## Key Features

- **Secure Cross-Chain Bridging**: Bridges tokens across multiple EVM-compatible chains using Vincent Wallets
- **Native and ERC-20 Token Support**: Supports both native tokens (ETH, MATIC, etc.) and ERC-20 tokens
- **Automatic Quote Fetching**: Retrieves real-time quotes from deBridge API for accurate fee estimation
- **Multi-Chain Support**: Works across Ethereum, Base, Arbitrum, Optimism, Polygon, BSC, and Avalanche

## How It Works

The deBridge Ability is built using the [Vincent Ability SDK](../Ability-Developers/Creating-Abilities.md) and operates in two phases:

1. **Precheck Phase**: Validates all prerequisites for the bridge operation
   - Validates source and destination chain IDs and token addresses
   - Ensures source and destination chains are different
   - Verifies the user has sufficient balance of the source token
   - Checks token allowance for ERC-20 tokens (if needed)
   - Fetches quote from deBridge API with estimated fees and execution time
   - Returns bridge details including estimated destination amount and fees

2. **Execution Phase**: Executes the cross-chain bridge transaction
   - Verifies token allowance for ERC-20 tokens (if needed)
   - Retrieves transaction data from deBridge API
   - Signs and submits the bridge transaction to the source chain
   - Returns transaction hash, bridge information, and order ID for tracking

## Getting Started

Depending on your role in the Vincent Ecosystem, you'll be interacting with this Ability in different ways. Click on the link below that matches your role to see how to get started:

- **Vincent App Developers**: If you're building a Vincent App that needs to bridge tokens across chains, go [here](#adding-the-ability-to-your-vincent-app).
- **Vincent App Delegatees**: If you're executing this ability on behalf of Vincent App Users, go [here](#executing-the-ability-as-a-delegatee).

## Adding the Ability to your Vincent App

If you want to enable your App Delegatees to bridge tokens across chains on behalf of your Vincent App Users, you can add this Ability to your App.

Adding Abilities to your Vincent App is done using the [Vincent App Dashboard](https://dashboard.heyvincent.ai/). Visit the [Create Vincent App](../App-Agent-Developers/Creating-Apps.md) guide to learn more about how to add Abilities to your App during creation, or check out the [Upgrading Your App](../App-Agent-Developers/Upgrading-Apps.md) guide to learn how to add Abilities to an existing App.

## Executing the Ability as a Vincent App Delegatee

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>To learn more about executing Vincent Abilities, see the <a href="../App-Agent-Developers/Executing-Abilities.md">Executing Abilities</a> guide.</p>
</div>

### Prerequisites

Before executing the Ability, the following conditions must be met. You can use the Ability's `precheck` function to check if these conditions are met, or you can check them manually.

#### Native/ERC20 Token Balance

The Vincent App User's Vincent Wallet must have sufficient balance of the source token to cover the bridge amount plus any protocol fees.

#### Gas Balance

The Vincent Wallet must have sufficient native tokens on the source chain to pay for the bridge transaction gas fees.

#### ERC-20 Token Approval

For ERC-20 token transfers, the Vincent App User's Vincent Wallet must have approved the deBridge contract to spend the source token.

If your Vincent App has enabled the [ERC20 Approval Ability](./Erc20Approval.md), you can use it to handle submitting the approval transaction using the Vincent Wallet.

### Executing the `precheck` Function

This Ability's `precheck` function validates all prerequisites for executing a cross-chain bridge operation and provides quote information.

Before executing the `precheck` function, you'll need to provide the following parameters for the bridge operation:

```typescript
{
  /**
   * RPC URL for the source chain
   */
  rpcUrl: string;
  /**
   * Source chain ID (e.g., '1' for Ethereum, '8453' for Base)
   */
  sourceChain: string;
  /**
   * Destination chain ID (e.g., '1' for Ethereum, '8453' for Base)
   */
  destinationChain: string;
  /**
   * Source token address
   * (use 0x0000000000000000000000000000000000000000 for native token)
   */
  sourceToken: string;
  /**
   * Destination token address
   * (use 0x0000000000000000000000000000000000000000 for native token)
   */
  destinationToken: string;
  /**
   * Amount to bridge in smallest token unit (e.g., '1000000000000000000' for 1 ETH)
   */
  amount: string;
  /**
   * Slippage tolerance in basis points (100 = 1%). Optional, defaults to 100.
   */
  slippageBps?: number;
}
```

To execute `precheck`, you'll need to:

- Create an instance of the `VincentAbilityClient` using the `getVincentAbilityClient` function (imported from `@lit-protocol/vincent-app-sdk/abilityClient`)
  - Pass in the Ability's `bundledVincentAbility` object (imported from `@lit-protocol/vincent-ability-debridge`)
  - Pass in the `ethersSigner` you'll be using to sign the request to Lit with your Delegatee private key
- Prepare the required parameters to call the `precheck` function
- Use the `VincentAbilityClient` instance to call the `precheck` function

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>To learn more about executing Vincent Abilities, see the <a href="../App-Agent-Developers/Executing-Abilities.md">Executing Abilities</a> guide.</p>
</div>

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-debridge';

// Create ability client
const abilityClient = getVincentAbilityClient({
  bundledVincentAbility: bundledVincentAbility,
  ethersSigner: yourEthersSigner,
});

// Prepare bridge parameters - Example: Bridge 0.1 ETH from Base to Arbitrum
const bridgeParams = {
  rpcUrl: 'https://mainnet.base.org',
  sourceChain: '8453', // Base
  destinationChain: '42161', // Arbitrum
  sourceToken: '0x0000000000000000000000000000000000000000', // Native ETH
  destinationToken: '0x0000000000000000000000000000000000000000', // Native ETH
  amount: '100000000000000000', // 0.1 ETH in wei
  slippageBps: 100, // 1% slippage
};

const precheckResult = await abilityClient.precheck(bridgeParams, {
  delegatorPkpEthAddress: '0x...', // The Vincent App User's Vincent Wallet address
});

if (precheckResult.success) {
  const { data } = precheckResult.result;
  console.log('Estimated destination amount:', data.estimatedDestinationAmount);
  console.log('Protocol fee:', data.estimatedFees.protocolFee);
  console.log('Estimated execution time:', data.estimatedExecutionTime + ' seconds');
} else {
  // Handle different types of failures
  if (precheckResult.runtimeError) {
    console.error('Runtime error:', precheckResult.runtimeError);
  }
  if (precheckResult.schemaValidationError) {
    console.error('Schema validation error:', precheckResult.schemaValidationError);
  }
  if (precheckResult.result) {
    console.error('Bridge precheck failed:', precheckResult.result.error);
  }
}
```

#### Precheck Success Response

A successful `precheck` response will contain detailed bridge information:

```typescript
{
  data: {
    /**
     * Source chain ID
     */
    sourceChain: string;
    /**
     * Destination chain ID
     */
    destinationChain: string;
    /**
     * Source token address
     */
    sourceToken: string;
    /**
     * Destination token address
     */
    destinationToken: string;
    /**
     * Amount being sent in smallest token unit
     */
    sourceAmount: string;
    /**
     * Estimated amount to be received on destination chain
     */
    estimatedDestinationAmount: string;
    /**
     * Estimated fees for the transaction
     */
    estimatedFees: {
      /**
       * Protocol fee in smallest token unit
       */
      protocolFee: string;
    }
    /**
     * Estimated time for the bridge operation in seconds
     */
    estimatedExecutionTime: string;
  }
}
```

#### Precheck Failure Response

A failure `precheck` response will contain:

```typescript
{
  /**
   * Error message describing why the precheck failed
   */
  error: string;
}
```

### Executing the `execute` Function

This Ability's `execute` function performs the actual cross-chain bridge transaction.

The `execute` function expects the same parameters as the `precheck` function, and can be executed using the same `VincentAbilityClient` instance:

```typescript
const executeResult = await abilityClient.execute(bridgeParams, {
  delegatorPkpEthAddress: '0x...', // The Vincent App User's Vincent Wallet address
});

if (executeResult.success) {
  const { data } = executeResult.result;

  console.log('Bridge transaction hash:', data.txHash);
  console.log('Order ID for tracking:', data.orderId);
  console.log('Bridged amount:', data.sourceAmount);
} else {
  // Handle different types of failures
  if (executeResult.runtimeError) {
    console.error('Runtime error:', executeResult.runtimeError);
  }
  if (executeResult.schemaValidationError) {
    console.error('Schema validation error:', executeResult.schemaValidationError);
  }
  if (executeResult.result) {
    console.error('Bridge execution failed:', executeResult.result.error);
  }
}
```

#### Execute Success Response

A successful `execute` response will contain:

```typescript
{
  data: {
    /**
     * Transaction hash of the bridge transaction
     */
    txHash: string;
    /**
     * Source chain ID
     */
    sourceChain: string;
    /**
     * Destination chain ID
     */
    destinationChain: string;
    /**
     * Source token address
     */
    sourceToken: string;
    /**
     * Destination token address
     */
    destinationToken: string;
    /**
     * Amount sent in smallest token unit
     */
    sourceAmount: string;
    /**
     * Order ID for tracking the bridge transaction (optional)
     */
    orderId?: string;
  };
}
```

#### Execute Failure Response

A failure `execute` response will contain:

```typescript
{
  /**
   * Error message describing why the execution failed
   */
  error: string;
}
```

## Supported Networks

The deBridge Ability supports bridging between the following networks:

- Ethereum: Chain ID: `1`
- Base: Chain ID: `8453`
- Arbitrum: Chain ID: `42161`
- Optimism: Chain ID: `10`
- Polygon: Chain ID: `137`
- BSC: Chain ID: `56`
- Avalanche: Chain ID: `43114`

## Important Considerations

### Native Token Addresses

When bridging native tokens (ETH, MATIC, etc.), use the zero address: `0x0000000000000000000000000000000000000000`

### Amount Format

The `amount` parameter must be specified in the token's smallest unit:

- For ETH: Use wei (`1` ETH = `1000000000000000000` wei)
- For USDC: Use micro-units (`1` USDC = `1000000` micro-USDC)
- For tokens with 18 decimals: Multiply by `10^18`

### Cross-Chain Execution Time

Bridge operations are not instantaneous. The `estimatedExecutionTime` from the precheck provides an estimate, but actual times can vary based on network congestion and the specific token pair.

### Order Tracking

The `orderId` returned from successful executions can be used to track the bridge status through deBridge's tracking interface or API.

### Fees

Bridge operations include protocol fees that are automatically deducted from the source amount. The precheck response provides fee estimates, but final fees may vary slightly.

## Error Handling

Common failure scenarios include:

- **Invalid Chain IDs**: Source or destination chain not supported by deBridge
- **Insufficient Balance**: The Vincent App User's Vincent Wallet doesn't have enough source tokens
- **Missing Approval**: For ERC-20 tokens, insufficient allowance for deBridge contract
- **Same Chain**: Source and destination chains cannot be the same
- **API Issues**: deBridge API temporarily unavailable or returning errors
- **Gas Issues**: Insufficient native tokens for transaction gas fees
