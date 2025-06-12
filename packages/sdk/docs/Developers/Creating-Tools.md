---
category: Developers
title: Creating Vincent Tools
---

# What is a Vincent Tool?

A Vincent Tool is a function built using [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview) that enables Vincent Apps to perform specific actions on behalf of Vincent App Users. These tools are the core functional units that Vincent Apps use to interact with blockchains, APIs, and other services while being governed by user-configured Vincent Policies.

## Key Capabilities

**Flexible Data Access**
- Read and write on-chain data (token balances, NFT ownership, smart contract state)
- Read and write off-chain data from any HTTP-accessible API or database

**Policy-Driven Execution**
- Execute tools only when all Vincent App User registered Vincent Policies allow it
- Combine on and off-chain policy conditions

**Type-Safe Development**
- Strongly-typed Zod schemas for your tool functions' parameters and return values
- Clear interfaces between your tool and Vincent Policies with type safety

**Lit Action Based**
- Built-in ethers.js for blockchain interactions
- Ability to import and use NPM packages within your tool
- Access to Lit Protocol's [Encryption and Access Control](https://developer.litprotocol.com/sdk/access-control/intro) features
- Ability to sign data on behalf of the Vincent App User's Agent Wallet PKP

## Real-World Tool Examples

Vincent Tools can implement a wide variety of blockchain and web2 actions, such as:

**Blockchain Interactions**
- **Transaction Signing**: Sign and submit transactions to any blockchain network using the Vincent App User's Agent Wallet PKP
- **Smart Contract Operations**: Read contract state, call contract functions, and deploy new contracts
- **Cross-Chain Operations**: Execute actions across multiple blockchain networks within a single tool

**External Data Integration**
- **HTTP API Access**: Make authenticated requests to any endpoint available using an HTTP request
- **Data Transformation**: Process and combine data from multiple sources before executing Vincent Tool operations

**Cryptographic Operations**
- **Message Signing**: Create cryptographic signatures for authentication, attestations, or custom protocols
- **Data Encryption/Decryption**: Secure sensitive data or decrypt data within your Vincent Tool using Lit Protocol's encryption and access control features
- **Custom Cryptographic Protocols**: Implement specialized signing schemes or multi-party computation workflows

**Programmable Logic & Governance**
- **Conditional Execution**: Implement complex business logic with branching paths based on runtime data
- **Policy Integration**: Leverage Vincent App User configured policies to govern when and how Vincent Tools can execute
- **Stateful Operations**: Maintain and update persistent state across multiple Vincent Tool executions

# How a Vincent Tool Works

A Vincent Tool consists of two main lifecycle methods executed in the following order:

1. **Precheck**: Executed locally by the Vincent Tool executor, this function provides a best-effort check that the tool execution shouldn't fail
   - Before the execution of your tool's `precheck` function, the Vincent Tool & Policy SDK will execute the `precheck` functions of the Vincent Policies enabled by the Vincent App User for your tool for the specific Vincent App the tool is being executed for
   - If all Vincent Policies return `allow` results, the Vincent Tool's `precheck` function will be executed
   - This function is where you'd perform checks such as validating the Vincent Agent Wallet PKP has enough balance to execute the tool logic, has the appropriate on-chain approvals to make token transfers, or anything else your tool can validate before executing the tool's logic

2. **Execute**: Executed within the Lit Action environment, this function performs the actual tool logic and has the ability to sign data using the Vincent App User's Agent Wallet PKP
   - Before the execution of your tool's `execute` function, the Vincent Tool & Policy SDK will execute the `evaluate` functions of the Vincent Policies enabled by the Vincent App User for your tool for the specific Vincent App the tool is being executed for
   - If all Vincent Policies return `allow` results, the Vincent Tool's `execute` function will be executed
   - This function is where you'd perform the actual tool logic, such as making token transfers, interacting with smart contracts, or anything else your tool needs to do to fulfill the tool's purpose

# Defining Your Vincent Tool

Vincent Tools are created by calling the `createVincentTool` function from the `@lit-protocol/vincent-tool-sdk` package. This function takes a single object parameter that defines your tool's lifecycle methods, parameter schemas, return value schemas, and supported policies.

