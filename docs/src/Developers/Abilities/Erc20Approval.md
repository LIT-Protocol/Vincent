---
title: ERC20 Approval
---

# ERC20 Approval

The ERC20 Approval Ability enables Vincent Apps to manage ERC20 token allowances on behalf of Vincent Users. This is generally a prerequisite for many DeFi operations like swaps, lending, and liquidity provision.

## Key Features

- **Secure Transaction Signing**: Signs ERC20 Approval transaction using Vincent Wallets within a secure Trusted Execution Environment
- **Intelligent Allowance Checking**: Automatically checks existing allowances to avoid unnecessary transactions
- **Gas Balance Verification**: Ensures the Vincent Wallet has some native tokens to pay for gas fees

## How It Works

The ERC20 Approval Ability is built using the [Vincent Ability SDK](../Ability-Developers/Creating-Abilities.md) and operates in two phases:

1. **Precheck Phase**: Validates the request and checks existing allowances
   - Verifies the user has a non-zero native token balance for gas fees
   - Retrieves the current allowance for the specified spender and token
   - Returns whether the requested amount is already approved, and what the current allowance is

2. **Execution Phase**: If needed, creates and submits the approval transaction
   - If the current allowance already matches the requested amount, returns success without creating a new transaction
   - Otherwise, creates and signs an ERC20 approve transaction for the exact requested amount
   - Returns the transaction hash and approval details

## Getting Started

Depending on your role in the Vincent Ecosystem, you'll be interacting with this Ability in different ways. Click on the link below that matches your role to see how to get started:

- **Vincent App Developers**: If you're building a Vincent App that needs to manage token approvals, go [here](#adding-the-ability-to-your-vincent-app).
- **Vincent App Delegatees**: If you're executing this ability on behalf of Vincent App Users, go [here](#executing-the-ability-as-a-delegatee).

## Adding the Ability to your Vincent App

If you want to enable your App Delegatees to manage ERC20 token approvals on behalf of your Vincent App Users, you can add this Ability to your App.

