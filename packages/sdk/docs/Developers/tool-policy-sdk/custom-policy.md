# Developing a Custom Policy

The `createVincentPolicy` function is a helper function that takes several required parameters to produce a strongly typed Policy object that describes properties of the policy such as input parameters and return values. It can be imported from the library like so:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
```

`createVincentPolicy` takes a `VincentPolicyDef` which has several required and optional properties which we'll cover using a reference implementation of a Spending Limit policy for additional context.

## Defining the `VincentPolicyDef`

The following sections will be using code from a reference implementation of a Spending Limit policy. The purpose of this policy is give the Vincent App User the ability to specify a maximum amount of USD they're allowing the Vincent App Delegatee to spend on the behalf for a Vincent Uniswap Swap Tool.

This specific policy has a smart contract deployed that keeps track of the daily spending amount for a given Vincent App User's Agent Wallet. The policy will check the daily spending amount and if it exceeds the maximum amount specified by the Vincent App User, it will prevent the Vincent Tool from executing.

When the policy permits the Vincent Tool to execute, it will update the daily spending amount for the Vincent App User's Agent Wallet after the Vincent Uniswap Swap Tool has executed, and a Uniswap swap has been performed.

### Required Property: `ipfsCid`

The `ipfsCid` property is a string that represents the CID of the policy on IPFS. This is used by Vincent to identify your policy, register the policy with Vincent App Versions, validate the Vincent App User has configured this policy for the executing Vincent Tool, and retrieve the bundled code from IPFS for execution.

Of course while developing your policy, you won't have the final IPFS CID, so you can leave a placeholder `string` during development and replace it with the actual IPFS CID once you've uploaded your policy to IPFS and are ready to publish your Vincent Policy.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
});
```

### Required Property: `packageName`

The `packageName` property is a string that matches the NPM package name your Policy will be published to NPM with. Vincent Tool developers will be installing several Vincent Policies from NPM, so it's important that `packageName` is unique, descriptive, and matches the NPM installable package name so it's easy to identify as a Vincent Tool developer.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',
});
```

### Required Property: `toolParamsSchema`

The `toolParamsSchema` property is a Zod schema that describes the properties your policy accepts as input parameters from the executing Vincent Tool. In the next section we'll cover the `userParamsSchema` which describes the properties that will be retrieved from on-chain that the Vincent App User has configured. The parameters specified by `toolParamsSchema` are generally not static values, or are values that only the Vincent App Delegatee who's executing the Vincent Tool will have when executing the Tool. Part of the magic of `createVincentPolicy` is a wrapper function that will validate the provided parameters from the executing Vincent Tool against the `toolParamsSchema` you've defined, so you don't have to worry about validating these parameters yourself during runtime.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

export const SpendingLimitPolicyToolParamsSchema = z.object({
  appId: z.number(),
  pkpEthAddress: z.string(),
  ethRpcUrl: z.string(),
  rpcUrlForUniswap: z.string(),
  chainIdForUniswap: z.number(),
  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  buyAmount: z.number(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
});
```

The properties in `SpendingLimitPolicyToolParamsSchema` are specific to the Spending Limit Policy, what's defined for `toolParamsSchema` is up to you as the Vincent Policy developer and should be tailored to the needs of the policy you're developing.

Because this Spending Limit Policy is intended to be used by the Vincent Uniswap Swap Tool, we require properties such as `rpcUrlForUniswap` and `chainIdForUniswap` so we can calculate the price of a token in terms of WETH which then allows us to calculate the USD price of `buyAmount` to check and update our Spending Limit policy.

To reiterate, the `SpendingLimitPolicyToolParamsSchema` shown above is a reference implementation for `toolParamsSchema` and none of these properties are required for your custom Vincent Policy. The `toolParamsSchema` you define is completely custom and used to provide your policy with the information it needs to determine whether the Vincent Tool should be permitted to execute.

### Required Property: `userParamsSchema`

