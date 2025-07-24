# Vincent Tool: Transaction Signer

A secure transaction signing tool for Vincent Agent Wallets that leverages policy-based access control to ensure only whitelisted contract interactions can be signed.

## Overview

The Transaction Signer Tool enables Vincent Agent Wallets to sign Ethereum transactions with built-in security through the Contract Whitelist Policy. This tool is designed to prevent unauthorized contract interactions by validating transactions against a predefined whitelist before signing.

## How It Works

The tool is intended to be used with the `@lit-protocol/vincent-policy-contract-whitelist` policy to ensure transactions are only signed if the contract and function they are interacting with are whitelisted.

The policy validates that:

- The transaction's chain ID is whitelisted
- The target contract address is whitelisted for that chain
- The function selector (first 4 bytes of transaction data) is whitelisted for that contract

### Workflow

1. **Precheck Phase**:

   - Deserializes the input transaction
   - Validates transaction structure
   - Policy checks if the transaction meets whitelist criteria
   - Returns deserialized transaction details if successful

2. **Execution Phase**:
   - Performs the same validation as the precheck phase
   - Signs the transaction using the Agent Wallet
   - Returns both the signed transaction ready for broadcast, and the deserialized signed transaction

## Using the Tool

See the comprehensive E2E test in [contract-whitelist.spec.ts](../toolpolicies-e2e/test-e2e/contract-whitelist.spec.ts) for a complete example of:

- Setting up permissions and the Contract Whitelist Policy
- Executing the Transaction Signer Tool
- Validating the signed transaction
- Broadcasting the signed transaction to the network

```typescript
import { getVincentToolClient } from '@lit-protocol/vincent-app-sdk/toolClient';
import { bundledVincentTool } from '@lit-protocol/vincent-tool-transaction-signer';

// Create tool client
const toolClient = getVincentToolClient({
  bundledVincentTool: bundledVincentTool,
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

// Execute the tool
const result = await toolClient.execute(
  {
    serializedTransaction: serializedTx,
  },
  {
    delegatorPkpEthAddress: '0x...', // The PKP that will sign
  },
);

if (result.success) {
  const { signedTransaction, deserializedSignedTransaction } = result.result;
  // Use the signed transaction
}
```

## Input/Output Schemas

### Tool Parameters

```typescript
{
  serializedTransaction: string; // The serialized unsigned transaction
}
```

### Precheck Success Output

```typescript
{
  deserializedUnsignedTransaction: {
    to?: string | null;
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
    to?: string | null;
    from?: string | null;
    nonce: number;
    gasLimit: string;
    gasPrice?: string | null;
    data: string;
    value: string;
    chainId: number;
    v?: number;
    r?: string;
    s?: string;
    type?: number | null;
    accessList?: any[];
    maxPriorityFeePerGas?: string | null;
    maxFeePerGas?: string | null;
  }
}
```

## Building

Run `nx build tool-transaction-signer` to build the Tool.

## Running E2E tests

Run `nx run toolpolicies-e2e:test-e2e packages/apps/toolpolicies-e2e/test-e2e/contract-whitelist.spec.ts` to execute the E2E tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
