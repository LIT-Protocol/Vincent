# Vincent Relay.link Ability for Smart Accounts and EOAs

A Vincent ability for signing secure cross-chain bridge and swap transactions via Relay.link, supporting both smart accounts (EIP-4337) and EOA transactions through the Lit Actions execution environment.

## Overview

The Vincent Relay.link Ability enables secure transaction signing for Relay.link's cross-chain bridging and swapping functionality. It validates and signs both smart account user operations (UserOps) and standard EOA transactions, ensuring they target approved Relay.link execute contracts.

## Features

- Sign smart account user operations (EIP-4337/ERC-4337)
- Sign EOA transactions for Relay.link
- Transaction simulation and validation before signing
- Asset change tracking and validation
- Multi-chain support through Relay.link
- Integrated with Vincent Ability SDK for secure execution

**Note:** This ability validates and signs transactions but does not broadcast them. Broadcasting is the caller's responsibility, providing you with full control over transaction submission and error handling.

## Installation

```bash
npm install @lit-protocol/vincent-ability-relay-link-smart-account
```

## Usage

### Smart Account (UserOp) Example

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk';
import { bundledVincentAbility as relayLinkAbility } from '@lit-protocol/vincent-ability-relay-link-smart-account';

// Initialize the ability client
const relayLinkAbilityClient = getVincentAbilityClient({
  bundledVincentAbility: relayLinkAbility,
  ethersSigner: yourSigner,
});

// Example: Sign a user operation
const userOpParams = {
  alchemyRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
  userOp: {
    sender: '0x...',
    nonce: '0x0',
    callData: '0x...',
    // ... other UserOp fields
  },
  entryPointAddress: '0x0000000071727De22E5E9d8BAf0edAc6f37da032', // v0.7 EntryPoint (default)
};

// First run precheck
const precheckRes = await relayLinkAbilityClient.precheck(userOpParams, {
  delegatorPkpEthAddress: pkpAddress,
});

if (precheckRes.success) {
  // Then execute to get signature
  const executeRes = await relayLinkAbilityClient.execute(userOpParams, {
    delegatorPkpEthAddress: pkpAddress,
  });

  if (executeRes.success) {
    console.log('Signature:', executeRes.result.data.signature);
  }
}
```

### Relay.link Transaction Example

```typescript
import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

// Example: Sign a Relay.link transaction
const transactionParams = {
  alchemyRpcUrl: 'https://base-mainnet.g.alchemy.com/v2/YOUR_KEY',
  transaction: {
    from: '0x...', // Can be EOA or smart account
    to: '0x...', // Relay.link execute contract
    data: '0x...',
    value: '100000', // Decimal string
    chainId: 8453,
    maxFeePerGas: '1000000000',
    maxPriorityFeePerGas: '1000000000',
  },
};

// Precheck validates the transaction
const precheckRes = await relayLinkAbilityClient.precheck(transactionParams, {
  delegatorPkpEthAddress: pkpAddress,
});

if (!precheckRes.success) {
  throw new Error('Precheck failed');
}

// Execute signs the transaction
const executeRes = await relayLinkAbilityClient.execute(transactionParams, {
  delegatorPkpEthAddress: pkpAddress,
});

if (executeRes.success) {
  // The ability returns the signature - you must broadcast the transaction yourself
  const signature = executeRes.result.data.signature;

  // Broadcast using your preferred method (viem, ethers, etc.)
  const walletClient = createWalletClient({
    chain: base,
    transport: http(),
  });

  // Reconstruct and send the signed transaction
  // (Implementation depends on your transaction format and library)
}
```

## Parameters

### UserOp Parameters

| Parameter           | Type      | Required | Description                                            |
| ------------------- | --------- | -------- | ------------------------------------------------------ |
| `userOp`            | `UserOp`  | ✅       | EIP-4337 user operation to sign                        |
| `alchemyRpcUrl`     | `string`  | ✅       | Alchemy RPC URL for transaction simulation             |
| `entryPointAddress` | `Address` | ❌       | EntryPoint address (defaults to v0.7 standard address) |
| `relayLinkApiKey`   | `string`  | ❌       | Optional Relay.link API key for validation             |

### Transaction Parameters

| Parameter         | Type                   | Required | Description                                          |
| ----------------- | ---------------------- | -------- | ---------------------------------------------------- |
| `transaction`     | `RelayLinkTransaction` | ✅       | Relay.link transaction from quote API response       |
| `alchemyRpcUrl`   | `string`               | ✅       | Alchemy RPC URL for transaction simulation           |
| `allowedTargets`  | `string[]`             | ❌       | Additional allowed contract addresses for validation |
| `relayLinkApiKey` | `string`               | ❌       | Optional Relay.link API key for validation           |

**Note:** The ability signs the transaction but does not broadcast it. You are responsible for broadcasting the signed transaction and monitoring its status on-chain.

## Prerequisites

- Node.js 16+ and npm/yarn
- Alchemy API key for transaction simulation
- Properly configured PKP wallet with required permissions
- For Relay.link transactions: Supports both EOA and smart account transactions

## Building

```bash
# Build the ability
npm run build

# Build all abilities and policies
npm run vincent:build
```

## Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on how
to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
