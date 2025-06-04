# Developing a Custom Tool

The `createVincentTool` function is a helper function that takes several required parameters to produce a strongly typed Tool object that describes properties of the tool such as input parameters, validation schemas, and execution logic. It can be imported from the Vincent Tool and Policy SDK like so:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
```

`createVincentTool` takes a `VincentToolDef` which has several required and optional properties which we'll cover using a reference implementation of a Uniswap Swap tool for additional context.

## Defining the `VincentToolDef`

The following sections will be using code from a reference implementation of a Uniswap Swap tool. The purpose of this tool is to enable Vincent App Delegatees to perform token swaps on Uniswap on behalf of Vincent App Users, with user defined safeguards and policies that a Vincent App User can configure to restrict how the Vincent App Delegatees can execute the Vincent Tool.

This specific tool integrates with a Spending Limit Policy to restrict the amount of USD that can be spent on behalf of the Vincent App User by the Vincent App Delegatees.

### Required Property: `ipfsCid`

The `ipfsCid` property is a string that represents the CID of the tool on IPFS. This is used by Vincent to identify your tool, register the tool with Vincent App Versions, validate the Vincent App User has configured this tool for execution, and retrieve the bundled code from IPFS for execution.

Of course while developing your tool, you won't have the final IPFS CID, so you can leave a placeholder `string` during development and replace it with the actual IPFS CID once you've uploaded your tool to IPFS and are ready to publish your Vincent Tool.

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
});
```

### Required Property: `packageName`

The `packageName` property is a string that matches the NPM package name your Tool will be published to NPM with. Vincent Tool developers and Vincent App developers will be installing Vincent Tools from NPM, so it's important that `packageName` is unique, descriptive, and matches the NPM installable package name so it's easy to identify.

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-tool-uniswap-swap',
});
```

### Required Property: `toolParamsSchema`

The `toolParamsSchema` property is a Zod schema that describes the input parameters your tool accepts when executed by Vincent App Delegatees. These parameters define what information is required for your tool to function properly. Part of the magic of `createVincentTool` is a wrapper function that will validate the provided parameters against the `toolParamsSchema` you've defined, so you don't have to worry about validating these parameters yourself during runtime.

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

export const UniswapSwapToolParamsSchema = z.object({
    ethRpcUrl: z.string(),
    rpcUrlForUniswap: z.string(),
    chainIdForUniswap: z.number(),
    pkpEthAddress: z.string(),

    tokenInAddress: z.string(),
    tokenInDecimals: z.number(),
    tokenInAmount: z.number().refine((val) => val > 0, {
        message: 'tokenInAmount must be greater than 0',
    }),

    tokenOutAddress: z.string(),
    tokenOutDecimals: z.number(),

    poolFee: z.number().optional(),
    slippageTolerance: z.number().optional(),
    swapDeadline: z.number().optional(),
});

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-tool-uniswap-swap',

  toolParamsSchema: UniswapSwapToolParamsSchema,
});
```

The properties in `UniswapSwapToolParamsSchema` are specific to the Uniswap Swap Tool, what's defined for `toolParamsSchema` is up to you as the Vincent Tool developer and should be tailored to the needs of the tool you're developing.

Because this Uniswap Swap Tool needs to interact with blockchain networks and perform token swaps, it requires properties such as RPC URLs, chain IDs, token addresses, amounts, and optional parameters for pool fees and slippage tolerance.

To reiterate, the `UniswapSwapToolParamsSchema` shown above is a reference implementation for `toolParamsSchema` and none of these properties are required for your custom Vincent Tool. The `toolParamsSchema` you define is completely custom and used to provide your tool with the information it needs to execute successfully.

### Required Property: `supportedPolicies`

The `supportedPolicies` property is an array of `VincentPolicyDef` objects imported from Vincent Policy NPM packages that your tool supports. These policies will be evaluated before your tool executes to determine if the execution should be permitted.