The following is the basic structure of a Vincent Tool definition:

```typescript
export const vincentTool = createVincentTool({
  toolParamsSchema,

  supportedPolicies: supportedPoliciesForTool([ ]),

  precheckSuccessSchema,
  precheckFailSchema,
  precheck: async ({ toolParams }, toolContext) => { },

  executeSuccessSchema,
  executeFailSchema,
  execute: async ({ toolParams }, toolContext) => { },
});
```

## The `toolContext` Argument

The `toolContext` argument is provided and managed by the Vincent Tool & Policy SDK. It's an object containing the following properties and is passed as an argument to your tool's `precheck` and `execute` functions:

```typescript
interface ToolContext {
  toolIpfsCid: string;
  appId: number;
  appVersion: number;
  delegation: {
    delegateeAddress: string;
    delegatorPkpInfo: {
      tokenId: string;
      ethAddress: string;
      publicKey: string;
    };
  };
  policiesContext: {
    allow: boolean;
    allowedPolicies: {
      [policyPackageName: string]: {
        result: evalAllowResultSchema;
        commit: (params: commitParamsSchema) => Promise<commitAllowResultSchema | commitDenyResultSchema>;
      };
    };
    deniedPolicy?: {
      policyPackageName: string;
      result: evalDenyResultSchema;
    };
  };
  succeed: (executeSuccessResult: executeSuccessSchema) => void;
  fail: (executeFailResult: executeFailSchema) => void;
}
```

Where:
- `toolIpfsCid`: The IPFS CID of the Vincent Tool that is being executed
- `appId`: The ID of the Vincent App the Vincent Tool is being executed for
- `appVersion`: The version of the Vincent App the Vincent Tool is being executed for
- `delegation`:
  - `delegateeAddress`: The Ethereum address of the Vincent Tool executor
  - `delegatorPkpInfo`:
    - `tokenId`: The token ID of the Vincent App User's Vincent Agent Wallet PKP
    - `ethAddress`: The Ethereum address of the Vincent App User's Vincent Agent Wallet PKP
    - `publicKey`: The public key of the Vincent App User's Vincent Agent Wallet PKP
