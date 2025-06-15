---
category: Developers
title: Creating Vincent Tools
---

# How a Vincent Tool Works

A Vincent Tool consists of two main lifecycle methods executed in the following order:

1. **Precheck**: Executed locally by the Vincent Tool executor, this function provides a best-effort check that the tool execution shouldn't fail

   - Before the execution of your tool's `precheck` function, the Vincent Tool & Policy SDK will execute the `precheck` functions of the Vincent Policies
   - If all Vincent Policies return `allow` results, the Vincent Tool's `precheck` function will be executed
   - This function is where you'd perform checks such as validating the Vincent Agent Wallet has sufficient token balances, has the appropriate on-chain approvals to make token transfers, or anything else your tool can validate before executing the tool's logic

2. **Execute**: Executed within the Lit Action environment, this function performs the actual tool logic and has the ability to sign data using the Vincent App User's Agent Wallet
   - Before the execution of your tool's `execute` function, the Vincent Tool & Policy SDK will execute the `evaluate` functions of the Vincent Policies
   - If all Vincent Policies return `allow` results, the Vincent Tool's `execute` function will be executed
   - This function is where you'd perform the actual tool logic, such as making token transfers, interacting with smart contracts, or anything else your tool needs to do to fulfill the tool's purpose

# Defining Your Vincent Tool

Vincent Tools are created by calling the `createVincentTool` function from the `@lit-protocol/vincent-tool-sdk` package. This function takes a single object parameter that defines your tool's lifecycle methods, parameter schemas, return value schemas, and supported policies.

The following is the basic structure of a Vincent Tool definition:

