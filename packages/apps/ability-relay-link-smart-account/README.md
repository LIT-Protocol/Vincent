# Vincent Relay.link Ability for Smart Accounts and EOAs

A Vincent ability for signing secure cross-chain bridge and swap transactions via Relay.link, supporting both smart accounts (EIP-4337) and EOA transactions through the Vincent Scaffold SDK and Lit Actions execution environment.

## Overview

The Vincent Relay.link Ability enables secure transaction signing for Relay.link's cross-chain bridging and swapping functionality. It validates and signs both smart account user operations (UserOps) and standard EOA transactions, ensuring they target approved Relay.link execute contracts.

## Features

- Sign smart account user operations (EIP-4337/ERC-4337)
- Sign EOA transactions for Relay.link
- Transaction simulation and validation before signing
- Asset change tracking and validation
- Multi-chain support through Relay.link
- Integrated with Vincent Ability SDK for secure execution

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

### EOA Transaction Example

```typescript
// Example: Sign an EOA transaction
const transactionParams = {
  alchemyRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
  transaction: {
    from: '0x...', // Must match PKP address
    to: '0x...', // Relay.link execute contract
    data: '0x...',
    value: '0x0',
    chainId: 1,
  },
};

const executeRes = await relayLinkAbilityClient.execute(transactionParams, {
  delegatorPkpEthAddress: pkpAddress,
});
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

| Parameter         | Type          | Required | Description                                      |
| ----------------- | ------------- | -------- | ------------------------------------------------ |
| `transaction`     | `Transaction` | ✅       | EOA transaction to sign (must target Relay.link) |
| `alchemyRpcUrl`   | `string`      | ✅       | Alchemy RPC URL for transaction simulation       |
| `relayLinkApiKey` | `string`      | ❌       | Optional Relay.link API key for validation       |

## Prerequisites

- Node.js 16+ and npm/yarn
- Alchemy API key for transaction simulation
- Properly configured PKP wallet with required permissions
- For EOA transactions: PKP must match the transaction `from` address

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