- `policiesContext`: An object containing the context of the Vincent Policies enabled by the Vincent App User for your tool for the specific Vincent App the tool is being executed for
  - `allow`: A boolean indicating if the Vincent Tool execution is allowed to proceed, and all evaluated Vincent Policies returned `allow` results
  - `allowedPolicies`: An object containing the results of the `evaluate` functions of the Vincent Policies enabled by the Vincent App User for your tool for the specific Vincent App the tool is being executed for
    - `[policyPackageName]`: An object where the key is the package name of the Vincent Policy, and the value is an object containing the result of the `evaluate` function of the Vincent Policy as well the policy's `commit` function if it exists
      - `result`: The result of the `evaluate` function of the Vincent Policy, will have the shape of the Vincent Policy's [evalAllowResultSchema](./Creating-Policies.md#evalallowresultschema)
      - `commit`: An optional functions for each evaluated Vincent Policy that allows the policies to commit any state changes after your tool has successfully executed
        - The parameter object passed to the `commit` function is defined by each Vincent Policy's [commitParamsSchema](./Creating-Policies.md#commitparamsschema), and the return value is defined by the policy's [commitAllowResultSchema](./Creating-Policies.md#commitallowresultschema) or [commitDenyResultSchema](./Creating-Policies.md#commitdenyresultschema)
  - `deniedPolicy`: An object containing the first Vincent Policy that denied the Vincent Tool execution
    - `policyPackageName`: The package name of the Vincent Policy that denied the Vincent Tool execution
    - `result`: The result of the `evaluate` function of the Vincent Policy that denied the Vincent Tool execution, will have the shape of the Vincent Policy's [evalDenyResultSchema](./Creating-Policies.md#evaldenyresultschema)
- `succeed`: A helper method for returning a `success` result from your tool's `precheck` and `execute` functions
- `fail`: A helper method for returning a `fail` result from your tool's `precheck` and `execute` functions

## Parameter Schemas

### `toolParamsSchema`

This Zod schema defines the structure of parameters that executors of your tool will pass to your tool. These should be the parameters you require to execute your tool's functionality, as well as any parameters required by the Vincent Policies your tool supports.

For example, if you are building a token transfer tool that supports a spending limit policy, you might define the `toolParamsSchema` as follows:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const toolParamsSchema = z.object({
  tokenAddress: z.string(),
  amountToSend: z.number(),
  recipientAddress: z.string(),
});

const vincentTool = createVincentTool({
  // ... other tool definitions

  toolParamsSchema,
});
```

These parameters give your tool what it needs to send a transaction transferring `amount` of `tokenAddress` to `recipientAddress`.

The `tokenAddress` and `amount` parameters are also the parameters needed to be given to the Vincent spending limit policy which we'll cover in the next section.

## Defining Supported Policies

To add policy support to your tool, you need to create _VincentToolPolicy_ objects using the `createVincentToolPolicy` function from the `@lit-protocol/vincent-tool-sdk` package for each Vincent Policy you want to support. These _VincentToolPolicy_ objects are then added to your tool's `supportedPolicies` array, which binds the policies to your tool and enables proper parameter mapping between your tool and the policies.

### Creating a `VincentToolPolicy` object

Our example Vincent Tool supports a Vincent spending limit policy that has the following schema for the parameters it's expecting to be given by the executing Vincent Tool:

> **Note** The following code is an excerpt from the [Create a Vincent Policy](./Creating-Policies.md#userparamsschema) guide.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  toolParamsSchema: z.object({
      tokenAddress: z.string(),
      amount: z.number(),
  }),
});
```

As the Vincent Tool developer, what this means is that both your `precheck` and `execute` functions need to pass a `tokenAddress` and `amount` parameter to the `precheck` and `execute` functions of the Vincent spending limit policy.

Because the name of the parameters given to your tool, as defined by your tool's `toolParamsSchema`, won't always be named the same as or even refer to the same thing as the Vincent Policies your tool supports, we need a way to map the parameters given to your tool to the parameters expected by the Vincent Policies.

To accomplish this, we create a _VincentToolPolicy_ object using the `createVincentToolPolicy` function:

```typescript
import { createVincentTool, createVincentToolPolicy, supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';

const toolParamsSchema = z.object({
  tokenAddress: z.string(),
  amountToSend: z.number(),
  recipientAddress: z.string(),
});

const SpendingLimitPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: {
    tokenAddress: 'tokenAddress',
    amountToSend: 'amount',
  },
});

const vincentTool = createVincentTool({
  // ... other tool definitions

  toolParamsSchema,

  supportedPolicies: supportedPoliciesForTool([SpendingLimitPolicy]),
});
```

A couple of new things are happening in this code example:

First we're importing `bundledVincentPolicy` from the `@lit-protocol/vincent-policy-spending-limit` package, which is a Vincent Policy object created using the Vincent Tool & Policy SDK and exported by the policy author for our tool to consume

Then we're creating a `VincentToolPolicy` object named `SpendingLimitPolicy` using the `createVincentToolPolicy` function. The `createVincentToolPolicy` function takes a single object parameter with the required properties:

- `toolParamsSchema`: The Zod schema you've defined for the parameters your tool expects to be given by the Vincent Tool executor
- `bundledVincentPolicy`: The Vincent Policy object created by the policy author for our tool to consume, which is imported from the `@lit-protocol/vincent-policy-spending-limit` package
- `toolParameterMappings`: An object that maps the parameters given to your tool, to the parameters expected by the Vincent Policy
  - The keys of this object are the parameter names your tool uses (`tokenAddress` and `amountToSend`), and the values are the parameter names expected by the Vincent Policy (`tokenAddress` and `amount`)

Lastly, we take the `SpendingLimitPolicy` object and add it to an array, which we then wrap in a `supportedPoliciesForTool` function call to our tool's `supportedPolicies` array.

This is how we register the `SpendingLimitPolicy` with our tool, and is all that's needed for your tool to support the Vincent spending limit policy. The execution of the policy's `precheck` and `evaluate` functions will be handled for you by the Vincent Tool & Policy SDK, as well as processing the return values from the policy's `precheck` and `evaluate` functions to check if the tool should be allowed to execute.

## Precheck Function

The `precheck` function is executed locally by the Vincent Tool executor to provide a best-effort check that the tool execution shouldn't fail when the `execute` function is called.

Executing a Vincent Tool's `execute` function uses the Lit network, which costs both time and money, so your `precheck` function should perform whatever validation it can to ensure that the tool won't fail during execution.

Before executing your tool's `precheck` function, the Vincent Tool & Policy SDK will execute the `precheck` functions of the Vincent Policies enabled by the Vincent App User for your tool for a specific Vincent App. If all Vincent Policies return `allow` results, the Vincent Tool's `precheck` function will be executed.

For our example token transfer tool, the `precheck` function checks both the Vincent User's Agent Wallet PKP's  ERC20 token balance, as well as the native token balance to validate the Agent Wallet PKP has enough balance to perform the token transfer and pay for the gas fees of the transfer transaction.

> **Note** the code from the previous sections has been omitted for brevity. The full code example can be found in the [Wrapping Up](#wrapping-up) section at the end of this guide.

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';

import { createErc20TransferTransaction, getErc20TokenBalance, getNativeTokenBalance } from './my-tool-code';

const vincentTool = createVincentTool({
  // ... other tool definitions

  precheck: async ({ toolParams }, toolContext) => {
    const { tokenAddress, amountToSend, recipientAddress } = toolParams;

    const erc20TokenBalance = await getErc20TokenBalance(
      toolContext.delegation.delegatorPkpInfo.ethAddress,
      tokenAddress,
      amountToSend
    );
    if (erc20TokenBalance < amountToSend) {
      return toolContext.fail({
        reason: "Insufficient token balance",
        currentBalance: erc20TokenBalance,
        requiredAmount: amountToSend
      });
    }

    const transferTransaction = createErc20TransferTransaction(
      tokenAddress,
      recipientAddress,
      amountToSend
    );

    let estimatedGas;
    try {
      // Gas estimation might fail if transaction would revert
      estimatedGas = await transferTransaction.estimateGas();
    } catch (error) {
      // Handle gas estimation failures (transaction would revert)
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return toolContext.fail({
          reason: "Transaction reverted during gas estimation/transaction simulation",
          errorCode: error.code,
          revertReason: error.reason || "Unknown revert reason",
          transferTransaction,
        });
      }

      // Let the Vincent Tool & Policy SDK handle the error
      throw error;
    }
    
    const nativeTokenBalance = await getNativeTokenBalance(
      toolContext.delegation.delegatorPkpInfo.ethAddress,
      estimatedGas
    );

    if (nativeTokenBalance < estimatedGas) {
      return toolContext.fail({
        reason: "Insufficient native token balance",
        currentBalance: nativeTokenBalance,
        requiredAmount: estimatedGas
      });
    }

    return toolContext.succeed({
      erc20TokenBalance,
      nativeTokenBalance,
      estimatedGas,
    });
  },
});
```

Two arguments are passed to your tool's `precheck` function by the Vincent Tool & Policy SDK. The first is an object containing the `toolParams` the adhere to the `toolParamsSchema` you have defined for your tool. The second is the [`toolContext`](#the-toolcontext-argument) managed by the Vincent Tool & Policy SDK that contains helper methods for returning `succeed` and `fail` results, as well as some metadata about the Vincent App that the tool is being executed for.

### `precheckSuccessSchema`

This Zod schema defines the structure of successful `precheck` results. What's included in the returned object is up to you, but ideally it includes details about why the `precheck` passed.

The following schema returns useful information to the Vincent Tool executor about the current balances of the Agent Wallet PKP, as well as the estimated gas cost of the transaction:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentTool = createVincentTool({
  // ... other tool definitions

  precheckSuccessSchema: z.object({
    erc20TokenBalance: z.number(),
    nativeTokenBalance: z.number(),
    estimatedGas: z.number(),
  }),
});
```

### `precheckFailSchema`

This Zod schema defines the structure of a failed `precheck` result. What's included in the returned object is up to you, but ideally it includes details about why the `precheck` failed.

The following schema returns additional information to the Vincent Tool executor that would help them understand why the tool execution would fail. In this case, the `reason` string allows the `precheck` function to return a specific error message stating something like `"Insufficient token balance"` or `"Insufficient native token balance"`, along with current and required amounts for debugging:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentTool = createVincentTool({
  // ... other tool definitions

  precheckFailSchema: z.object({
    reason: z.string(),
    currentBalance: z.number().optional(),
    requiredAmount: z.number().optional(),
  }),
});
```

## Execute Function

The `execute` function is the main logic of your Vincent Tool, executed within the Lit Action environment when the Vincent Tool executor wants to perform the actual tool operation on behalf of the Vincent App User.

Unlike the `precheck` function which only validates feasibility, the `execute` function performs the actual work your tool is designed to do. Additionally, because the `execute` function is executed in the Lit Action environment, it has access to the full Lit Action capabilities, including the ability to sign transactions and data using the Vincent App User's Agent Wallet PKP (for more information on what's available to you within the Lit Action environment see the Lit Protocol [Lit Action](https://developer.litprotocol.com/sdk/serverless-signing/overview) docs).

> **Note** This [Lit Action doc page](https://developer.litprotocol.com/sdk/serverless-signing/combining-signatures) covers how to sign data with a PKP using the Ethers.js library within a Lit Action. Ethers.js is injected by Lit into the Lit Action runtime, so you don't need to import it to use it within your tool's `execute` function.

Before executing your tool's `execute` function, the Vincent Tool & Policy SDK will execute the `evaluate` functions of the Vincent Policies enabled by the Vincent App User for your tool for a specific Vincent App. If all Vincent Policies return `allow` results, your tool's `execute` function will be executed.

For our example token transfer tool, the `execute` function performs the actual ERC20 token transfer transaction:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';

import { createErc20TransferTransaction } from './my-tool-code';

const vincentTool = createVincentTool({
  // ... other tool definitions

  execute: async ({ toolParams }, toolContext) => {
    const { tokenAddress, amountToSend, recipientAddress } = toolParams;

    const transferTransaction = createErc20TransferTransaction(
      tokenAddress,
      recipientAddress,
      amountToSend
    );

    try {
      // Estimate gas to catch potential revert reasons early
      const estimatedGas = await transferTransaction.estimateGas();
    } catch (error) {
      // Handle different types of errors
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return toolContext.fail({
          error: "Transaction reverted during gas estimation/transaction simulation",
          errorCode: error.code,
          revertReason: error.reason || "Unknown revert reason",
          transferTransaction,
        });
      }

      // Let the Vincent Tool & Policy SDK handle the error
      throw error;
    }
      
    const transferTransactionHash = await transferTransaction.send();
    return toolContext.succeed({
      transferTransactionHash,
    });
  },
});
```

Two arguments are passed to your tool's `execute` function by the Vincent Tool & Policy SDK. The first is an object containing the `toolParams` the adhere to the `toolParamsSchema` you have defined for your tool. The second is the [`toolContext`](#the-toolcontext-argument) managed by the Vincent Tool & Policy SDK that contains helper methods for returning `succeed` and `fail` results, as well as some metadata about the Vincent App that the tool is being executed for.

### `executeSuccessSchema`

This Zod schema defines the structure of a successful `execute` result. What's included in the returned object is up to you, but ideally it includes details about why the `execute` function is allowing the Vincent Tool execution.

The following schema returns to the Vincent Tool executor the transaction hash of the executed transaction:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentTool = createVincentTool({
  // ... other policy definitions

  executeSuccessSchema: z.object({
    transferTransactionHash: z.string(),
    spendTransactionHash: z.string().optional(),
  }),
});
```

### `executeFailSchema`

This Zod schema defines the structure of a failed `execute` result. What's included in the returned object is up to you, but ideally it includes details about why the `execute` function is failing.

The following schema returns error information to the Vincent Tool executor, including an error message, error code, and revert reason for failed transactions to assist with debugging:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const vincentTool = createVincentTool({
  // ... other policy definitions

  executeFailSchema: z.object({
    error: z.string(),
    errorCode: z.string(),
    revertReason: z.string(),
    transferTransaction: z.object({
      to: z.string(),
      value: z.string(),
      data: z.string(),
      gasLimit: z.string(),
      gasPrice: z.string(),
      maxFeePerGas: z.string(),
      maxPriorityFeePerGas: z.string(),
      nonce: z.number(),
      chainId: z.number(),
      type: z.number(),
    }),
  }),
});
```

## Executing Vincent Policy Commit Functions

After your tool's `execute` function successfully completes, the last step of the function should be calling the `commit` functions for any of your tool's supported Vincent Policies that have a `commit` function. These `commit` functions allow policies to update their internal state based on what actions your tool performed.

Vincent Policy commit functions are **optional** - not all policies will have them. They're typically used by policies that need to track cumulative data like spending amounts, execution counts, or other stateful information that depends on successful tool execution.

After all the Vincent Policies that have been registered to be used with your tool for a specific Vincent App have been evaluated, an additional property will be added to the `toolContext` object called `policiesContext`.

This object contains a property called `allowedPolicies` that is an object where the keys are the package names of the evaluated Vincent policies, and the values are objects containing the `evalAllowResult` of the policy, and the policy's `commit` function if one exists for the policy:

> **Note** The following interface isn't the actual interface used by the Vincent Tool & Policy SDK, it's just a simplified example of what the `policiesContext` object looks like for reference.
>
> The [`evalAllowResultSchema`](./Creating-Policies.md#evalallowresultschema) and [`commitParamsSchema`](./Creating-Policies.md#commitparamsschema) are Zod schemas specified by the Vincent Policy package.

```typescript
interface PoliciesContext {
  allowedPolicies: Record<string, {
    result: evalAllowResultSchema;
    commit: (params: commitParamsSchema) => Promise<void>;
  }>;
}
```

For our token transfer tool example, after successfully executing the transfer, we call the spending limit policy's `commit` function to update the amount spent on behalf of the Vincent App User:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';

import { createErc20TransferTransaction } from './my-tool-code';

const vincentTool = createVincentTool({
  // ... other tool definitions

  execute: async ({ toolParams }, toolContext) => {
    const { tokenAddress, amountToSend, recipientAddress } = toolParams;

    // previous code omitted for brevity
      
    const transferTransactionHash = await transferTransaction.send();

    const spendingLimitPolicyContext =
      policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'];

    let spendTransactionHash: string | undefined;

    if (spendingLimitPolicyContext !== undefined) {
      const commitResult = await spendingLimitPolicyContext.commit({
        spentAmount: amountToSend,
        tokenAddress,
      });

      if (commitResult.allow) {
        spendTransactionHash = commitResult.result.spendTransactionHash;
      } else {
        return fail({
          error:
            commitResult.error ?? 'Unknown error occurred while committing spending limit policy',
        });
      }
    }

    return toolContext.succeed({
      transferTransactionHash,
      spendTransactionHash,
    });
  },
});
```

# Wrapping Up

This guide has covered the basics of creating a Vincent Tool with supported Vincent Policies to be consumed by Vincent Apps. You've learned how to define supported Vincent Policies for your tool, how to define the tool's `precheck` and `execute` functions, how to execute Vincent Policy `commit` functions, as well as how to define the schemas for the parameters required by the tool's `precheck` and `execute` functions.

For the token transfer tool example we've been building throughout this guide, the final tool definition would look like the following:

```typescript
import { createVincentTool, createVincentToolPolicy, supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';

const toolParamsSchema = z.object({
  tokenAddress: z.string(),
  amountToSend: z.number(),
  recipientAddress: z.string(),
});

const SpendingLimitPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: {
    tokenAddress: 'tokenAddress',
    amountToSend: 'amount',
  },
});

const vincentTool = createVincentTool({
  toolParamsSchema,

  supportedPolicies: supportedPoliciesForTool([SpendingLimitPolicy]),

  precheckSuccessSchema: z.object({
    erc20TokenBalance: z.number(),
    nativeTokenBalance: z.number(),
    estimatedGas: z.number(),
  }),
  precheckFailSchema: z.object({
    reason: z.string(),
    currentBalance: z.number().optional(),
    requiredAmount: z.number().optional(),
  }),
  precheck: async ({ toolParams }, toolContext) => {
    const { tokenAddress, amountToSend, recipientAddress } = toolParams;

    const erc20TokenBalance = await getErc20TokenBalance(
      toolContext.delegation.delegatorPkpInfo.ethAddress,
      tokenAddress,
      amountToSend
    );
    if (erc20TokenBalance < amountToSend) {
      return toolContext.fail({
        reason: "Insufficient token balance",
        currentBalance: erc20TokenBalance,
        requiredAmount: amountToSend
      });
    }

    const transferTransaction = createErc20TransferTransaction(
      tokenAddress,
      recipientAddress,
      amountToSend
    );

    let estimatedGas;
    try {
      // Gas estimation might fail if transaction would revert
      estimatedGas = await transferTransaction.estimateGas();
    } catch (error) {
      // Handle gas estimation failures (transaction would revert)
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return toolContext.fail({
          reason: "Transaction reverted during gas estimation/transaction simulation",
          errorCode: error.code,
          revertReason: error.reason || "Unknown revert reason",
          transferTransaction,
        });
      }

      // Let the Vincent Tool & Policy SDK handle the error
      throw error;
    }
    
    const nativeTokenBalance = await getNativeTokenBalance(
      toolContext.delegation.delegatorPkpInfo.ethAddress,
      estimatedGas
    );

    if (nativeTokenBalance < estimatedGas) {
      return toolContext.fail({
        reason: "Insufficient native token balance",
        currentBalance: nativeTokenBalance,
        requiredAmount: estimatedGas
      });
    }

    return toolContext.succeed({
      erc20TokenBalance,
      nativeTokenBalance,
      estimatedGas,
    });
  },

  executeSuccessSchema: z.object({
    transferTransactionHash: z.string(),
    spendTransactionHash: z.string().optional(),
  }),
  executeFailSchema: z.object({
    error: z.string(),
    errorCode: z.string(),
    revertReason: z.string(),
    transferTransaction: z.object({
      to: z.string(),
      value: z.string(),
      data: z.string(),
      gasLimit: z.string(),
      gasPrice: z.string(),
      maxFeePerGas: z.string(),
      maxPriorityFeePerGas: z.string(),
      nonce: z.number(),
      chainId: z.number(),
      type: z.number(),
    }),
  }),
  execute: async ({ toolParams }, toolContext) => {
    const { tokenAddress, amountToSend, recipientAddress } = toolParams;

    const transferTransaction = createErc20TransferTransaction(
      tokenAddress,
      recipientAddress,
      amountToSend
    );

    try {
      // Estimate gas to catch potential revert reasons early
      const estimatedGas = await transferTransaction.estimateGas();
    } catch (error) {
      // Handle different types of errors
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return toolContext.fail({
          error: "Transaction reverted during gas estimation/transaction simulation",
          errorCode: error.code,
          revertReason: error.reason || "Unknown revert reason",
          transferTransaction,
        });
      }

      // Let the Vincent Tool & Policy SDK handle the error
      throw error;
    }
      
    const transferTransactionHash = await transferTransaction.send();
    
    const spendingLimitPolicyContext =
      policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'];

    let spendTransactionHash: string | undefined;

    if (spendingLimitPolicyContext !== undefined) {
      const commitResult = await spendingLimitPolicyContext.commit({
        spentAmount: amountToSend,
        tokenAddress,
      });

      if (commitResult.allow) {
        spendTransactionHash = commitResult.result.spendTransactionHash;
      } else {
        return fail({
          error:
            commitResult.error ?? 'Unknown error occurred while committing spending limit policy',
        });
      }
    }

    return toolContext.succeed({
      transferTransactionHash,
      spendTransactionHash,
    });
  },
});
```