Each Vincent Policy defined in `supportedPolicies` is optional and up to the Vincent App Developer to decide whether to use or not. By including policies in `supportedPolicies`, you're indicating that your tool supports the policy and handles providing the correct input parameters to the policy when it's executed.

```typescript
import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';

export const UniswapSwapToolParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicy = createVincentToolPolicy({
    toolParamsSchema: UniswapSwapToolParamsSchema,
    policyDef: SpendingLimitPolicyDef.vincentPolicyDef,
    toolParameterMappings: {
        pkpEthAddress: 'pkpEthAddress',
        ethRpcUrl: 'ethRpcUrl',
        tokenInAddress: 'tokenAddress',
        tokenInDecimals: 'tokenDecimals',
        tokenInAmount: 'buyAmount',
    },
});

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-tool-uniswap-swap',

  toolParamsSchema: UniswapSwapToolParamsSchema,
  supportedPolicies: [SpendingLimitPolicy] as const,
});
```

#### `createVincentToolPolicy` function

The `createVincentToolPolicy` function is imported from the Vincent Tool and Policy SDK and is used to create a policy adapter that maps your tool's input parameters to the policy's expected input parameters via the `toolParameterMappings` object.

In the above code example, the object keys are the Vincent Tool's input parameters, and the values are the name of the policy's expected input parameters they should be mapped to. They keys and values that available to use are type safe and sourced from the `toolParamsSchema` and `policyDef` you provide to the `createVincentToolPolicy` function.

### Optional Property: Policy `precheck` Function

The `precheck` function is a crucial optimization that helps Vincent App Delegatees avoid wasting resources on operations that would ultimately fail due to tool and/or policy restrictions. For example, if a Spending Limit policy has already reached its daily maximum, there's no point in attempting the transaction, or if the Vincent App User's Agent Wallet doesn't have enough ETH to pay for gas, or token balance to perform the swap.

Key characteristics of the `precheck` function:

- It must be **non-mutative** - it should only read and validate, never modify state as there's no guarantee the your tool will be executed after the `precheck` function is called
- It should perform the same validation checks that your tool will perform during execution
- It provides a "best effort" prediction of whether the operation will succeed
- It helps Vincent App Delegatees make informed decisions before committing resources to the operation

Defining a `precheck` method is **optional**, but highly recommended. If you choose to define one, your tool's `VincentToolDef` will need to define a Zod schema for `precheckSuccessSchema` which describes a successful precheck result, and `precheckFailSchema` which describes a failed precheck result.

#### `precheckSuccessSchema`

The `precheckSuccessSchema` is a Zod schema that describes the object that will be returned by the `precheck` function if it's validation checks pass, and the tool is expected to execute successfully.

What's returned by the `precheck` function for the success case is up to you as the Vincent Tool developer, but it should contain information that will be useful to the Vincent App Delegatee to determine whether the Vincent Tool should be executed.

```typescript
import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';

export const UniswapSwapToolParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicy = createVincentToolPolicy({ /** ... */ });

const UniswapSwapToolPrecheckSuccessSchema = z.object({
    allow: z.literal(true),
});

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-tool-uniswap-swap',

  toolParamsSchema: UniswapSwapToolParamsSchema,
  supportedPolicies: [SpendingLimitPolicy] as const,

  precheckSuccessSchema: UniswapSwapToolPrecheckSuccessSchema,
});
```

For the Uniswap Swap Tool, `UniswapSwapToolPrecheckSuccessSchema` is returning the `allow` property as `true` to indicate that the tool is expected to execute successfully.

#### `precheckFailSchema`

The `precheckFailSchema` is a Zod schema that describes the object that will be returned by the `precheck` function if it's validation checks fail, and the tool is expected to fail.

What's returned by the `precheck` function for the fail case is up to you as the Vincent Tool developer, but it should contain information that will be useful to the Vincent App Delegatee to determine whether the Vincent Tool should be executed.

