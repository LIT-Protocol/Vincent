# Vincent Ability Morpho

A ability to interact with Morpho vaults (deposit, withdraw, redeem) from a Vincent app on behalf of the delegator.

## Overview

The Vincent Ability Morpho is part of the Vincent Abilities ecosystem and is built using the Vincent Ability SDK. It allows
Vincent apps to interact with Morpho vaults on behalf of users, enabling seamless integration with DeFi yield
strategies.

## Features

- Deposit assets into Morpho vaults
- Withdraw assets from Morpho vaults
- Redeem vault shares for underlying assets
- Support for multiple chains including Ethereum, Base, and Arbitrum
- Integration with spending limit policies for enhanced security

## Installation

```bash
npm install @lit-protocol/vincent-ability-morpho
```

## Usage

This ability can be used in Vincent apps to interact with Morpho vaults:

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-morpho';

// One of delegatee signers from your app's Vincent Dashboard
const delegateeSigner = new ethers.Wallet('YOUR_DELEGATEE_PRIVATE_KEY');

// Initialize the Vincent Ability Client
const abilityClient = getVincentAbilityClient({
  ethersSigner: delegateeSigner,
  bundledVincentAbility,
});
const delegatorPkpEthAddress = '0x09182301238'; // The delegator PKP Eth Address

const abilityParams = {
  operation: 'deposit', // 'deposit', 'withdraw', or 'redeem'
  vaultAddress: '0x1234...', // The Morpho vault address
  amount: '1.0', // Amount to deposit/withdraw/redeem
  chain: 'base', // The chain where the vault is deployed
  onBehalfOf: '0xabcd...', // Optional: address to receive vault shares (defaults to delegator)
};

// Run precheck to see if ability should be executed
const precheckResult = await client.precheck(abilityParams, {
  delegatorPkpEthAddress,
});

if (precheckResult.success === true) {
  // Execute the Vincent Ability
  const executeResult = await client.execute(abilityParams, {
    delegatorPkpEthAddress,
  });

  // ...ability has executed, you can check `executeResult` for details
}
```

## Prerequisites

Before executing vault operations, ensure that:

1. The user has approved the vault to spend their tokens (for deposits)
2. The user has sufficient balance of the required tokens
3. The user has delegated permission to the Vincent app to execute operations

You can use the Vincent Ability ERC20 Approval to handle token approvals

## Vault Operations

The ability supports the following operations on Morpho vaults:

- **DEPOSIT** - Deposit assets into a Morpho vault to earn yield
- **WITHDRAW** - Withdraw assets from a Morpho vault
- **REDEEM** - Redeem vault shares for underlying assets

## Parameters

| Parameter      | Type                                  | Required | Description                                              |
| -------------- | ------------------------------------- | -------- | -------------------------------------------------------- |
| `operation`    | `"deposit" \| "withdraw" \| "redeem"` | ✅       | The vault operation to perform                           |
| `vaultAddress` | `string`                              | ✅       | Morpho vault contract address (0x format)                |
| `amount`       | `string`                              | ✅       | Amount as string (assets for deposit, shares for redeem) |
| `chain`        | `string`                              | ✅       | Chain identifier (e.g., "base")                          |
| `onBehalfOf`   | `string`                              | ❌       | Address to receive tokens (defaults to sender)           |
| `rpcUrl`       | `string`                              | ❌       | Custom RPC URL (for precheck validation)                 |

## Supported Networks

The ability supports all chains where Morpho is deployed, including:

- Ethereum Mainnet
- Base
- Arbitrum
- Optimism
- Polygon

## Building

Run `nx build ability-morpho` to build the library.

## Testing

Run `nx test ability-morpho` to execute the unit tests via [Jest](https://jestjs.io).

For end-to-end testing with the Vincent SDK:

```bash
nx e2e ability-morpho-e2e
```

## Contributing

Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
