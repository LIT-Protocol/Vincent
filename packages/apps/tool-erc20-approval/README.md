# Vincent Tool ERC20 Approval

A tool to send ERC20 approve/allowance transactions from a Vincent app on behalf of the delegator.

## Overview

The Vincent Tool ERC20 Approval is part of the Vincent Tools ecosystem and is built using the Vincent Tool SDK. It allows Vincent apps to request and manage ERC20 token approvals on behalf of users, enabling seamless integration with DeFi protocols and other token-based applications.

## Features

- Request ERC20 token approvals for users
- Set specific allowance amounts
- Revoke existing approvals
- Support for multiple ERC20 tokens

## Installation

```bash
npm install @lit-protocol/vincent-tool-erc20-approval
```

## Usage

This tool can be used in Vincent apps to manage ERC20 approvals:

```typescript
import { getVincentToolClient } from '@lit-protocol/vincent-app-sdk/toolClient';
import { bundledVincentTool } from '@lit-protocol/vincent-tool-erc20-approval';

// One of delegatee signers from your app's Vincent Dashboard
const delegateeSigner = new ethers.Wallet('YOUR_DELEGATEE_PRIVATE_KEY');

// Initialize the Vincent Tool Client
const toolClient = getVincentToolClient({
  ethersSigner: delegateeSigner,
  bundledVincentTool,
});
const delegatorPkpEthAddress = '0x09182301238'; // The delegator PKP Eth Address

const toolParams = {
  chainId: '8453', // The chain where the tx will be executed
  tokenIn: '0x1234...', // The ERC20 token address
  amountIn: '1000000000000000000', // The amount to approve (in wei)
  rpcUrl: 'https://mainnet.base.org', // The RPC to send the transaction through
};

// Run precheck to see if tool should be executed
const precheckResult = await client.precheck(toolParams, {
  delegatorPkpEthAddress,
});

if (precheckResult.success === true) {
  // Execute the Vincent Tool
  const executeResult = await client.execute(toolParams, {
    delegatorPkpEthAddress,
  });

  // ...tool has executed, you can check `executeResult` for details
}
```

## Building

Run `nx build tool-erc20-approval` to build the library.

## Running unit tests

Run `nx test tool-erc20-approval` to execute the unit tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
