# Developing a Custom Tool

The `createVincentTool` function is a helper function that takes several required parameters to produce a strongly typed Tool object that describes properties of the tool such as input parameters, validation schemas, and execution logic. It can be imported from the library like so:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
```

`createVincentTool` takes a `VincentToolDef` which has several required and optional properties which we'll cover using a reference implementation of a Uniswap Swap tool for additional context.

## Defining the `VincentToolDef`

The following sections will be using code from a reference implementation of a Uniswap Swap tool. The purpose of this tool is to enable Vincent App Users to perform token swaps on Uniswap through their Vincent Agent Wallet, with appropriate safeguards and policy enforcement.

This specific tool performs several validation checks during precheck (native token balance, token balance, pool existence) and then executes a complete Uniswap swap including ERC20 approval and the actual swap transaction.

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

The `supportedPolicies` property is an array of Vincent Policy objects that your tool supports. These policies will be evaluated before your tool executes to determine if the execution should be permitted. Policies provide governance and safety mechanisms for your tool.

```typescript
import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { z } from 'zod';

export const UniswapSwapToolParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicy = createVincentToolPolicy({
    toolParamsSchema: UniswapSwapToolParamsSchema,
    policyDef: SpendingLimitPolicyDef.__vincentPolicyDef,
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

The `createVincentToolPolicy` function creates a policy adapter that maps your tool's parameters to the policy's expected parameters. The `toolParameterMappings` object defines how your tool's parameters should be mapped to the policy's expected parameter names.

### Required Properties: Result Schemas

Your tool must define schemas for both success and failure cases for precheck and execute operations. These schemas ensure type safety and consistent return formats.

#### `precheckSuccessSchema` and `precheckFailSchema`

These schemas define the structure of responses from your tool's precheck function:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

export const UniswapSwapToolParamsSchema = z.object({ /** ... */ });

export const UniswapSwapToolPrecheckSuccessSchema = z.object({
    allow: z.literal(true),
});

export const UniswapSwapToolPrecheckFailSchema = z.object({
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

#### `executeSuccessSchema` and `executeFailSchema`

These schemas define the structure of responses from your tool's execute function:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

export const UniswapSwapToolParamsSchema = z.object({ /** ... */ });

export const UniswapSwapToolPrecheckSuccessSchema = z.object({ /** ... */ });
export const UniswapSwapToolPrecheckFailSchema = z.object({ /** ... */ });

export const UniswapSwapToolExecuteSuccessSchema = z.object({
    erc20ApprovalTxHash: z.string(),
    swapTxHash: z.string(),
    spendTxHash: z.string().optional(),
});

export const UniswapSwapToolExecuteFailSchema = z.object({
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
});
```

For the Uniswap Swap Tool, the execute success schema returns transaction hashes for the approval and swap transactions, plus an optional spending transaction hash if a spending limit policy was used.

### Optional Property: Tool Precheck Function

The `precheck` function is a crucial optimization that helps Vincent App Delegatees avoid wasting resources on operations that would ultimately fail. For example, if a user doesn't have sufficient token balance or if a Uniswap pool doesn't exist, there's no point in attempting the transaction.

Key characteristics of the `precheck` function:

- It must be **non-mutative** - it should only read and validate, never modify state as there's no guarantee the tool will be executed after the `precheck` function is called
- It should perform validation checks that predict whether the operation will succeed
- It provides a "best effort" prediction of whether the operation will succeed
- It helps delegatees make informed decisions before committing resources to the operation

The `precheck` function acts as an early warning system, allowing delegatees to quickly determine if an operation is likely to succeed before investing time and computational resources in the full execution.

Defining a `precheck` method is **optional**, but highly recommended.

#### The `precheck` Function

This function **must** be defined inline in the `VincentToolDef` object in order for the type inference that `createVincentTool` provides to work.

The following is a reference implementation of the `precheck` function for the Uniswap Swap Tool:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { createPublicClient, http } from 'viem';
import {
    checkNativeTokenBalance,
    checkUniswapPoolExists,
    checkTokenInBalance,
} from './tool-checks';

export const UniswapSwapToolDef = createVincentTool({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-tool-uniswap-swap',

  toolParamsSchema: UniswapSwapToolParamsSchema,
  supportedPolicies: [SpendingLimitPolicy] as const,

  precheckSuccessSchema: UniswapSwapToolPrecheckSuccessSchema,
  precheckFailSchema: UniswapSwapToolPrecheckFailSchema,
  executeSuccessSchema: UniswapSwapToolExecuteSuccessSchema,
  executeFailSchema: UniswapSwapToolExecuteFailSchema,

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

        return succeed({
            allow: true,
        });
    },
});
```

The input parameters to the `precheck` function are magic values that are provided by the `createVincentTool` wrapper function. `toolParams` will have the properties defined by `toolParamsSchema`, and `policiesContext` contains information about the policies that will be evaluated.

The `succeed` and `fail` parameters are functions that your `precheck` function will call depending on whether the precheck validation passes or fails. The structure of the objects passed to `succeed` and `fail` are defined by the `precheckSuccessSchema` and `precheckFailSchema` respectively.

In this reference implementation, the precheck function validates:
1. That the PKP has sufficient native token balance for gas fees
2. That the PKP has sufficient balance of the input token for the swap
3. That a Uniswap pool exists for the token pair

### Required Property: Tool `execute` Function

The `execute` function is the core function that defines the main logic of your tool. This function is called when the tool is actually executed, after all precheck validations and policy evaluations have passed.

The `execute` function is expected to perform the actual operations your tool is designed to do, such as sending transactions, interacting with smart contracts, or performing other blockchain operations.

Defining an `execute` function is **required**.

#### The `execute` Function

This function **must** be defined inline in the `VincentToolDef` object in order for the type inference that `createVincentTool` provides to work.

The following is a reference implementation of the `execute` function for the Uniswap Swap Tool:

```typescript
import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { Percent } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import {
    getPkpInfo,
    getUniswapQuote,
    sendErc20ApprovalTx,
    sendUniswapTx,
    getTokenAmountInUsd,
} from './tool-helpers';

export const UniswapSwapToolDef = createVincentTool({
  // ... other properties

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

In this reference implementation, the execute function:
1. Retrieves PKP information for signing transactions
2. Gets a quote from Uniswap for the token swap
3. Sends an ERC20 approval transaction to allow Uniswap to spend the input tokens
4. Sends the actual Uniswap swap transaction
5. If a spending limit policy is active, commits the spending amount to the policy
6. Returns the transaction hashes for tracking

## Policy Integration and Context

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

## Tool Helper Functions

It's recommended to organize your tool's logic into helper functions that can be imported and reused. This makes your tool more maintainable and testable.

### Example Helper Structure

```typescript
// tool-helpers.ts
export async function getPkpInfo(params: { pkpEthAddress: `0x${string}` }) {
    // Implementation for retrieving PKP information
}

export async function getUniswapQuote(params: {
    rpcUrl: string;
    chainId: number;
    tokenInAddress: string;
    // ... other parameters
}) {
    // Implementation for getting Uniswap quotes
}

// tool-checks.ts
export async function checkNativeTokenBalance(params: {
    client: PublicClient;
    pkpEthAddress: `0x${string}`;
}) {
    // Implementation for checking native token balance
}

export async function checkTokenInBalance(params: {
    client: PublicClient;
    pkpEthAddress: `0x${string}`;
    tokenInAddress: `0x${string}`;
    tokenInAmount: bigint;
}) {
    // Implementation for checking ERC20 token balance
}
```

## Wrapping Up Your Custom Tool

Once you have your `VincentToolDef` object fully defined, you can export it for use by Vincent Apps and other developers:

```typescript
export { UniswapSwapToolDef } from './vincent-tool';
```

Your tool is now ready to be:
1. Bundled and uploaded to IPFS
2. Published to NPM for easy installation
3. Integrated into Vincent Apps
4. Used by Vincent App Delegatees to perform operations on behalf of Vincent App Users

## Best Practices

1. **Comprehensive Validation**: Use the `precheck` function to validate all prerequisites before execution
2. **Error Handling**: Provide clear, descriptive error messages in your fail responses
3. **Type Safety**: Leverage Zod schemas for strong typing and runtime validation
4. **Helper Functions**: Organize complex logic into separate, testable helper functions
5. **Policy Integration**: Properly integrate with supported policies and handle their commit functions
6. **Documentation**: Provide clear documentation for your tool's parameters and expected behavior
7. **Testing**: Thoroughly test your tool in various scenarios and edge cases

Your custom Vincent Tool should now be ready for deployment and use within the Vincent ecosystem!
