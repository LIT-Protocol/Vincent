---
title: ERC20 Transfer
---

# ERC20 Transfer

The ERC20 Transfer Ability enables Vincent Apps to send ERC20 tokens on behalf of Vincent Users
using their Vincent Wallet (PKP). It performs thorough prechecks, enforces policy constraints, and
executes transfers securely inside Lit Actions.

## Key Features

- Secure transaction signing with Vincent Wallets (PKP)
- Automatic token decimals detection from the token contract
- Balance checks for both native gas and token amounts
- Policy integration (e.g., send-counter rate limiting)
- Clear success and error result schemas

## How It Works

The ERC20 Transfer Ability is built using
the [Vincent Ability SDK](../Ability-Developers/Creating-Abilities.md) and operates in two phases:

1. Precheck Phase

- Validates recipient address, token address, and amount
- Requires a valid `rpcUrl` to connect to the network
- Reads token `decimals` from the contract and parses the amount accordingly
- Checks the Vincent Wallet token balance and estimates transfer gas, then verifies native balance
  is sufficient

2. Execution Phase

- Uses the provided `chain` name to obtain an RPC via `Lit.Actions.getRpcUrl({ chain })`
- Reads token `decimals` and parses the amount to smallest units
- Commits allowed policies (e.g., rate-limiting) before the transfer
- Calls `transfer(to, amount)` on the ERC-20 contract via laUtils and returns the `txHash`

## Getting Started

Depending on your role in the Vincent Ecosystem, you'll interact with this Ability differently:

- Vincent App Developers: Learn how to add Abilities to your app in
  the [Create Vincent App](../App-Agent-Developers/Creating-Apps.md) guide, or
  the [Upgrading Your App](../App-Agent-Developers/Upgrading-Apps.md) guide.
- Vincent App Delegatees: Learn how to execute Abilities in
  the [Executing Abilities](../App-Agent-Developers/Executing-Abilities.md) guide.

## Parameters

Both `precheck` and `execute` expect the same parameters (as defined by the ability schema):

```typescript
{
  /** RPC URL used for precheck validations */
  rpcUrl: string;
  /** Chain name used during execute (e.g., 'base', 'ethereum', 'polygon') */
  chain: string;
  /** Recipient address */
  to: string;
  /** ERC-20 token contract address */
  tokenAddress: string;
  /** Amount in human-readable string (e.g., "1.23") */
  amount: string;
}
```

Notes:

- `amount` must be a positive decimal string.
- Token decimals are read from the token contract; you do not pass `tokenDecimals`.

## Executing the Ability as a Vincent App Delegatee

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>To learn more about executing Vincent Abilities, see the <a href="../App-Agent-Developers/Executing-Abilities.md">Executing Abilities</a> guide.</p>
</div>

### Precheck

Use `precheck` to validate parameters and balances before sending a transfer.

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-erc20-transfer';

// Create ability client
const abilityClient = getVincentAbilityClient({
  bundledVincentAbility,
  ethersSigner: yourEthersSigner,
});

// Prepare parameters
const params = {
  rpcUrl: 'https://base.llamarpc.com',
  chain: 'base',
  to: '0x1234...abcd',
  tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  amount: '10.5',
};

const precheck = await abilityClient.precheck(params, {
  delegatorPkpEthAddress: '0x...', // The Vincent Wallet (PKP) address
});

if (precheck.success) {
  const { addressValid, amountValid, tokenAddressValid, estimatedGas, userBalance } =
    precheck.result;
  console.log(addressValid, amountValid, tokenAddressValid, estimatedGas, userBalance);
} else {
  console.error(
    'Precheck failed:',
    precheck.result?.error || precheck.runtimeError || precheck.schemaValidationError,
  );
}
```

Precheck success result:

```typescript
{
  addressValid: boolean;
  amountValid: boolean;
  tokenAddressValid: boolean;
  estimatedGas: string;
  userBalance: string;
}
```

Precheck failure result:

```typescript
{
  error: string;
}
```

### Execute

Execute the transfer after a successful precheck.

```typescript
const exec = await abilityClient.execute(params, {
  delegatorPkpEthAddress: '0x...',
});

if (exec.success) {
  const { txHash, to, amount, tokenAddress, timestamp } = exec.result;
  console.log(
    'Transfer tx:',
    txHash,
    'to:',
    to,
    'amount:',
    amount,
    'token:',
    tokenAddress,
    'at:',
    timestamp,
  );
} else {
  console.error(
    'Execute failed:',
    exec.result?.error || exec.runtimeError || exec.schemaValidationError,
  );
}
```

Execute success result:

```typescript
{
  txHash: string;
  to: string;
  amount: string;
  tokenAddress: string;
  timestamp: number;
}
```

Execute failure result:

```typescript
{
  error: string;
}
```

## Important Considerations

- Gas Requirements: The Vincent Wallet must have enough native tokens to pay for gas. Precheck
  attempts to estimate gas and compare against the wallet's native balance.
- Token Decimals: The ability reads `decimals` from the token contract; do not pass `tokenDecimals`.
- Chains: The `chain` parameter is used to obtain an RPC during execution via
  `Lit.Actions.getRpcUrl`. Use supported chain names (e.g., `base`, `ethereum`).
- Policies: The ability commits allowed policy updates before executing the transfer (e.g.,
  send-counter rate limiting).

## Policy Integration

This ability integrates with policy enforcement (e.g., send-counter). During `execute`, allowed
policies are committed before the transfer is sent to prioritize policy updates.
