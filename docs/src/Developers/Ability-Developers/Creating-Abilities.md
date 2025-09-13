---
title: How Abilities Work
---

# How a Vincent Ability Works

<div class="box info-box">
  <p class="box-title info-box-title">
    <span class="box-icon info-icon">Info</span> Note
  </p>
  <p>Ensure that all the policies consumed by your ability are published on NPM</p>
</div>

A Vincent Ability consists of two main lifecycle methods executed in the following order:

1. **Precheck**: Executed locally by the Vincent Ability executor, this function provides a best-effort check that the ability execution shouldn't fail
   - Before the execution of your ability's `precheck` function, the Vincent Ability SDK will execute the `precheck` functions of the Vincent Policies
   - If all Vincent Policies return `allow` results, the Vincent Ability's `precheck` function will be executed
   - This function is where you'd perform checks such as validating the Vincent Wallet has sufficient token balances, has the appropriate on-chain approvals to make token transfers, or anything else your ability can validate before executing the ability's logic

2. **Execute**: Executed within the Lit Action environment, this function performs the actual ability logic and has the ability to sign data using the Vincent App User's Vincent Wallet
   - Before the execution of your ability's `execute` function, the Vincent Ability SDK will execute the `evaluate` functions of the Vincent Policies
   - If all Vincent Policies return `allow` results, the Vincent Ability's `execute` function will be executed
   - This function is where you'd perform the actual ability logic, such as making token transfers, interacting with smart contracts, or anything else your ability needs to do to fulfill the ability's purpose

# Defining Your Vincent Ability

Vincent Abilities are created by calling the `createVincentAbility` function from the `@lit-protocol/vincent-ability-sdk` package. This function takes a single object parameter that defines your ability's lifecycle methods, parameter schemas, return value schemas, and supported policies.

The following is the basic structure of a Vincent Ability definition:

```typescript
export const vincentAbility = createVincentAbility({
  packageName: 'ability-pkg-name',
  abilityDescription: 'What this ability does',

  abilityParamsSchema,

  supportedPolicies: supportedPoliciesForAbility([]),

  precheckSuccessSchema,
  precheckFailSchema,
  precheck: async ({ abilityParams }, abilityContext) => {},

  executeSuccessSchema,
  executeFailSchema,
  execute: async ({ abilityParams }, abilityContext) => {},
});
```

## The `abilityContext` Argument

The `abilityContext` argument is provided and managed by the Vincent Ability SDK. It's an object containing the following properties and is passed as an argument to your ability's `precheck` and `execute` functions:

```typescript
interface AbilityContext {
  abilityIpfsCid: string;
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
          params: commitParamsSchema,
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

- `abilityIpfsCid`: The IPFS CID of the Vincent Ability that is being executed
- `appId`: The ID of the Vincent App the Vincent Ability is being executed for
- `appVersion`: The version of the Vincent App the Vincent Ability is being executed for
- `delegation`:
  - `delegateeAddress`: The Ethereum address of the Vincent Ability executor
  - `delegatorPkpInfo`:
    - `tokenId`: The token ID of the Vincent App User's Vincent Wallet
    - `ethAddress`: The Ethereum address of the App User's Vincent Wallet
    - `publicKey`: The public key of the App User's Vincent Wallet
- `policiesContext`: An object containing the results of each evaluated Vincent Policy
  - `allow`: A boolean indicating if the Vincent Ability execution is allowed to proceed, and all evaluated Vincent Policies returned `allow` results
  - `allowedPolicies`: An object containing the results and `commit` functions for each Vincent Policy that permitted ability execution
    - `[policyPackageName]`: An object where the key is the package name of the Vincent Policy, and the value is an object containing the result of the policy's `evaluate` function and the policy's `commit` function if it exists
      - `result`: An object will details describing why the policy has permitted ability execution. This will have the shape of the Vincent Policy's [evalAllowResultSchema](../Policy-Developers/Creating-Policies.md#evalallowresultschema)
      - `commit`: An optional function for each evaluated Vincent Policy that allows the policy to update any state it depends on to make it's decisions
        - The parameter object passed to the `commit` function is defined by each Vincent Policy's [commitParamsSchema](../Policy-Developers/Creating-Policies.md#commitparamsschema), and the return value is defined by the policy's [commitAllowResultSchema](../Policy-Developers/Creating-Policies.md#commitallowresultschema) or [commitDenyResultSchema](../Policy-Developers/Creating-Policies.md#commitdenyresultschema)
  - `deniedPolicy`: An object containing the first Vincent Policy that denied the Vincent Ability execution
    - `policyPackageName`: The package name of the Vincent Policy that denied the Vincent Ability execution
    - `result`: The result of the `evaluate` function of the Vincent Policy that denied the Vincent Ability execution, will have the shape of the Vincent Policy's [evalDenyResultSchema](../Policy-Developers/Creating-Policies.md#evaldenyresultschema)
- `succeed`: A helper method for returning a `success` result from your ability's `precheck` and `execute` functions
- `fail`: A helper method for returning a `fail` result from your ability's `precheck` and `execute` functions

## Parameter Schemas

### `abilityParamsSchema`

This Zod schema defines the structure of parameters that executors will provide to your ability. These should be the parameters you require to execute your ability's functionality, as well as any parameters required by the Vincent Policies your ability supports.

For example, if you are building a token transfer ability that supports a Vincent spending limit policy, you might define the `abilityParamsSchema` as follows:

```typescript
import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

