# Vincent Relay.link Gated Signer Ability

A Vincent Ability that acts as a secure, gated signer for [Relay.link](https://relay.link) swap operations. It is designed to work with ERC-4337 Smart Accounts (UserOperations) and EOAs (Transactions).

## Overview

This ability validates transactions or UserOperations destined for the Relay.link protocol. It ensures that swap operations are safe and aligned with the user's intent before signing them with the delegated Vincent PKP.

It uses the `createVincentGatedSignerAbility` from `@lit-protocol/vincent-ability-sdk/gatedSigner` to enforce a strict validation lifecycle:

1. **Decode**: Decodes the transaction or userOperation calldata.
2. **Simulation**: Simulates the transaction/userOperation on-chain via Alchemy.
3. **Validation**:
   - Verifies interaction with authorized Relay.link contracts.
   - Checks for value extraction (no unexpected transfers or approvals).
   - Validates that ERC20 approvals only go to Relay.link contracts.
4. **Signing**: Signs the UserOperation (ECDSA or EIP-712) or Transaction (ECDSA) if all checks pass.

## Features

- **Smart Account Support**: Compatible with ZeroDev, Crossmint, Safe, and other ERC-4337 accounts.
- **EOA Support**: Can sign raw transactions for EOAs.
- **Protocol Safety**: Restricts interactions to Relay.link contracts.
- **Simulation-based Security**: Validates the actual on-chain effects of the transaction.
- **Helper Functions**: Includes utilities for building and submitting UserOps for each smart account provider.

## Installation

```bash
pnpm add @lit-protocol/vincent-ability-relay-link
```

## Usage

### Getting a Relay.link Quote

```typescript
import { getRelayLinkQuote } from '@lit-protocol/vincent-ability-relay-link';

const quote = await getRelayLinkQuote({
  user: '0x...', // Smart account or EOA address
  originChainId: 8453, // Base
  destinationChainId: 8453,
  originCurrency: '0x0000000000000000000000000000000000000000', // ETH
  destinationCurrency: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  amount: '10000000000000', // Amount in wei
  tradeType: 'EXACT_INPUT',
});
```

### Smart Account Helpers

The package exports helper functions for each supported smart account provider:

#### ZeroDev

```typescript
import {
  relayTransactionToUserOp,
  submitSignedUserOp,
} from '@lit-protocol/vincent-ability-relay-link';

// Build UserOp from relay transaction
const userOp = await relayTransactionToUserOp({
  permittedAddress: pkpAddress,
  serializedPermissionAccount: '...',
  transaction: txData,
  chain: base,
  zerodevRpcUrl: ZERODEV_RPC_URL,
});

// After signing with the ability, submit the UserOp
const { transactionHash } = await submitSignedUserOp({
  permittedAddress: pkpAddress,
  serializedPermissionAccount: '...',
  userOpSignature: signature,
  userOp,
  chain: base,
  zerodevRpcUrl: ZERODEV_RPC_URL,
});
```

#### Crossmint

```typescript
import {
  transactionsToCrossmintUserOp,
  sendPermittedCrossmintUserOperation,
} from '@lit-protocol/vincent-ability-relay-link';

// Build UserOp (supports batching multiple transactions)
const crossmintUserOp = await transactionsToCrossmintUserOp({
  crossmintClient,
  crossmintAccountAddress: smartAccountAddress,
  permittedAddress: pkpAddress,
  transactions: [{ to, data, value }],
  chain: base,
});

// After signing with the ability, submit the UserOp
const userOpHash = await sendPermittedCrossmintUserOperation({
  crossmintClient,
  accountAddress: smartAccountAddress,
  signature,
  signerAddress: pkpAddress,
  userOp: crossmintUserOp,
});
```

#### Safe

```typescript
import {
  transactionsToSafeUserOp,
  sendPermittedSafeUserOperation,
  formatSafeSignature,
  safeEip712Params,
} from '@lit-protocol/vincent-ability-relay-link';

// Build UserOp (supports batching multiple transactions)
const safeUserOp = await transactionsToSafeUserOp({
  safeAddress: smartAccountAddress,
  permittedAddress: pkpAddress,
  transactions: [{ to, data, value }],
  chain: base,
  safeRpcUrl: SAFE_RPC_URL,
  pimlicoRpcUrl: PIMLICO_RPC_URL,
});

// After signing with the ability, format and submit
const formattedSignature = formatSafeSignature({
  validAfter: 0,
  validUntil: 0,
  signature,
});

const txHash = await sendPermittedSafeUserOperation({
  signedUserOp: { ...safeUserOp, signature: formattedSignature },
  chain: base,
  pimlicoRpcUrl: PIMLICO_RPC_URL,
});
```

### Ability Parameters

#### For UserOperations (Smart Accounts)

```typescript
const abilityParams = {
  alchemyRpcUrl: 'https://...', // Required for simulation
  entryPointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  userOp: vincentUserOp,
  // Optional parameters for Safe/EIP-712
  safe4337ModuleAddress: '0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226',
  eip712Params: safeEip712Params,
  validAfter: 0,
  validUntil: 0,
};
```

#### For Transactions (EOA)

```typescript
const abilityParams = {
  alchemyRpcUrl: 'https://...', // Required for simulation
  transaction: {
    to: '0x...',
    data: '0x...',
    value: '0x...',
    from: '0x...',
    // ... other tx fields
  },
};
```

## Development

### Building

```bash
pnpm nx build ability-relay-link
```

### Unit Tests

```bash
pnpm nx test ability-relay-link
```

### E2E Tests

```bash
# Run EOA tests
pnpm nx run ability-relay-link:test-e2e

# Run all smart account tests
pnpm nx run ability-relay-link:test-e2e-smart-account

# Run specific provider tests
pnpm nx run ability-relay-link:test-e2e-smart-account:zerodev
pnpm nx run ability-relay-link:test-e2e-smart-account:crossmint
pnpm nx run ability-relay-link:test-e2e-smart-account:safe
```

### Required Environment Variables

For E2E tests, set the following in your `.env` file:

```bash
# Required for all tests
ALCHEMY_RPC_URL=https://base-mainnet.g.alchemy.com/v2/...

# ZeroDev
ZERODEV_RPC_URL=https://rpc.zerodev.app/api/v3/.../chain/8453
SMART_ACCOUNT_CHAIN_ID=8453

# Crossmint
CROSSMINT_API_KEY=...

# Safe
SAFE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/...
PIMLICO_RPC_URL=https://api.pimlico.io/v2/8453/rpc?apikey=...
```
