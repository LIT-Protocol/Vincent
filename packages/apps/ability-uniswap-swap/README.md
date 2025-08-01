# Vincent Ability Uniswap Swap

An ability to trigger swaps on Uniswap from a Vincent app on behalf of the delegator.

## Overview

The Vincent Ability Uniswap Swap is part of the Vincent Abilities ecosystem and is built using the Vincent Ability SDK. It allows Vincent apps to execute token swaps on Uniswap V3 on behalf of users, enabling seamless integration with decentralized exchange functionality.

## Features

- Execute token swaps on Uniswap V3
- Support for exact input and exact output swaps
- Support for multiple token pairs
- Integration with spending limit policies for enhanced security
- Support for multiple chains and Uniswap deployments

## Installation

```bash
npm install @lit-protocol/vincent-ability-uniswap-swap
```

## Usage

This ability can be used in Vincent apps to execute Uniswap swaps:

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-uniswap-swap';

// One of delegatee signers from your app's Vincent Dashboard
const delegateeSigner = new ethers.Wallet('YOUR_DELEGATEE_PRIVATE_KEY');

// Initialize the Vincent Ability Client
const abilityClient = getVincentAbilityClient({
  ethersSigner: delegateeSigner,
  bundledVincentAbility,
});
const delegatorPkpEthAddress = '0x09182301238'; // The delegator PKP Eth Address

const abilityParams = {
  chainId: '8453', // The chain where the tx will be executed
  tokenIn: '0x1234...', // The input token address
  amountIn: '1000000000000000000', // The input amount (in wei)
  tokenOut: '0xabcd...', // The output token address
  rpcUrl: 'https://mainnet.base.org', // The RPC to send the transaction through
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

## Integration with Policies

This ability is integrated with the Vincent Policy Spending Limit to enforce spending constraints:

```typescript
import {
  createVincentAbilityPolicy,
  createVincentAbility,
  createPolicyMapFromAbilityPolicies,
} from '@lit-protocol/vincent-ability-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';
import { abilityParamsSchema } from '@lit-protocol/vincent-ability-uniswap-swap';

const spendingLimitPolicy = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy,
  abilityParameterMappings: {
    pkpEthAddress: 'pkpEthAddress',
    ethRpcUrl: 'ethRpcUrl',
    tokenInAddress: 'tokenAddress',
    tokenInDecimals: 'tokenDecimals',
    tokenInAmount: 'buyAmount',
  },
});

export const uniswapSwapWithSpendingLimit = createVincentAbility({
  abilityParamsSchema,
  policyMap: createPolicyMapFromAbilityPolicies([spendingLimitPolicy]),
  // ... rest of ability implementation
});
```

## Prerequisites

Before executing a swap, ensure that:

1. The user has approved the input token for the Uniswap router
2. The user has sufficient balance of the input token
3. The user has delegated permission to the Vincent app to execute swaps

You can use the Vincent Ability ERC20 Approval to handle token approvals:

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { ERC20_APPROVAL_TOOL_IPFS_ID } from '@lit-protocol/vincent-ability-erc20-approval';

// ... approve tokens before swap
```

## Building

Run `nx build ability-uniswap-swap` to build the library.

## Running unit tests

Run `nx test ability-uniswap-swap` to execute the unit tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