```typescript
export const vincentTool = createVincentTool({
  toolParamsSchema,

  supportedPolicies: supportedPoliciesForTool([]),

  precheckSuccessSchema,
  precheckFailSchema,
  precheck: async ({ toolParams }, toolContext) => {},

  executeSuccessSchema,
  executeFailSchema,
  execute: async ({ toolParams }, toolContext) => {},
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
        commit: (
          params: commitParamsSchema
        ) => Promise<commitAllowResultSchema | commitDenyResultSchema>;
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
    - `tokenId`: The token ID of the Vincent App User's Vincent Agent Wallet
    - `ethAddress`: The Ethereum address of the Vincent App User's Vincent Agent Wallet
    - `publicKey`: The public key of the Vincent App User's Vincent Agent Wallet
- `policiesContext`: An object containing the results of each evaluated Vincent Policy
  - `allow`: A boolean indicating if the Vincent Tool execution is allowed to proceed, and all evaluated Vincent Policies returned `allow` results
  - `allowedPolicies`: An object containing the results and `commit` functions for each Vincent Policy that permitted tool execution
    - `[policyPackageName]`: An object where the key is the package name of the Vincent Policy, and the value is an object containing the result of the policy's `evaluate` function and the policy's `commit` function if it exists
      - `result`: An object will details describing why the policy has permitted tool execution. This will have the shape of the Vincent Policy's [evalAllowResultSchema](./Creating-Policies.md#evalallowresultschema)
      - `commit`: An optional function for each evaluated Vincent Policy that allows the policy to update any state it depends on to make it's decisions
        - The parameter object passed to the `commit` function is defined by each Vincent Policy's [commitParamsSchema](./Creating-Policies.md#commitparamsschema), and the return value is defined by the policy's [commitAllowResultSchema](./Creating-Policies.md#commitallowresultschema) or [commitDenyResultSchema](./Creating-Policies.md#commitdenyresultschema)
  - `deniedPolicy`: An object containing the first Vincent Policy that denied the Vincent Tool execution
    - `policyPackageName`: The package name of the Vincent Policy that denied the Vincent Tool execution
    - `result`: The result of the `evaluate` function of the Vincent Policy that denied the Vincent Tool execution, will have the shape of the Vincent Policy's [evalDenyResultSchema](./Creating-Policies.md#evaldenyresultschema)
- `succeed`: A helper method for returning a `success` result from your tool's `precheck` and `execute` functions
- `fail`: A helper method for returning a `fail` result from your tool's `precheck` and `execute` functions

## Parameter Schemas

### `toolParamsSchema`

This Zod schema defines the structure of parameters that executors will provide to your tool. These should be the parameters you require to execute your tool's functionality, as well as any parameters required by the Vincent Policies your tool supports.

For example, if you are building a token transfer tool that supports a Vincent spending limit policy, you might define the `toolParamsSchema` as follows:

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

These parameters give your tool what it needs to send a transaction transferring `amountToSend` of `tokenAddress` to `recipientAddress`.

The `tokenAddress` and `amountToSend` parameters are also the parameters required to be given to the Vincent spending limit policy which we'll cover in the next section.

## Defining Supported Policies

<!-- TODO Link to the VincentToolPolicy typedoc interface when it's available -->

To add support for Vincent Policies to your tool, you need to create Vincent Tool Policy objects using the `createVincentToolPolicy` function from the `@lit-protocol/vincent-tool-sdk` package for each Vincent Policy you want your tool to support. These Vincent Tool Policy objects are then added to your tool's `supportedPolicies` array, which binds the policies to your tool and enables proper parameter mapping between your tool and the policies.

> **Note:** Supporting a Vincent Policy does not mean the policy is required to be used with your tool, it means the Vincent App developer that uses your tool can enabled the supported policies for use by their Vincent App Users, if the App User chooses to enable those policies.

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
import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
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

First we're importing `bundledVincentPolicy` from the `@lit-protocol/vincent-policy-spending-limit` package, which is a Vincent Policy object created using the Vincent Tool & Policy SDK and exported by the policy author for Vincent Tools to consume.

Then we're creating a `VincentToolPolicy` object named `SpendingLimitPolicy` using the `createVincentToolPolicy` function. The `createVincentToolPolicy` function takes a single object parameter with the required properties:

- `toolParamsSchema`: The Zod schema (covered in the [Parameter Schemas](#parameter-schemas) section) you've defined for the parameters your tool expects to be given by the Vincent Tool executor
- `bundledVincentPolicy`: The Vincent Policy object created by the policy author for Vincent Tools to consume, which is imported from the `@lit-protocol/vincent-policy-spending-limit` package
- `toolParameterMappings`: An object that maps the parameters given to your tool to the parameters expected by the Vincent Policy you're supporting
  - The keys of this object are the parameter names your tool uses (`tokenAddress` and `amountToSend`), and the values are the parameter names expected by the Vincent Policy (`tokenAddress` and `amount`)

Lastly, we take the `SpendingLimitPolicy` object and add it to an array, which we then wrap in a `supportedPoliciesForTool` function call to our tool's `supportedPolicies` array.

This is how we register the `SpendingLimitPolicy` with our tool. That's all that's needed for your tool to support the Vincent spending limit policy. The execution of the policy's `precheck` and `evaluate` functions will be handled for you by the Vincent Tool & Policy SDK, as well as processing the return values from the policy's `precheck` and `evaluate` functions to check if the tool should be allowed to execute.

## Precheck Function

The `precheck` function is executed locally by the Vincent Tool executor to provide a best-effort check that the tool execution shouldn't fail when the `execute` function is called.

Executing a Vincent Tool's `execute` function uses the Lit network, which costs both time and money, so your `precheck` function should perform whatever validation it can to ensure that the tool won't fail during execution.

Before executing your tool's `precheck` function, the Vincent Tool & Policy SDK will execute the `precheck` functions of any Vincent Policies registered by the Vincent User. If all policies return `allow` results, the Vincent Tool's `precheck` function will be executed.

For our example token transfer tool, the `precheck` function checks both the Vincent User's Agent Wallet ERC20 token balance, as well as the native token balance to validate the Agent Wallet has enough balance to perform the token transfer and pay for the gas fees of the transfer transaction.

> **Note:** The code from the previous sections has been omitted for brevity. The full code example can be found in the [Wrapping Up](#wrapping-up) section at the end of this guide.

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';

import {
  createErc20TransferTransaction,
  getErc20TokenBalance,
  getNativeTokenBalance,
} from './my-tool-code';

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
        reason: 'Insufficient token balance',
        currentBalance: erc20TokenBalance,
        requiredAmount: amountToSend,
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
          reason: 'Transaction reverted during gas estimation/transaction simulation',
          errorCode: error.code,
          revertReason: error.reason || 'Unknown revert reason',
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
        reason: 'Insufficient native token balance',
        currentBalance: nativeTokenBalance,
        requiredAmount: estimatedGas,
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

The following schema returns useful information to the Vincent Tool executor about the current balances of the Agent Wallet, as well as the estimated gas cost of the transaction:

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

> **Note:** If any unhandled error occurs during execution of your tool's `precheck` function, the Vincent Tool & Policy SDK will automatically return a `fail` result with the error message.

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

Unlike the `precheck` function which only validates feasibility, the `execute` function performs the actual work your tool is designed to do. Additionally, because the `execute` function is executed in the Lit Action environment, it has access to the full Lit Action capabilities, including the ability to sign transactions and data using the Vincent App User's Agent Wallet (for more information on what's available to you within the Lit Action environment see the Lit Protocol [Lit Action](https://developer.litprotocol.com/sdk/serverless-signing/overview) docs).

> **Note** This [Lit Action](https://developer.litprotocol.com/sdk/serverless-signing/combining-signatures) doc page covers how to sign data with a PKP using the Ethers.js library within a Lit Action. Ethers.js is injected by Lit into the Lit Action runtime, so you don't need to import it to use it within your tool's `execute` function.

Before executing your tool's `execute` function, the Vincent Tool & Policy SDK will execute the `evaluate` functions of any Vincent Policies registered by the Vincent User. If all policies return `allow` results, your tool's `execute` function will be executed.

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
          error: 'Transaction reverted during gas estimation/transaction simulation',
          errorCode: error.code,
          revertReason: error.reason || 'Unknown revert reason',
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

The following schema returns to the Vincent Tool executor the transaction hash of the executed transaction, and the hash for the transaction sent during the execution of the Vincent spending limit policy's `commit` function to update the amount of tokens spent (this is covered further in the [Executing Vincent Policy Commit Functions](#executing-vincent-policy-commit-functions) section):

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

This Zod schema defines the structure of a failed `execute` result. What's included in the returned object is up to you, but ideally it includes details about why the `execute` function failed.

The following schema returns error information to the Vincent Tool executor, including an error message, error code, and revert reason for failed transactions to assist with debugging:

> **Note:** If any unhandled error occurs during execution of your tool's `execute` function, the Vincent Tool & Policy SDK will automatically return a `fail` result with the error message.

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

After your tool's `execute` function successfully completes, the last step of the function should be calling the `commit` functions for any of your tool's supported Vincent Policies that have a `commit` function. These `commit` functions allow policies to update their internal state based on what actions your tool performed, and are usually critical to the functionality and security of the policies.

> **WARNING** Your tool's `execute` function should always call the `commit` functions for any of your tool's supported Vincent Policies that have a `commit` function defined. Failing to do so could cause the Vincent Policies to operate incorrectly, failing to deny tool executions that exceed the Vincent App User's defined limits.

Vincent Policy commit functions are **optional** - not all policies will have them. They're typically used by policies that need to track cumulative data like spending amounts, execution counts, or other stateful information that depends on successful tool execution.

After all the Vincent Policies that have been registered to be used with your tool for the specific Vincent App the tool is being executed for have been evaluated, the `policiesContext` property from the `toolContext` object will be updated to contain the policy evaluation results.

The `policiesContext` object contains a property called `allowedPolicies` that is an object where the keys are the package names of the evaluated Vincent policies, and the values are objects containing the `evalAllowResult` of the policy, and the policy's `commit` function if one exists for the policy:

> **Note:** The following interface isn't the actual interface used by the Vincent Tool & Policy SDK, it's just a simplified example of what the `policiesContext` object looks like for reference.
>
> The [`evalAllowResultSchema`](./Creating-Policies.md#evalallowresultschema) and [`commitParamsSchema`](./Creating-Policies.md#commitparamsschema) are Zod schemas specified by the Vincent Policy package.

```typescript
interface PoliciesContext {
  allowedPolicies: Record<
    string,
    {
      result: evalAllowResultSchema;
      commit: (
        params: commitParamsSchema
      ) => Promise<commitAllowResultSchema | commitDenyResultSchema>;
    }
  >;
}
```

For our token transfer tool example, after successfully executing the transfer, we call the Vincent spending limit policy's `commit` function to update the amount spent on behalf of the Vincent App User:

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
import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
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
        reason: 'Insufficient token balance',
        currentBalance: erc20TokenBalance,
        requiredAmount: amountToSend,
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
          reason: 'Transaction reverted during gas estimation/transaction simulation',
          errorCode: error.code,
          revertReason: error.reason || 'Unknown revert reason',
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
        reason: 'Insufficient native token balance',
        currentBalance: nativeTokenBalance,
        requiredAmount: estimatedGas,
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
          error: 'Transaction reverted during gas estimation/transaction simulation',
          errorCode: error.code,
          revertReason: error.reason || 'Unknown revert reason',
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
