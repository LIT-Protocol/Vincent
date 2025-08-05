# Vincent Aave Ability

A comprehensive DeFi ability for interacting with Aave v3 protocol on Ethereum, built for the Vincent
Scaffold SDK and Lit Actions execution environment.

## Overview

The Vincent Aave Ability enables secure, decentralized interactions with the Aave v3 lending protocol
through Lit Actions. It supports all core Aave operations: supplying assets as collateral, borrowing
against collateral, repaying debt, and withdrawing assets.

## Features

- Supply assets as collateral to earn interest
- Withdraw supplied assets
- Borrow against collateral with stable or variable rates
- Repay borrowed assets
- Multi-chain support (Ethereum, Polygon, Arbitrum, Optimism, Base, and more)
- Integrated with Vincent Ability SDK for secure execution

## Installation

```bash
npm install @lit-protocol/vincent-ability-aave
```

## Usage

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk';
import { bundledVincentAbility as aaveAbility } from '@lit-protocol/vincent-ability-aave';

// Initialize the ability client
const aaveAbilityClient = getVincentAbilityClient({
  bundledVincentAbility: aaveAbility,
  ethersSigner: yourSigner, // Your ethers signer
});

// Example: Supply WETH as collateral
const supplyParams = {
  operation: 'supply',
  asset: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c', // WETH on Sepolia
  amount: '0.01',
  chain: 'sepolia',
};

// First run precheck
const precheckRes = await aaveAbilityClient.precheck(supplyParams, {
  delegatorPkpEthAddress: pkpAddress,
});

if (precheckRes.success) {
  // Then execute
  const executeRes = await aaveAbilityClient.execute(supplyParams, {
    delegatorPkpEthAddress: pkpAddress,
  });

  if (executeRes.success) {
    console.log('Transaction hash:', executeRes.result.data.txHash);
  }
}
```

## Parameters

| Parameter          | Type                                            | Required | Description                                      |
| ------------------ | ----------------------------------------------- | -------- | ------------------------------------------------ |
| `operation`        | `"supply" \| "withdraw" \| "borrow" \| "repay"` | ✅       | The Aave operation to perform                    |
| `asset`            | `string`                                        | ✅       | Token contract address (0x format)               |
| `amount`           | `string`                                        | ✅       | Amount as a string (e.g., "1.5")                 |
| `chain`            | `string`                                        | ✅       | Chain identifier (e.g., "ethereum", "polygon")   |
| `interestRateMode` | `1 \| 2`                                        | ❌       | 1=Stable, 2=Variable (required for borrow/repay) |
| `rpcUrl`           | `string`                                        | ❌       | Custom RPC URL for precheck validation           |

## Prerequisites

- Node.js 16+ and npm/yarn
- Sufficient token balance for the operation
- Token approval for supply/repay operations
- Properly configured PKP wallet with required permissions

## Building

```bash
# Build the ability
npm run build

# Build all abilitys and policies
npm run vincent:build
```

## Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Reset test state
npm run test:reset
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on how
to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