Adding Abilities to your Vincent App is done using the [Vincent App Dashboard](https://dashboard.heyvincent.ai/). Visit the [Create Vincent App](../App-Agent-Developers/Creating-Apps.md) guide to learn more about how to add Abilities to your App during creation, or check out the [Upgrading Your App](../App-Agent-Developers/Upgrading-Apps.md) guide to learn how to add Abilities to an existing App.

## Executing the Ability as a Vincent App Delegatee

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>To learn more about executing Vincent Abilities, see the <a href="../App-Agent-Developers/Executing-Abilities.md">Executing Abilities</a> guide.</p>
</div>

### Prerequisites

Before executing an ERC20 approval, the following conditions must be met. You can use the Ability's `precheck` function to check if these conditions are met, or you can check them manually.

#### Gas Balance

The Vincent App User's Vincent Wallet must have sufficient native tokens (ETH, MATIC, etc.) to pay for the approval transaction gas fees.

#### Valid Token Contract

The specified token address must be a valid ERC20 contract on the target network that implements the standard `approve` function.

#### Network Configuration

The RPC URL must be valid and accessible for the specified chain ID, and the network must support ERC20 token operations.

### Executing the `precheck` Function

This Ability's `precheck` function is used to check if the Vincent Wallet has a non-zero native token balance for gas fees, and if the spender already has sufficient allowance for the requested amount.

Before executing the `precheck` function, you'll need to provide the following parameters for the ERC20 token approval transaction:

```typescript
{
  /**
   * The RPC URL to use for the transaction.
   * Must support the chainId specified.
   */
  rpcUrl: string;
  /**
   * The chain ID to execute the transaction on.
   * For example: 8453 for Base.
   */
  chainId: number;
  /**
   * The spender address to approve.
   * For example 0x2626664c2603336E57B271c5C0b26F421741e481 for the Uniswap v3 Swap Router contract on Base.
   */
  spenderAddress: string;
  /**
   * ERC20 Token address to approve.
   * For example 0x4200000000000000000000000000000000000006 for WETH on Base.
   */
  tokenAddress: string;
  /**
   * ERC20 Token to approve decimals.
   * For example 18 for WETH on Base.
   */
  tokenDecimals: number;
  /**
   * Amount of tokenIn to approve.
   * Cannot be a negative number.
   * For example 0.00001 for 0.00001 WETH.
   */
  tokenAmount: number;
}
```

To execute `precheck`, you'll need to:

- Create an instance of the `VincentAbilityClient` using the `getVincentAbilityClient` function (imported from `@lit-protocol/vincent-app-sdk/abilityClient`)
  - Pass in the Ability's `bundledVincentAbility` object (imported from `@lit-protocol/vincent-ability-erc20-approval`)
  - Pass in the `ethersSigner` you'll be using to sign the request to Lit with your Delegatee private key
- Prepare the required parameters to call the `precheck` function
- Use the `VincentAbilityClient` instance to call the `precheck` function

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-erc20-approval';

// Create ability client
const abilityClient = getVincentAbilityClient({
  bundledVincentAbility: bundledVincentAbility,
  ethersSigner: yourEthersSigner,
});

// Prepare approval parameters
const approvalParams = {
  rpcUrl: 'https://mainnet.base.org', // RPC URL for the network
  chainId: 8453, // Chain ID (e.g., 8453 for Base)
  spenderAddress: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap v3 Router on Base
  tokenAddress: '0x4200000000000000000000000000000000000006', // WETH on Base
  tokenDecimals: 18, // Token decimals
  tokenAmount: 0.1, // Amount to approve (in human-readable format)
};

const precheckResult = await abilityClient.precheck(approvalParams, {
  delegatorPkpEthAddress: '0x...', // The Vincent App User's Vincent Wallet address
});

if (precheckResult.success) {
  const { alreadyApproved, currentAllowance } = precheckResult.result;
  if (alreadyApproved) {
    console.log('Already approved with allowance:', currentAllowance);
  } else {
    console.log('Current allowance:', currentAllowance);
    console.log('Approval needed, proceed to execute');
  }
} else {
  // Handle different types of failures
  if (precheckResult.runtimeError) {
    console.error('Runtime error:', precheckResult.runtimeError);
  }
  if (precheckResult.schemaValidationError) {
    console.error('Schema validation error:', precheckResult.schemaValidationError);
  }
  if (precheckResult.result) {
    console.error('ERC20 approval precheck failed:', precheckResult.result.reason);
  }
}
```

#### Precheck Success Response

A success `precheck` response will contain:

```typescript
{
  /**
   * Boolean indicating if the spender already has sufficient allowance.
   */
  alreadyApproved: boolean;
  /**
   * The current allowance amount as a string
   * in the smallest unit (e.g., "10000000000000000" for 0.01 ETH)
   */
  currentAllowance: string;
}
```

#### Precheck Failure Response

A failure `precheck` response will contain:

```typescript
{
  /**
   * Boolean indicating if the user has enough native token to pay for gas fees.
   */
  noNativeTokenBalance: boolean;
}
```

### Executing the `execute` Function

This Ability's `execute` function creates and submits the ERC20 approval transaction only if the current allowance is less than the requested amount.

The `execute` function expects the same parameters as the `precheck` function, and can be executed using the same `VincentAbilityClient` instance:

```typescript
const executeResult = await abilityClient.execute(approvalParams, {
  delegatorPkpEthAddress: '0x...', // The Vincent App User's Vincent Wallet address
});

if (executeResult.success) {
  const { approvalTxHash, approvedAmount, tokenAddress, tokenDecimals, spenderAddress } =
    executeResult.result;

  if (approvalTxHash) {
    console.log('Approval transaction:', approvalTxHash);
    console.log('Approved amount:', approvedAmount);
  } else {
    console.log('Used existing approval, amount:', approvedAmount);
  }
} else {
  // Handle different types of failures
  if (executeResult.runtimeError) {
    console.error('Runtime error:', executeResult.runtimeError);
  }
  if (executeResult.schemaValidationError) {
    console.error('Schema validation error:', executeResult.schemaValidationError);
  }
  if (executeResult.result) {
    console.error('ERC20 approval execution failed:', executeResult.result.error);
  }
}
```

#### Precheck Success Response

A successful `execute` response will contain:

```typescript
{
  /**
   * Transaction hash if a new approval was created
   * If the current allowance already satisfies the requested amount,
   * this will be undefined
   */
  approvalTxHash?: string;
  /**
   * The approved amount that is now active (either from existing or new approval)
   * in the smallest unit (e.g., "10000000000000000" for 0.01 ETH)
   */
  approvedAmount: string;
  /**
   * The token address that was approved
   */
  tokenAddress: string;
  /**
   * The number of decimals for the token that was approved
   * For example 18 for WETH on Base.
   */
  tokenDecimals: number;
  /**
   * The address approved to spend approvedAmount of tokens
   */
  spenderAddress: string;
}
```

#### Precheck Failure Response

A failure `execute` response will contain:

```typescript
{
  /**
   * A string containing the error message if the execution failed.
   */
  error: string;
}
```

## Important Considerations

### Gas Requirements

The Vincent App User's Vincent Wallet must have sufficient native tokens (ETH, MATIC, etc.) to pay for the approval transaction gas fees. The precheck function will verify this and return an error if the balance is insufficient.

### Approval Amounts

- The ability approves the exact amount requested, not unlimited amounts
- If you need to change an existing approval, the new amount will replace the old one
- To revoke an approval, set the amount to 0

### Network Configuration

- Ensure the `rpcUrl` provided supports the specified `chainId`
- The ability works with any EVM-compatible network

## Helper Functions

The ability package exports helper functions that can be used independently:

```typescript
import {
  getCurrentAllowance,
  checkNativeTokenBalance,
} from '@lit-protocol/vincent-ability-erc20-approval';

// Check current allowance
const allowance = await getCurrentAllowance({
  provider: ethersProvider,
  tokenAddress: '0x...',
  owner: '0x...', // Token owner address
  spender: '0x...', // Spender address
});

// Check native token balance
const hasBalance = await checkNativeTokenBalance({
  provider: ethersProvider,
  pkpEthAddress: '0x...',
});
```
