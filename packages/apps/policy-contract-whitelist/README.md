# Vincent Policy: Contract Whitelist

## Overview

The Contract Whitelist Policy is a Vincent Policy that restricts the signing of EVM transactions to a predefined whitelist of contract addresses and function selectors across multiple chains. This policy provides critical security controls for Vincent Agent Wallets by ensuring they can only interact with trusted contracts and approved functions.

This Vincent Policy is designed to work with Vincent Abilities, particularly the [@lit-protocol/vincent-ability-transaction-signer](../ability-transaction-signer/) ability, to provide granular control over which transactions can be signed.

## How It Works

The Contract Whitelist Policy is built using the Vincent Policy SDK and validates transactions against a hierarchical whitelist. Here's how it operates:

- **Input**: Receives a serialized EVM transaction from the ability
- **Parsing**: Uses `ethers.utils.parseTransaction` to extract transaction details
- **Extraction**: Gets the chain ID, target contract address, and function selector (first 4 bytes of `data` field)
- **Validation**: Checks against the whitelist hierarchy
  - **Whitelist Matching**: The policy checks in order:
    - Is the chain ID whitelisted?
    - Is the contract address whitelisted for that chain?
    - Is the function selector allowed (either explicitly or via wildcard `*`)?

## Example Configuration

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

## Integration with Abilities

The Contract Whitelist Policy is designed to work seamlessly with Vincent Abilities, particularly the [Transaction Signer Ability](../ability-transaction-signer/README.md):

```typescript
import { createVincentAbilityPolicy } from '@lit-protocol/vincent-ability-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-contract-whitelist';

const ContractWhitelistPolicy = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy,
  abilityParameterMappings: {
    serializedTransaction: 'serializedTransaction',
  },
});
```

See the comprehensive E2E test in [contract-whitelist.spec.ts](../abilities-e2e/test-e2e/contract-whitelist.spec.ts) for a complete example of:

- Setting up permissions and the Contract Whitelist Policy
- Executing the Transaction Signer Ability
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

## Building

Run `pnpx nx build policy-contract-whitelist` to build the library.

## Running E2E tests

Run `pnpx nx run abilities-e2e:test-e2e packages/apps/abilities-e2e/test-e2e/contract-whitelist.spec.ts` to execute the E2E tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
