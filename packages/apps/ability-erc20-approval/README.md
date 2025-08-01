# Vincent Ability ERC20 Approval

An ability to send ERC20 approve/allowance transactions from a Vincent app on behalf of the delegator.

## Overview

The Vincent Ability ERC20 Approval is part of the Vincent Abilities ecosystem and is built using the Vincent Ability SDK. It allows Vincent apps to request and manage ERC20 token approvals on behalf of users, enabling seamless integration with DeFi protocols and other token-based applications.

## Features

- Request ERC20 token approvals for users
- Set specific allowance amounts
- Revoke existing approvals
- Support for multiple ERC20 tokens

## Installation

```bash
npm install @lit-protocol/vincent-ability-erc20-approval
```

## Usage

This ability can be used in Vincent apps to manage ERC20 approvals:

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
import { bundledVincentAbility } from '@lit-protocol/vincent-ability-erc20-approval';

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
  tokenIn: '0x1234...', // The ERC20 token address
  amountIn: '1000000000000000000', // The amount to approve (in wei)
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

## Building

Run `nx build ability-erc20-approval` to build the library.

## Running unit tests

Run `nx test ability-erc20-approval` to execute the unit tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