const abilityParamsSchema = z.object({
  tokenAddress: z.string(),
  amountToSend: z.number(),
  recipientAddress: z.string(),
});

const vincentAbility = createVincentAbility({
  // ... other ability definitions

  abilityParamsSchema,
});
```

These parameters give your ability what it needs to send a transaction transferring `amountToSend` of `tokenAddress` to `recipientAddress`.

The `tokenAddress` and `amountToSend` parameters are also the parameters required to be given to the Vincent spending limit policy which we'll cover in the next section.

## Defining Supported Policies

<!-- TODO Link to the VincentAbilityPolicy typedoc interface when it's available -->

To add support for Vincent Policies to your ability, you need to create Vincent Ability Policy objects using the `createVincentAbilityPolicy` function from the `@lit-protocol/vincent-ability-sdk` package for each Vincent Policy you want your ability to support. These Vincent Ability Policy objects are then added to your ability's `supportedPolicies` array, which binds the policies to your ability and enables proper parameter mapping between your ability and the policies.

> **Note:** Supporting a Vincent Policy does not mean the policy is required to be used with your ability, it means the Vincent App developer that uses your ability can enabled the supported policies for use by their Vincent App Users, if the App User chooses to enable those policies.

### Creating a `VincentAbilityPolicy` object

Our example Vincent Ability supports a Vincent spending limit policy that has the following schema for the parameters it's expecting to be given by the executing Vincent Ability:

> **Note** The following code is an excerpt from the [Create a Vincent Policy](../Policy-Developers/Creating-Policies.md#userparamsschema) guide.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

const vincentPolicy = createVincentPolicy({
  // ... other policy definitions

  abilityParamsSchema: z.object({
    tokenAddress: z.string(),
    amount: z.number(),
  }),
});
```

As the Vincent Ability developer, what this means is that both your `precheck` and `execute` functions need to pass a `tokenAddress` and `amount` parameter to the `precheck` and `execute` functions of the Vincent spending limit policy.

Because the name of the parameters given to your ability, as defined by your ability's `abilityParamsSchema`, won't always be named the same as or even refer to the same thing as the Vincent Policies your ability supports, we need a way to map the parameters given to your ability to the parameters expected by the Vincent Policies.

To accomplish this, we create a _VincentAbilityPolicy_ object using the `createVincentAbilityPolicy` function:

```typescript
import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';

const abilityParamsSchema = z.object({
  tokenAddress: z.string(),
  amountToSend: z.number(),
  recipientAddress: z.string(),
});

const SpendingLimitPolicy = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy,
  abilityParameterMappings: {
    tokenAddress: 'tokenAddress',
    amountToSend: 'amount',
  },
});

const vincentAbility = createVincentAbility({
  // ... other ability definitions

  abilityParamsSchema,

  supportedPolicies: supportedPoliciesForAbility([SpendingLimitPolicy]),
});
```