```typescript
import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';

export const UniswapSwapToolParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicy = createVincentToolPolicy({ /** ... */ });

const UniswapSwapToolPrecheckSuccessSchema = z.object({ /** ... */ });
const UniswapSwapToolPrecheckFailSchema = z.object({
    allow: z.literal(false),
    error: z.string(),
});

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-tool-uniswap-swap',

  toolParamsSchema: UniswapSwapToolParamsSchema,
  supportedPolicies: [SpendingLimitPolicy] as const,

  precheckSuccessSchema: UniswapSwapToolPrecheckSuccessSchema,
  precheckFailSchema: UniswapSwapToolPrecheckFailSchema,
});
```

For the Uniswap Swap Tool, `UniswapSwapToolPrecheckFailSchema` is returning the `allow` property as `false` to indicate that the tool is expected to fail, and the `error` property as a `string` that describes the error that occurred during the `precheck` function.

#### The `precheck` Function

This function **must** be defined inline in the `VincentToolDef` object in order for the type inference that `createVincentTool` provides to work.

The following is a reference implementation of the `precheck` function for the Uniswap Swap Tool:

```typescript
import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';
import { createPublicClient, http } from 'viem';

// Not included in this reference implementation
import {
    checkNativeTokenBalance,
    checkUniswapPoolExists,
    checkTokenInBalance,
} from './tool-checks';

export const UniswapSwapToolParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicy = createVincentToolPolicy({ /** ... */ });

const UniswapSwapToolPrecheckSuccessSchema = z.object({ /** ... */ });
const UniswapSwapToolPrecheckFailSchema = z.object({ /** ... */ });

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-tool-uniswap-swap',

  toolParamsSchema: UniswapSwapToolParamsSchema,
  supportedPolicies: [SpendingLimitPolicy] as const,

  precheckSuccessSchema: UniswapSwapToolPrecheckSuccessSchema,
  precheckFailSchema: UniswapSwapToolPrecheckFailSchema,

  precheck: async ({ toolParams }, { policiesContext, fail, succeed }) => {
        const {
            pkpEthAddress,
            rpcUrlForUniswap,
            chainIdForUniswap,
            tokenInAddress,
            tokenInDecimals,
            tokenInAmount,
            tokenOutAddress,
            tokenOutDecimals,
            poolFee,
        } = toolParams;

        const client = createPublicClient({
            transport: http(rpcUrlForUniswap),
        });

        await checkNativeTokenBalance({
            client,
            pkpEthAddress: pkpEthAddress as `0x${string}`,
        });

        await checkTokenInBalance({
            client,
            pkpEthAddress: pkpEthAddress as `0x${string}`,
            tokenInAddress: tokenInAddress as `0x${string}`,
            tokenInAmount: BigInt(tokenInAmount),
        });

        await checkUniswapPoolExists({
            rpcUrl: rpcUrlForUniswap,
            chainId: chainIdForUniswap,
            tokenInAddress: tokenInAddress as `0x${string}`,
            tokenInDecimals,
            tokenInAmount: BigInt(tokenInAmount),
            tokenOutAddress: tokenOutAddress as `0x${string}`,
            tokenOutDecimals,
            poolFee,
        });

        // TODO Check tokenInAddress ERC20 Allowance for Uniswap Router Contract

        return succeed({
            allow: true,
        });
    },
});
```

The input parameters to the `precheck` function are magic values that are provided by the `createVincentTool` wrapper function. `toolParams` will have the properties defined by `toolParamsSchema`, and `policiesContext` contains any return values from the policy `precheck` functions that were executed.

The `succeed` and `fail` parameters are functions that your `precheck` function will call depending on whether the precheck validation passes or fails. The structure of the objects passed to `succeed` and `fail` are defined by the `precheckSuccessSchema` and `precheckFailSchema` respectively.

In this reference implementation, the precheck function validates:

1. That the PKP has sufficient native token balance for gas fees
2. That the PKP has sufficient balance of the input token for the swap
3. That a Uniswap pool exists for the token pair

### Required Property: Tool `execute` Function

The `execute` function is the core function that defines the main logic of your tool. This function is what's executed by the Vincent App Delegatee after all Vincent Policies have been evaluated and permitted the tool to execute.