The `userParamsSchema` property is a Zod schema that defines the configuration parameters that Vincent App Users can set for your policy. These parameters are stored on-chain in the Vincent registry smart contract and are specific to each Vincent App User's configuration.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const SpendingLimitPolicyToolParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyUserParamsSchema = z.object({
  maxDailySpendAmountUsd: z.number(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,
});
```

The properties in `SpendingLimitPolicyUserParamsSchema` are specific to the Spending Limit Policy, what's defined for `userParamsSchema` is up to you as the Vincent Policy developer and should be tailored to the needs of the policy you're developing and what properties should be configurable by the Vincent App User.

Because this Spending Limit Policy is restricting the amount of USD that can be spent in a day, we require the Vincent App User to specify the `maxDailySpendAmountUsd` on-chain in the Vincent registry smart contract.

To reiterate, the `SpendingLimitPolicyUserParamsSchema` shown above is a reference implementation for `userParamsSchema` and none of these properties are required for your custom Vincent Policy. The `userParamsSchema` you define is completely custom and used to provide your policy with the information it needs to determine whether the Vincent Tool should be permitted to execute.

### Optional Property: Policy Precheck Function

The `precheck` function is a crucial optimization that helps Vincent App Delegatees avoid wasting resources on operations that would ultimately fail due to policy restrictions. For example, if a Spending Limit policy has already reached its daily maximum, there's no point in attempting the transaction.

Key characteristics of the precheck function:

- It must be **non-mutative** - it should only read and validate, never modify state as there's no guarantee the your policy will be executed after the precheck function is called
- It should perform the same validation checks that your policy will perform during execution
- It provides a "best effort" prediction of whether the operation will succeed
- It helps delegatees make informed decisions before committing resources to the operation

The precheck function acts as an early warning system, allowing delegatees to quickly determine if an operation is likely to succeed before investing time and computational resources in the full execution.

Defining a precheck method is **optional**, but highly recommended. If you choose to define one, your policies' `VincentPolicyDef` will need to define a Zod schema for `precheckAllowResultSchema` which describes a successful precheck result, and `precheckDenyResultSchema` which describes a failed precheck result.

#### `precheckAllowResultSchema`

The `precheckAllowResultSchema` is a Zod schema that describes the object that will be returned by the precheck function if it's validation checks pass, and the policy is expected to permit the Vincent Tool to execute.

What's returned by the precheck function for the allow case is up to you as the Vincent Policy developer, but it should contain information that will be useful to the Vincent App Delegatee to determine whether the Vincent Tool should be executed.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const SpendingLimitPolicyToolParamsSchema = z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const spendingLimitPolicyPrecheckAllowResultSchema = z.object({
  appId: z.number(),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: spendingLimitPolicyPrecheckAllowResultSchema,
});
```

For the Spending Limit Policy, `spendingLimitPolicyPrecheckAllowResultSchema` is returning the `appId` as confirmation what the precheck function used to source on-chain policy parameters, the current `maxSpendingLimitInUsd` that was retrieved from the on-chain Vincent registry smart contract, and the `buyAmountInUsd` that was calculated for the `buyAmount` that was provided as input via the `toolParamsSchema`.

#### `precheckDenyResultSchema`

The `precheckDenyResultSchema` is a Zod schema that describes the object that will be returned by the precheck function if it's validation checks fail, and the policy is expected to deny the Vincent Tool from executing.

What's returned by the precheck function for the deny case is up to you as the Vincent Policy developer, but it should contain information that will be useful to the Vincent App Delegatee to determine why the Vincent Tool will be denied from executing.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

const SpendingLimitPolicyToolParamsSchema = z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const spendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({
  reason: z.literal('Attempted buy amount exceeds daily limit'),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: spendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,
});
```

For the Spending Limit Policy, `SpendingLimitPolicyEvalDenyResultSchema` is returning the `reason` as a string that describes why the Vincent Tool will be denied from executing, the current `maxSpendingLimitInUsd` that was retrieved from the on-chain Vincent registry smart contract, and the `buyAmountInUsd` that was calculated for the `buyAmount` that was provided as input via the `toolParamsSchema`.

#### The `precheck` Function

This function **must** be defined inline in the `VincentPolicyDef` object in order for the type inference that `createVincentPolicy` provides to work.

The following is a reference implementation of the `precheck` function for the Spending Limit Policy:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

// Not included in the reference implementation,
// but this is a helper function that checks if the buy amount is allowed based on the spending limit policy
import { checkIfBuyAmountAllowed } from './policy-helpers/check-spending-limit';

const SpendingLimitPolicyToolParamsSchema = z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const spendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: spendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => {
    const {
      pkpEthAddress,
      appId,
      buyAmount,
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenAddress,
      tokenDecimals,
    } = toolParams;
    const { maxDailySpendAmountUsd } = userParams;

    const { buyAmountAllowed, buyAmountInUsd, adjustedMaxDailySpendingLimit } =
      await checkIfBuyAmountAllowed({
        ethRpcUrl,
        rpcUrlForUniswap,
        chainIdForUniswap,
        tokenAddress: tokenAddress as `0x${string}`,
        tokenDecimals,
        buyAmount,
        maxDailySpendAmountUsd,
        pkpEthAddress: pkpEthAddress as `0x${string}`,
        appId,
      });

    return buyAmountAllowed
      ? allow({
          appId,
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        })
      : deny({
          appId,
          reason: 'Attempted buy amount exceeds daily limit',
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        });
  }
});
```

The input parameters to the `precheck` function are magic values that are provided by the `createVincentPolicy` wrapper function. `toolParams` will have the properties defined by `toolParamsSchema` and `userParams` will have the properties defined by `userParamsSchema`.

The `allow` and `deny` parameters are functions that your precheck function will call depending on whether the precheck function's validation checks pass or fail. As shown in the reference implementation, the `allow` function will be called if `buyAmountAllowed` is `true`, and the `deny` function will be called if it's `false`. The structure of the objects passed to `allow` and `deny` are defined by the `precheckAllowResultSchema` and `precheckDenyResultSchema` respectively.