A couple of new things are happening in this code example:

First we're importing `bundledVincentPolicy` from the `@lit-protocol/vincent-policy-spending-limit` package, which is a Vincent Policy object created using the Vincent Ability SDK and exported by the policy author for Vincent Abilities to consume.

Then we're creating a `VincentAbilityPolicy` object named `SpendingLimitPolicy` using the `createVincentAbilityPolicy` function. The `createVincentAbilityPolicy` function takes a single object parameter with the required properties:

- `abilityParamsSchema`: The Zod schema (covered in the [Parameter Schemas](#parameter-schemas) section) you've defined for the parameters your ability expects to be given by the Vincent Ability executor
- `bundledVincentPolicy`: The Vincent Policy object created by the policy author for Vincent Abilities to consume, which is imported from the `@lit-protocol/vincent-policy-spending-limit` package
- `abilityParameterMappings`: An object that maps the parameters given to your ability to the parameters expected by the Vincent Policy you're supporting
  - The keys of this object are the parameter names your ability uses (`tokenAddress` and `amountToSend`), and the values are the parameter names expected by the Vincent Policy (`tokenAddress` and `amount`)

Lastly, we take the `SpendingLimitPolicy` object and add it to an array, which we then wrap in a `supportedPoliciesForAbility` function call to our ability's `supportedPolicies` array.

This is how we register the `SpendingLimitPolicy` with our ability. That's all that's needed for your ability to support the Vincent spending limit policy. The execution of the policy's `precheck` and `evaluate` functions will be handled for you by the Vincent Ability SDK, as well as processing the return values from the policy's `precheck` and `evaluate` functions to check if the ability should be allowed to execute.

## Precheck Function

The `precheck` function is executed locally by the Vincent Ability executor to provide a best-effort check that the ability execution shouldn't fail when the `execute` function is called.

Executing a Vincent Ability's `execute` function uses the Lit network, which costs both time and money, so your `precheck` function should perform whatever validation it can to ensure that the ability won't fail during execution.

Before executing your ability's `precheck` function, the Vincent Ability SDK will execute the `precheck` functions of any Vincent Policies registered by the Vincent User. If all policies return `allow` results, the Vincent Ability's `precheck` function will be executed.

For our example token transfer ability, the `precheck` function checks both the Vincent User's Vincent Wallet ERC20 token balance, as well as the native token balance to validate the Vincent Wallet has enough balance to perform the token transfer and pay for the gas fees of the transfer transaction.

> **Note:** The code from the previous sections has been omitted for brevity. The full code example can be found in the [Wrapping Up](#wrapping-up) section at the end of this guide.

```typescript
import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';

import {
  createErc20TransferTransaction,
  getErc20TokenBalance,
  getNativeTokenBalance,
} from './my-ability-code';

const vincentAbility = createVincentAbility({
  // ... other ability definitions

  precheck: async ({ abilityParams }, abilityContext) => {
    const { tokenAddress, amountToSend, recipientAddress } = abilityParams;

    const erc20TokenBalance = await getErc20TokenBalance(
      abilityContext.delegation.delegatorPkpInfo.ethAddress,
      tokenAddress,
      amountToSend,
    );
    if (erc20TokenBalance < amountToSend) {
      return abilityContext.fail({
        reason: 'Insufficient token balance',
        currentBalance: erc20TokenBalance,
        requiredAmount: amountToSend,
      });
    }

    const transferTransaction = createErc20TransferTransaction(
      tokenAddress,
      recipientAddress,
      amountToSend,
    );

    let estimatedGas;
    try {
      // Gas estimation might fail if transaction would revert
      estimatedGas = await transferTransaction.estimateGas();
    } catch (error) {
      // Handle gas estimation failures (transaction would revert)
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return abilityContext.fail({
          reason: 'Transaction reverted during gas estimation/transaction simulation',
          errorCode: error.code,
          revertReason: error.reason || 'Unknown revert reason',
          transferTransaction,
        });
      }

      // Let the Vincent Ability SDK handle the error
      throw error;
    }

    const nativeTokenBalance = await getNativeTokenBalance(
      abilityContext.delegation.delegatorPkpInfo.ethAddress,
      estimatedGas,
    );

    if (nativeTokenBalance < estimatedGas) {
      return abilityContext.fail({
        reason: 'Insufficient native token balance',
        currentBalance: nativeTokenBalance,
        requiredAmount: estimatedGas,
      });
    }

    return abilityContext.succeed({
      erc20TokenBalance,
      nativeTokenBalance,
      estimatedGas,
    });
  },
});
```

Two arguments are passed to your ability's `precheck` function by the Vincent Ability SDK. The first is an object containing the `abilityParams` the adhere to the `abilityParamsSchema` you have defined for your ability. The second is the [`abilityContext`](#the-abilitycontext-argument) managed by the Vincent Ability SDK that contains helper methods for returning `succeed` and `fail` results, as well as some metadata about the Vincent App that the ability is being executed for.

### `precheckSuccessSchema`

This Zod schema defines the structure of successful `precheck` results. What's included in the returned object is up to you, but ideally it includes details about why the `precheck` passed.

The following schema returns useful information to the Vincent Ability executor about the current balances of the Vincent Wallet, as well as the estimated gas cost of the transaction:

```typescript
import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

const vincentAbility = createVincentAbility({
  // ... other ability definitions

  precheckSuccessSchema: z.object({
    erc20TokenBalance: z.number(),
    nativeTokenBalance: z.number(),
    estimatedGas: z.number(),
  }),
});
```

### `precheckFailSchema`

This Zod schema defines the structure of a failed `precheck` result. What's included in the returned object is up to you, but ideally it includes details about why the `precheck` failed.

The following schema returns additional information to the Vincent Ability executor that would help them understand why the ability execution would fail. In this case, the `reason` string allows the `precheck` function to return a specific error message stating something like `"Insufficient token balance"` or `"Insufficient native token balance"`, along with current and required amounts for debugging:

> **Note:** If any unhandled error occurs during execution of your ability's `precheck` function, the Vincent Ability SDK will automatically return a `fail` result with the error message.

```typescript
import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

const vincentAbility = createVincentAbility({
  // ... other ability definitions

  precheckFailSchema: z.object({
    reason: z.string(),
    currentBalance: z.number().optional(),
    requiredAmount: z.number().optional(),
  }),
});
```

## Execute Function

The `execute` function is the main logic of your Vincent Ability, executed within the Lit Action environment when the Vincent Ability executor wants to perform the actual ability operation on behalf of the Vincent App User.

Unlike the `precheck` function which only validates feasibility, the `execute` function performs the actual work your ability is designed to do. Additionally, because the `execute` function is executed in the Lit Action environment, it has access to the full Lit Action capabilities, including the ability to sign transactions and data using the Vincent App User's Vincent Wallet (for more information on what's available to you within the Lit Action environment see the Lit Protocol [Lit Action](https://developer.litprotocol.com/sdk/serverless-signing/overview) docs).

> **Note** This [Lit Action](https://developer.litprotocol.com/sdk/serverless-signing/combining-signatures) doc page covers how to sign data with a PKP using the Ethers.js library within a Lit Action. Ethers.js is injected by Lit into the Lit Action runtime, so you don't need to import it to use it within your ability's `execute` function.

Before executing your ability's `execute` function, the Vincent Ability SDK will execute the `evaluate` functions of any Vincent Policies registered by the Vincent User. If all policies return `allow` results, your ability's `execute` function will be executed.

For our example token transfer ability, the `execute` function performs the actual ERC20 token transfer transaction:

```typescript
import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';

import { createErc20TransferTransaction } from './my-ability-code';

const vincentAbility = createVincentAbility({
  // ... other ability definitions

  execute: async ({ abilityParams }, abilityContext) => {
    const { tokenAddress, amountToSend, recipientAddress } = abilityParams;

    const transferTransaction = createErc20TransferTransaction(
      tokenAddress,
      recipientAddress,
      amountToSend,
    );

    try {
      // Estimate gas to catch potential revert reasons early
      const estimatedGas = await transferTransaction.estimateGas();
    } catch (error) {
      // Handle different types of errors
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return abilityContext.fail({
          error: 'Transaction reverted during gas estimation/transaction simulation',
          errorCode: error.code,
          revertReason: error.reason || 'Unknown revert reason',
          transferTransaction,
        });
      }

      // Let the Vincent Ability SDK handle the error
      throw error;
    }

    const transferTransactionHash = await transferTransaction.send();
    return abilityContext.succeed({
      transferTransactionHash,
    });
  },
});
```

Two arguments are passed to your ability's `execute` function by the Vincent Ability SDK. The first is an object containing the `abilityParams` the adhere to the `abilityParamsSchema` you have defined for your ability. The second is the [`abilityContext`](#the-abilitycontext-argument) managed by the Vincent Ability SDK that contains helper methods for returning `succeed` and `fail` results, as well as some metadata about the Vincent App that the ability is being executed for.

### `executeSuccessSchema`

This Zod schema defines the structure of a successful `execute` result. What's included in the returned object is up to you, but ideally it includes details about why the `execute` function is allowing the Vincent Ability execution.

The following schema returns to the Vincent Ability executor the transaction hash of the executed transaction, and the hash for the transaction sent during the execution of the Vincent spending limit policy's `commit` function to update the amount of tokens spent (this is covered further in the [Executing Vincent Policy Commit Functions](#executing-vincent-policy-commit-functions) section):

```typescript
import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

const vincentAbility = createVincentAbility({
  // ... other policy definitions

  executeSuccessSchema: z.object({
    transferTransactionHash: z.string(),
    spendTransactionHash: z.string().optional(),
  }),
});
```

### `executeFailSchema`

This Zod schema defines the structure of a failed `execute` result. What's included in the returned object is up to you, but ideally it includes details about why the `execute` function failed.

The following schema returns error information to the Vincent Ability executor, including an error message, error code, and revert reason for failed transactions to assist with debugging:

> **Note:** If any unhandled error occurs during execution of your ability's `execute` function, the Vincent Ability SDK will automatically return a `fail` result with the error message.

```typescript
import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { z } from 'zod';

const vincentAbility = createVincentAbility({
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

After your ability's `execute` function successfully completes, the last step of the function should be calling the `commit` functions for any of your ability's supported Vincent Policies that have a `commit` function. These `commit` functions allow policies to update their internal state based on what actions your ability performed, and are usually critical to the functionality and security of the policies.

> **WARNING** Your ability's `execute` function should always call the `commit` functions for any of your ability's supported Vincent Policies that have a `commit` function defined. Failing to do so could cause the Vincent Policies to operate incorrectly, failing to deny ability executions that exceed the Vincent App User's defined limits.

Vincent Policy commit functions are **optional** - not all policies will have them. They're typically used by policies that need to track cumulative data like spending amounts, execution counts, or other stateful information that depends on successful ability execution.

After all the Vincent Policies that have been registered to be used with your ability for the specific Vincent App the ability is being executed for have been evaluated, the `policiesContext` property from the `abilityContext` object will be updated to contain the policy evaluation results.

The `policiesContext` object contains a property called `allowedPolicies` that is an object where the keys are the package names of the evaluated Vincent policies, and the values are objects containing the `evalAllowResult` of the policy, and the policy's `commit` function if one exists for the policy:

> **Note:** The following interface isn't the actual interface used by the Vincent Ability SDK, it's just a simplified example of what the `policiesContext` object looks like for reference.
>
> The [`evalAllowResultSchema`](../Policy-Developers/Creating-Policies.md#evalallowresultschema) and [`commitParamsSchema`](../Policy-Developers/Creating-Policies.md#commitparamsschema) are Zod schemas specified by the Vincent Policy package.

```typescript
interface PoliciesContext {
  allowedPolicies: Record<
    string,
    {
      result: evalAllowResultSchema;
      commit: (
        params: commitParamsSchema,
      ) => Promise<commitAllowResultSchema | commitDenyResultSchema>;
    }
  >;
}
```

For our token transfer ability example, after successfully executing the transfer, we call the Vincent spending limit policy's `commit` function to update the amount spent on behalf of the Vincent App User:

```typescript
import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';

import { createErc20TransferTransaction } from './my-ability-code';

const vincentAbility = createVincentAbility({
  // ... other ability definitions

  execute: async ({ abilityParams }, abilityContext) => {
    const { tokenAddress, amountToSend, recipientAddress } = abilityParams;

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

    return abilityContext.succeed({
      transferTransactionHash,
      spendTransactionHash,
    });
  },
});
```

# Wrapping Up

This guide has covered the basics of creating a Vincent Ability with supported Vincent Policies to be consumed by Vincent Apps. You've learned how to define supported Vincent Policies for your ability, how to define the ability's `precheck` and `execute` functions, how to execute Vincent Policy `commit` functions, as well as how to define the schemas for the parameters required by the ability's `precheck` and `execute` functions.

For the token transfer ability example we've been building throughout this guide, the final ability definition would look like the following:

```typescript
import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';

const abilityParamsSchema = z.object({
  tokenAddress: z.string(),
  amountToSend: z.number(),
  recipientAddress: z.string(),
});

const SpendingLimitPolicy = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy,
  abilityParameterMappings: {
    tokenAddress: 'tokenAddress',
    amountToSend: 'amount',
  },
});

const vincentAbility = createVincentAbility({
  abilityParamsSchema,

  supportedPolicies: supportedPoliciesForAbility([SpendingLimitPolicy]),

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
  precheck: async ({ abilityParams }, abilityContext) => {
    const { tokenAddress, amountToSend, recipientAddress } = abilityParams;

    const erc20TokenBalance = await getErc20TokenBalance(
      abilityContext.delegation.delegatorPkpInfo.ethAddress,
      tokenAddress,
      amountToSend,
    );
    if (erc20TokenBalance < amountToSend) {
      return abilityContext.fail({
        reason: 'Insufficient token balance',
        currentBalance: erc20TokenBalance,
        requiredAmount: amountToSend,
      });
    }

    const transferTransaction = createErc20TransferTransaction(
      tokenAddress,
      recipientAddress,
      amountToSend,
    );

    let estimatedGas;
    try {
      // Gas estimation might fail if transaction would revert
      estimatedGas = await transferTransaction.estimateGas();
    } catch (error) {
      // Handle gas estimation failures (transaction would revert)
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return abilityContext.fail({
          reason: 'Transaction reverted during gas estimation/transaction simulation',
          errorCode: error.code,
          revertReason: error.reason || 'Unknown revert reason',
          transferTransaction,
        });
      }

      // Let the Vincent Ability SDK handle the error
      throw error;
    }

    const nativeTokenBalance = await getNativeTokenBalance(
      abilityContext.delegation.delegatorPkpInfo.ethAddress,
      estimatedGas,
    );

    if (nativeTokenBalance < estimatedGas) {
      return abilityContext.fail({
        reason: 'Insufficient native token balance',
        currentBalance: nativeTokenBalance,
        requiredAmount: estimatedGas,
      });
    }

    return abilityContext.succeed({
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
  execute: async ({ abilityParams }, abilityContext) => {
    const { tokenAddress, amountToSend, recipientAddress } = abilityParams;

    const transferTransaction = createErc20TransferTransaction(
      tokenAddress,
      recipientAddress,
      amountToSend,
    );

    try {
      // Estimate gas to catch potential revert reasons early
      const estimatedGas = await transferTransaction.estimateGas();
    } catch (error) {
      // Handle different types of errors
      if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        return abilityContext.fail({
          error: 'Transaction reverted during gas estimation/transaction simulation',
          errorCode: error.code,
          revertReason: error.reason || 'Unknown revert reason',
          transferTransaction,
        });
      }

      // Let the Vincent Ability SDK handle the error
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

    return abilityContext.succeed({
      transferTransactionHash,
      spendTransactionHash,
    });
  },
});
```