The `execute` function is expected to perform the actual operations your tool is designed to do, such as sending transactions, interacting with smart contracts, or performing other blockchain operations.

Defining an `execute` function is **required**, and the `executeSuccessSchema` and `executeFailSchema` are required to be defined in your `VincentToolDef` object.

#### `executeSuccessSchema`

The `executeSuccessSchema` is a Zod schema that describes the object that will be returned by the `execute` function if it executes successfully.

What's returned by the `execute` function for the success case is up to you as the Vincent Tool developer, but it should contain information that will be useful to the Vincent App Delegatee or information that a Vincent App may want to display to the Vincent App User.

```typescript
import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';
import { createPublicClient, http } from 'viem';

// Not included in this reference implementation
import {
    checkNativeTokenBalance,
    checkUniswapPoolExists,
    checkTokenInBalance,
} from './tool-checks';

export const UniswapSwapToolParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicy = createVincentToolPolicy({ /** ... */ });

const UniswapSwapToolPrecheckSuccessSchema = z.object({ /** ... */ });
const UniswapSwapToolPrecheckFailSchema = z.object({ /** ... */ });

const UniswapSwapToolExecuteSuccessSchema = z.object({
    erc20ApprovalTxHash: z.string(),
    swapTxHash: z.string(),
    spendTxHash: z.string().optional(),
});

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-tool-uniswap-swap',

  toolParamsSchema: UniswapSwapToolParamsSchema,
  supportedPolicies: [SpendingLimitPolicy] as const,

  precheckSuccessSchema: UniswapSwapToolPrecheckSuccessSchema,
  precheckFailSchema: UniswapSwapToolPrecheckFailSchema,

  executeSuccessSchema: UniswapSwapToolExecuteSuccessSchema,

  precheck: async ({ toolParams }, { policiesContext, fail, succeed }) => { /** ... */ },
});
```

For the Uniswap Swap Tool, `UniswapSwapToolExecuteSuccessSchema` returns transaction hashes for the approval and swap transactions, plus an optional spending transaction hash if a spending limit policy was used.

#### `executeFailSchema`

The `executeFailSchema` is a Zod schema that describes the object that will be returned by the `execute` function if it encounters an error during execution.

What's returned by the `execute` function for the fail case is up to you as the Vincent Tool developer, but it should contain information that will be useful to the Vincent App Delegatee or information that a Vincent App may want to display to the Vincent App User to explain why the tool execution failed.

```typescript
import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';
import { createPublicClient, http } from 'viem';

// Not included in this reference implementation
import {
    checkNativeTokenBalance,
    checkUniswapPoolExists,
    checkTokenInBalance,
} from './tool-checks';

export const UniswapSwapToolParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicy = createVincentToolPolicy({ /** ... */ });

const UniswapSwapToolPrecheckSuccessSchema = z.object({ /** ... */ });
const UniswapSwapToolPrecheckFailSchema = z.object({ /** ... */ });

const UniswapSwapToolExecuteSuccessSchema = z.object({ /** ... */ });
const UniswapSwapToolExecuteFailSchema = z.object({
    error: z.string(),
});

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-tool-uniswap-swap',

  toolParamsSchema: UniswapSwapToolParamsSchema,
  supportedPolicies: [SpendingLimitPolicy] as const,

  precheckSuccessSchema: UniswapSwapToolPrecheckSuccessSchema,
  precheckFailSchema: UniswapSwapToolPrecheckFailSchema,

  executeSuccessSchema: UniswapSwapToolExecuteSuccessSchema,
  executeFailSchema: UniswapSwapToolExecuteFailSchema,

  precheck: async ({ toolParams }, { policiesContext, fail, succeed }) => { /** ... */ },
});
```

For the Uniswap Swap Tool, `UniswapSwapToolExecuteFailSchema` returns an `error` property as a string that describes what went wrong during the tool execution.

#### The `execute` Function

