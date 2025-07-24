# Vincent Policy: Contract Whitelist

A Vincent Policy that restricts the signing of EVM transactions to a predefined whitelist of contract addresses and function selectors across multiple chains.

## How It Works

### Validation Process

The policy:

1. Deserializes the incoming transaction
2. Extracts the chain ID, target contract address, and function selector
3. Checks if the chain ID is in the whitelist
4. Verifies the contract address is whitelisted for that chain
5. Confirms the function selector is allowed for that contract (either explicitly listed or via wildcard)

### Whitelist Structure

The whitelist is organized hierarchically:

```
whitelist
├── [chainId]
│   ├── [contractAddress]
│   │   └── functionSelectors: string[]
```

## Configuration

### Schema Definition

The policy uses two main schemas:

**Tool Parameters** (what the tool provides):

```typescript
{
  serializedTransaction: string; // The serialized transaction to validate
}
```

**User Parameters** (what the user configures):

```typescript
{
  whitelist: {
    [chainId: string]: {
      [contractAddress: string]: {
        functionSelectors: string[]; // Array of function selectors or '*' for all functions
      }
    }
  }
}
```

### Example Configuration

```typescript
const policyConfig = {
  whitelist: {
    // Ethereum Mainnet
    '1': {
      // WETH Contract - Specific functions only
      '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': {
        functionSelectors: [
          '0xa9059cbb', // transfer(address,uint256)
          '0x23b872dd', // transferFrom(address,address,uint256)
        ],
      },
      // USDC Contract - Single function only
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': {
        functionSelectors: [
          '0xa9059cbb', // transfer(address,uint256)
        ],
      },
    },
    // Base Mainnet
    '8453': {
      // Base WETH - All functions allowed via wildcard
      '0x4200000000000000000000000000000000000006': {
        functionSelectors: ['*'], // Allow ALL functions for this contract
      },
      // Another contract with mixed approach
      '0x1234567890123456789012345678901234567890': {
        functionSelectors: [
          '0xa9059cbb', // transfer(address,uint256) - explicitly allowed
          '*', // Plus all other functions via wildcard
        ],
      },
    },
  },
};
```

### Wildcard Support

The policy supports using `'*'` as a wildcard to allow all functions for a specific contract:

- **Specific selectors only**: `['0xa9059cbb', '0x23b872dd']` - Only these exact functions are allowed
- **Wildcard only**: `['*']` - All functions are allowed for this contract
- **Mixed approach**: `['0xa9059cbb', '*']` - All functions are allowed (wildcard takes precedence)

**Security Note**: Use wildcards carefully! Only use `'*'` for contracts you fully trust, as it allows any function call to that contract.

## Integration with Tools

The Contract Whitelist Policy is designed to work seamlessly with Vincent tools, particularly the [Transaction Signer Tool](../tool-transaction-signer/README.md):

```typescript
import { createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-contract-whitelist';

const ContractWhitelistPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: {
    serializedTransaction: 'serializedTransaction',
  },
});
```

See the comprehensive E2E test in [contract-whitelist.spec.ts](../toolpolicies-e2e/test-e2e/contract-whitelist.spec.ts) for a complete example of:

- Setting up permissions and the Contract Whitelist Policy
- Executing the Transaction Signer Tool
- Validating the signed transaction
- Broadcasting the signed transaction to the network

## Output Schemas

### Precheck/Evaluation Allow Result

```typescript
{
  chainId: number; // The validated chain ID
  contractAddress: string; // The validated contract address
  functionSelector: string; // The validated function selector
  wildcardUsed: boolean; // Whether the wildcard "*" was used to allow this function
}
```

The `wildcardUsed` property indicates whether the transaction was allowed through the wildcard (`'*'`) or through an explicit function selector:

- `true`: The function was allowed via wildcard (function selector not explicitly listed)
- `false`: The function was explicitly whitelisted (even if wildcard is also present)

This information is valuable for auditing and security monitoring purposes.

### Precheck/Evaluation Deny Result

```typescript
{
  reason: string;                    // Why the transaction was denied
  chainId?: number;                  // The chain ID (if available)
  contractAddress?: string;          // The contract address (if available)
  functionSelector?: string;         // The function selector (if available)
}
```

## Error Messages

The policy provides clear error messages:

- `"to property of serialized transaction not provided"` - Missing recipient address
- `"Chain ID not whitelisted"` - The blockchain network is not in the whitelist
- `"Function selector not whitelisted"` - The contract or function is not allowed

## Building

Run `nx build policy-contract-whitelist` to build the library.

## Running E2E tests

Run `nx run toolpolicies-e2e:test-e2e packages/apps/toolpolicies-e2e/test-e2e/contract-whitelist.spec.ts` to execute the E2E tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
