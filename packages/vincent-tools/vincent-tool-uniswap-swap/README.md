# Vincent Tool Uniswap Swap

A tool to trigger swaps on Uniswap from a Vincent app on behalf of the delegator.

## Overview

The Vincent Tool Uniswap Swap is part of the Vincent Tools ecosystem and is built using the Vincent Tool SDK. It allows Vincent apps to execute token swaps on Uniswap V3 on behalf of users, enabling seamless integration with decentralized exchange functionality.

## Features

- Execute token swaps on Uniswap V3
- Support for exact input and exact output swaps
- Support for multiple token pairs
- Integration with spending limit policies for enhanced security
- Support for multiple chains and Uniswap deployments

## Installation

```bash
npm install @lit-protocol/vincent-tool-uniswap-swap
```

## Usage

This tool can be used in Vincent apps to execute Uniswap swaps:

```typescript
import { getVincentToolClient } from '@lit-protocol/vincent-sdk';
import { UNISWAP_SWAP_TOOL_IPFS_ID } from '@lit-protocol/vincent-tool-uniswap-swap';

// Initialize the Vincent Tool Client with your delegatee signer
const toolClient = getVincentToolClient({
  ethersSigner: delegateeSigner,
  vincentToolCid: UNISWAP_SWAP_TOOL_IPFS_ID
});

// Execute the Uniswap Swap Tool
const response = await toolClient.execute({
  chainId: '8453', // The chain where the tx will be executed
  tokenIn: '0x1234...', // The input token address
  amountIn: '1000000000000000000', // The input amount (in wei)
  tokenOut: '0xabcd...', // The output token address
  pkpEthAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // The delegator PKP Address
  rpcUrl: 'https://mainnet.base.org', // The RPC to send the transaction through
});
```

## Integration with Policies

This tool can be integrated with the Vincent Policy Spending Limit to enforce spending constraints:

```typescript
import { createVincentToolPolicy, createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { dailySpendPolicy } from '@lit-protocol/vincent-policy-spending-limit';
import { uniswapSwapTool } from '@lit-protocol/vincent-tool-uniswap-swap';

// Create a tool with spending limit policy
const uniswapSwapWithSpendingLimit = createVincentTool({
  // ... tool configuration
  supportedPolicies: [
    createVincentToolPolicy({
      // ... policy configuration
      policyDef: dailySpendPolicy,
    }),
  ],
  // ... rest of tool implementation
});
```

## Prerequisites

Before executing a swap, ensure that:

1. The user has approved the input token for the Uniswap router
2. The user has sufficient balance of the input token
3. The user has delegated permission to the Vincent app to execute swaps

You can use the Vincent Tool ERC20 Approval to handle token approvals:

```typescript
import { getVincentToolClient } from '@lit-protocol/vincent-sdk';
import { ERC20_APPROVAL_TOOL_IPFS_ID } from '@lit-protocol/vincent-tool-erc20-approval';

// ... approve tokens before swap
```

## Building

Run `nx build vincent-tool-uniswap-swap` to build the library.

## Running unit tests

Run `nx test vincent-tool-uniswap-swap` to execute the unit tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