This function **must** be defined inline in the `VincentToolDef` object in order for the type inference that `createVincentTool` provides to work.

The following is a reference implementation of the `execute` function for the Uniswap Swap Tool:

```typescript
import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';
import { createPublicClient, http } from 'viem';
import { FeeAmount } from '@uniswap/v3-sdk';
import { Percent } from '@uniswap/sdk-core';

// Not included in this reference implementation
import {
    getPkpInfo,
    getUniswapQuote,
    sendErc20ApprovalTx,
    sendUniswapTx,
    getTokenAmountInUsd,
} from './tool-helpers';
import {
    checkNativeTokenBalance,
    checkUniswapPoolExists,
    checkTokenInBalance,
} from './tool-checks';

export const UniswapSwapToolParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicy = createVincentToolPolicy({ /** ... */ });

const UniswapSwapToolPrecheckSuccessSchema = z.object({ /** ... */ });
const UniswapSwapToolPrecheckFailSchema = z.object({ /** ... */ });

const UniswapSwapToolExecuteSuccessSchema = z.object({ /** ... */ });
const UniswapSwapToolExecuteFailSchema = z.object({ /** ... */ });

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-tool-uniswap-swap',

  toolParamsSchema: UniswapSwapToolParamsSchema,
  supportedPolicies: [SpendingLimitPolicy] as const,

  precheckSuccessSchema: UniswapSwapToolPrecheckSuccessSchema,
  precheckFailSchema: UniswapSwapToolPrecheckFailSchema,

  executeSuccessSchema: UniswapSwapToolExecuteSuccessSchema,
  executeFailSchema: UniswapSwapToolExecuteFailSchema,

  precheck: async ({ toolParams }, { policiesContext, fail, succeed }) => { /** ... */ },

  execute: async ({ toolParams }, { succeed, fail, policiesContext }) => {
        const {
            pkpEthAddress,
            ethRpcUrl,
            rpcUrlForUniswap,
            chainIdForUniswap,
            tokenInAddress,
            tokenInDecimals,
            tokenInAmount,
            tokenOutAddress,
            tokenOutDecimals,
            poolFee,
            slippageTolerance,
            swapDeadline,
        } = toolParams;

        const pkpInfo = await getPkpInfo({
            pkpEthAddress: pkpEthAddress as `0x${string}`,
        });

        const { swapQuote, uniswapSwapRoute, uniswapTokenIn, uniswapTokenOut } = await getUniswapQuote({
            rpcUrl: rpcUrlForUniswap,
            chainId: chainIdForUniswap,
            tokenInAddress,
            tokenInDecimals,
            tokenInAmount: BigInt(tokenInAmount),
            tokenOutAddress,
            tokenOutDecimals,
            poolFee,
        });

        const erc20ApprovalTxHash = await sendErc20ApprovalTx({
            rpcUrl: rpcUrlForUniswap,
            chainId: chainIdForUniswap,
            tokenInAmount: BigInt(tokenInAmount),
            tokenInDecimals,
            tokenInAddress: tokenInAddress as `0x${string}`,
            pkpEthAddress: pkpEthAddress as `0x${string}`,
            pkpPublicKey: pkpInfo.publicKey,
        });

        const swapTxHash = await sendUniswapTx({
            rpcUrl: rpcUrlForUniswap,
            chainId: chainIdForUniswap,
            pkpEthAddress: pkpEthAddress as `0x${string}`,
            tokenInDecimals,
            tokenInAmount: BigInt(tokenInAmount),
            pkpPublicKey: pkpInfo.publicKey,
            uniswapSwapRoute,
            uniswapTokenIn,
            uniswapTokenOut,
            swapQuote,
            slippageTolerance: new Percent(slippageTolerance ?? 50, 10_000),
            swapDeadline: BigInt(swapDeadline ?? Math.floor(Date.now() / 1000) + 60 * 20),
        });

        let spendTxHash: string | undefined;
        if (policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit']) {
            const tokenInAmountInUsd = await getTokenAmountInUsd({
                ethRpcUrl,
                tokenAddress: tokenInAddress,
                tokenAmount: BigInt(tokenInAmount),
                tokenDecimals: tokenInDecimals,
                poolFee: poolFee ?? FeeAmount.MEDIUM,
            });

            const spendingLimitPolicyContext =
                policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'];
            const { appId, maxSpendingLimitInUsd } = spendingLimitPolicyContext.result;

            const commitResult = await spendingLimitPolicyContext.commit({
                appId,
                amountSpentUsd: Number(tokenInAmountInUsd),
                maxSpendingLimitInUsd: Number(maxSpendingLimitInUsd),
                pkpEthAddress,
                pkpPubKey: pkpInfo.publicKey,
            });

            if (commitResult.allow) {
                spendTxHash = commitResult.result.spendTxHash;
            } else {
                return fail({
                    error:
                        commitResult.error ?? 'Unknown error occurred while committing spending limit policy',
                });
            }
            console.log(
                `Committed spending limit policy for transaction: ${spendTxHash} (UniswapSwapToolExecute)`,
            );
        }

        return succeed({
            erc20ApprovalTxHash,
            swapTxHash,
            spendTxHash,
        });
    },
});
```

