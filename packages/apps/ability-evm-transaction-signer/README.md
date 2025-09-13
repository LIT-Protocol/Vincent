# Vincent Ability: EVM Transaction Signer

## Overview

The EVM Transaction Signer Ability enables Vincent Apps to sign Ethereum Virtual Machine (EVM) transactions on behalf of Vincent Users using their Vincent Agent Wallets. This enables Vincent Apps to interact with contracts even if there isn't an explicit Vincent Ability made for interacting with that contract.

This Vincent Ability is intended to be used with Vincent Policies, such as the [@lit-protocol/vincent-policy-contract-whitelist](../policy-contract-whitelist/) policy, to provide protections such as only signing transactions that interact with specific contracts and/or call specific functions on contract.

## Key Features

- **Secure Transaction Signing**: Signs transactions using Vincent Agent Wallets within Lit Protocol's secure Trusted Execution Environment
- **Full Transaction Support**: Handles all EVM transaction types including legacy, EIP-2930, and EIP-1559
- **Policy Integration**: Supports the Contract Whitelist Policy for restricting what transactions can be signed

## How It Works

The Transaction Signer Ability is built using the Vincent Ability SDK and provides a secure way to sign Ethereum transactions. Here's how it operates:

1. **Precheck Phase**: Validates the transaction structure and runs policy checks
   - Deserializes the provided serialized transaction using ethers.js
   - Validates all required fields are present (nonce, gasPrice, gasLimit, etc.)
   - Returns deserialized transaction details for review

2. **Execution Phase**: If permitted by the evaluated Policies, signs the serialized transaction
   - Signs the transaction using the Vincent Agent Wallet
   - Returns both the signed transaction hex and decoded signature components

### Workflow

1. **Precheck Phase**: Validates the transaction structure and runs policy checks
   - Deserializes the provided serialized transaction using ethers.js
   - Validates all required fields are present (nonce, gasPrice, gasLimit, etc.)
   - Returns deserialized transaction details for review

2. **Execution Phase**: If permitted by the evaluated Policies, signs the serialized transaction
   - Signs the transaction using the Vincent Agent Wallet
   - Returns both the signed transaction hex and decoded signature components

## Using the Ability

See the comprehensive E2E test in [contract-whitelist.spec.ts](../abilities-e2e/test-e2e/contract-whitelist.spec.ts) for a complete example of:

- Setting up permissions and the Contract Whitelist Policy
- Executing the Transaction Signer Ability
- Validating the signed transaction
- Broadcasting the signed transaction to the network

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-evm-transaction-signer';

// Create ability client
const abilityClient = getVincentAbilityClient({
  bundledVincentAbility: bundledVincentAbility,
  ethersSigner: yourEthersSigner,
});

// Create a transaction
const transaction = {
  to: '0x4200000000000000000000000000000000000006', // Base WETH
  value: '0x00',
  data: '0xa9059cbb...', // transfer function call
  chainId: 8453,
  nonce: 0,
  gasPrice: '0x...',
  gasLimit: '0x...',
};

// Serialize the transaction
const serializedTx = ethers.utils.serializeTransaction(transaction);

const precheckResult = await abilityClient.precheck(
  {
    serializedTransaction: serializedTx,
  },
  {
    delegatorPkpEthAddress: '0x...', // The Agent Wallet PKP that will sign
  },
);

if (precheckResult.success) {
  const { deserializedUnsignedTransaction } = precheckResult.result;
  // Use the deserialized transaction
}

// Execute the ability
const executeResult = await abilityClient.execute(
  {
    serializedTransaction: serializedTx,
  },
  {
    delegatorPkpEthAddress: '0x...', // The Agent Wallet PKP that will sign
  },
);

if (executeResult.success) {
  const { signedTransaction, deserializedSignedTransaction } = executeResult.result;
  // Use the signed transaction
}
```

## Input/Output Schemas

### Ability Parameters

```typescript
{
  serializedTransaction: string; // The serialized unsigned transaction
}
```

### Precheck Success Output

```typescript
{
  deserializedUnsignedTransaction: {
    to?: string;
    nonce?: number;
    gasLimit: string;
    gasPrice?: string;
    data: string;
    value: string;
    chainId: number;
    type?: number;
    accessList?: any[];
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
  }
}
```

### Execution Success Output

```typescript
{
  signedTransaction: string; // The signed transaction ready for broadcast
  deserializedSignedTransaction: {
    hash?: string;
    to: string;
    from: string;
    nonce: number;
    gasLimit: string;
    gasPrice?: string;
    data: string;
    value: string;
    chainId: number;
    v: number;
    r: string;
    s: string;
    type?: number;
    accessList?: any[];
    maxPriorityFeePerGas?: string;
    maxFeePerGas?: string;
  }
}
```

## Building

Run `pnpx nx build ability-evm-transaction-signer` to build the Ability.

## Running E2E tests

Run `pnpx nx run abilities-e2e:test-e2e packages/apps/abilities-e2e/test-e2e/contract-whitelist.spec.ts` to execute the E2E tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