The input parameters to the `execute` function are magic values that are provided by the `createVincentTool` wrapper function. `toolParams` will have the properties defined by `toolParamsSchema`, and `policiesContext` contains information about the policies that were evaluated and their results.

The `succeed` and `fail` parameters are functions that your `execute` function will call depending on whether the execution succeeds or fails. The structure of the objects passed to `succeed` and `fail` are defined by the `executeSuccessSchema` and `executeFailSchema` respectively.

##### Policy Integration and Context

Vincent Tools can integrate with policies through the `policiesContext` parameter available in both `precheck` and `execute` functions. This context provides access to policy evaluation results and allows tools to interact with policy commit functions.

### Accessing Policy Results

```typescript
// Check if a specific policy is active
if (policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit']) {
    const spendingLimitPolicyContext = 
        policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'];
    
    // Access the policy evaluation result
    const { appId, maxSpendingLimitInUsd } = spendingLimitPolicyContext.result;
}
```

### Committing Policy Actions

Some policies provide a `commit` function that should be called after successful tool execution:

```typescript
const commitResult = await spendingLimitPolicyContext.commit({
    appId,
    amountSpentUsd: Number(tokenInAmountInUsd),
    maxSpendingLimitInUsd: Number(maxSpendingLimitInUsd),
    pkpEthAddress,
    pkpPubKey: pkpInfo.publicKey,
});

if (commitResult.allow) {
    spendTxHash = commitResult.result.spendTxHash;
} else {
    return fail({
        error: commitResult.error ?? 'Policy commit failed',
    });
}
```

## Wrapping Up Your Custom Tool

Now that you have your `VincentToolDef` object, the next step is to wrap the object using the `vincentToolHandler` function. This helper function wraps your `VincentToolDef` object in a function that can be used to execute the tool, providing it the magic values, and handling the formatting of any thrown errors.

Because Vincent Tools are executed as Lit Protocol [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview), you'll need to define your wrapped `VincentToolDef` in a separate file that will be bundled and compiled into a _Immediately Invoked Function Expression (IIFE)_, so that it can be uploaded to IPFS and used by the Lit Protocol network as a Lit Action.

For the Uniswap Swap Tool, a new file called `vincent-tool-wrapped.ts` is created:

```typescript
import { vincentToolHandler } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import { UniswapSwapToolDef, UniswapSwapToolParamsSchema } from './vincent-tool';

declare const userPkpTokenId: string;
declare const toolParams: z.infer<typeof UniswapSwapToolParamsSchema>;

(async () =>
  vincentToolHandler({
    vincentToolDef: UniswapSwapToolDef,
    context: {
      pkpTokenId: userPkpTokenId,
      delegation: {
        delegatee: userPkpTokenId,
        delegator: userPkpTokenId,
      },
    },
    toolParams,
  }))();
```
