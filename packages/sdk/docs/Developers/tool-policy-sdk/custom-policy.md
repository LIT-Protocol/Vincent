# Developing a Custom Policy

The `createVincentPolicy` function is a helper function that takes several required parameters to produce a strongly typed Policy object that describes properties of the policy such as input parameters and return values. It can be imported from the Vincent Tool and Policy SDK like so:

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

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });

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

### Optional Property: Policy `precheck` Function

The `precheck` function is a crucial optimization that helps Vincent App Delegatees avoid wasting resources on operations that would ultimately fail due to policy restrictions. For example, if a Spending Limit policy has already reached its daily maximum, there's no point in attempting the transaction.

Key characteristics of the `precheck` function:

- It must be **non-mutative** - it should only read and validate, never modify state as there's no guarantee the your policy will be executed after the `precheck` function is called
- It should perform the same validation checks that your policy will perform during execution
- It provides a "best effort" prediction of whether the operation will succeed
- It helps Vincent App Delegatees make informed decisions before committing resources to the operation

Defining a `precheck` method is **optional**, but highly recommended. If you choose to define one, your policy's `VincentPolicyDef` will need to define a Zod schema for `precheckAllowResultSchema` which describes a successful precheck result, and `precheckDenyResultSchema` which describes a failed precheck result.

#### `precheckAllowResultSchema`

The `precheckAllowResultSchema` is a Zod schema that describes the object that will be returned by the `precheck` function if it's validation checks pass, and the policy is expected to permit the Vincent Tool to execute.

What's returned by the `precheck` function for the allow case is up to you as the Vincent Policy developer, but it should contain information that will be useful to the Vincent App Delegatee to determine whether the Vincent Tool should be executed.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyPrecheckAllowResultSchema = z.object({
  appId: z.number(),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: SpendingLimitPolicyPrecheckAllowResultSchema,
});
```

For the Spending Limit Policy, `SpendingLimitPolicyPrecheckAllowResultSchema` is returning the `appId` as confirmation what the `precheck` function used to source on-chain policy parameters, the current `maxSpendingLimitInUsd` that was retrieved from the on-chain Vincent registry smart contract, and the `buyAmountInUsd` that was calculated for the `buyAmount` that was provided as input via the `toolParamsSchema`.

#### `precheckDenyResultSchema`

The `precheckDenyResultSchema` is a Zod schema that describes the object that will be returned by the `precheck` function if it's validation checks fail, and the policy is expected to deny the Vincent Tool from executing.

What's returned by the `precheck` function for the deny case is up to you as the Vincent Policy developer, but it should contain information that will be useful to the Vincent App Delegatee to determine why the Vincent Tool will be denied from executing.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
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

  precheckAllowResultSchema: SpendingLimitPolicyPrecheckAllowResultSchema,
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

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: SpendingLimitPolicyPrecheckAllowResultSchema,
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

The `allow` and `deny` parameters are functions that your `precheck` function will call depending on whether the `precheck` function's validation checks pass or fail. As shown in the reference implementation, the `allow` function will be called if `buyAmountAllowed` is `true`, and the `deny` function will be called if it's `false`. The structure of the objects passed to `allow` and `deny` are defined by the `precheckAllowResultSchema` and `precheckDenyResultSchema` respectively.

### Required Property: Policy `evaluate` Function

The `evaluate` function is the core function that defines the logic for your policy to determine whether the Vincent Tool should be permitted to execute. This function is called during the actual execution of the Vincent Tool, before any of the Tool's logic is executed.

Unlike the `precheck` function, the `evaluate` function is allowed to mutate state, but keep in mind there's no guarantee the Vincent Tool will be executed as Vincent Policies executed after your policy can deny the Tool's execution

Covered in the next section, a `commit` function is available to allow you to define logic that will be executed after all policies permit the Tool's execution, and the Tool was successfully executed.

Defining an `evaluate` function is **required**, and the `evalAllowResultSchema` and `evalDenyResultSchema` are required to be defined in your `VincentPolicyDef` object.

#### `evalAllowResultSchema`

The `evalAllowResultSchema` is a Zod schema that describes the object that will be returned by the `evaluate` function if it's validation checks pass, and the policy permits the Vincent Tool to execute.

What's returned by the `evaluate` function for the allow case is up to you as the Vincent Policy developer, but it should contain information that will be useful to the Vincent App Delegatee or information that a Vincent App may want to display to the Vincent App User.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

// Not included in the reference implementation,
// but this is a helper function that checks if the buy amount is allowed based on the spending limit policy
import { checkIfBuyAmountAllowed } from './policy-helpers/check-spending-limit';

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyEvalAllowResultSchema = z.object({
  appId: z.number(),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: SpendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },
});
```

For the Spending Limit Policy, `SpendingLimitPolicyEvalAllowResultSchema` is returning the same properties as the `SpendingLimitPolicyPrecheckAllowResultSchema`. This is fine if it's also the case for your policy, but there's no requirement that your `precheck` and `evaluate` functions return the same properties for the `allow` case.

#### `evalDenyResultSchema`

The `evalDenyResultSchema` is a Zod schema that describes the object that will be returned by the `evaluate` function if it's validation checks fail, and the policy denies the Vincent Tool from executing.

What's returned by the `evaluate` function for the deny case is up to you as the Vincent Policy developer, but it should contain information that will be useful to the Vincent App Delegatee or information that a Vincent App may want to display to the Vincent App User to explain why the Vincent Tool was denied from executing.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

// Not included in the reference implementation,
// but this is a helper function that checks if the buy amount is allowed based on the spending limit policy
import { checkIfBuyAmountAllowed } from './policy-helpers/check-spending-limit';

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyEvalAllowResultSchema = z.object({ /** ... */ });
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

  precheckAllowResultSchema: SpendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },
});
```

For the Spending Limit Policy, `SpendingLimitPolicyEvalDenyResultSchema` is returning the same properties as the `SpendingLimitPolicyEvalDenyResultSchema`. This is fine if it's also the case for your policy, but there's no requirement that your `precheck` and `evaluate` functions return the same properties for the `deny` case.

#### The `evaluate` Function

This function **must** be defined inline in the `VincentPolicyDef` object in order for the type inference that `createVincentPolicy` provides to work.

The following is a reference implementation of the `evaluate` function for the Spending Limit Policy:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

// Not included in the reference implementation,
// but this is a helper function that checks if the buy amount is allowed based on the spending limit policy
import { checkIfBuyAmountAllowed } from './policy-helpers/check-spending-limit';

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyEvalAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: SpendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },
  
  evaluate: async ({ toolParams, userParams }, { allow, deny }) => {
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
          reason: 'Attempted buy amount exceeds daily limit',
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        });
  }
});
```

Just like the `precheck` function, the input parameters to the `evaluate` function are magic values that are provided by the `createVincentPolicy` wrapper function.

In this reference implementation, the `evaluate` function is the same as the `precheck` function, this is fine if it's also the case for your policy, but there's no requirement that your `precheck` and `evaluate` functions to have the same logic.

### Optional Property: Policy `commit` Function

The `commit` function is an optional function that is called after all policies permit the Tool's execution, and the Tool was successfully executed. This function is designed to give you the opportunity to write any data relevant for your policy do anything else you need to do after the Tool was successfully executed.

The `commit` function is expected to mutate state, but it's not required to do so if your policy doesn't need to. `commit` functions are expected to be executed after a Vincent Tool was successfully executed, but there's no guarantee as other policy's `commit` functions could throw errors that would cause the Tool execution to halt.

Defining a `commit` function is **optional**, and is based on whether your policy needs to do anything after the Vincent Tool was successfully executed. If you choose to define a `commit` function, you are required to define `commitParamsSchema`, `commitAllowResultSchema`, and `commitDenyResultSchema` in your `VincentPolicyDef` object.

#### `commitParamsSchema`

The `commitParamsSchema` property is a Zod schema that describes the properties your policy's `commit` function accepts as input parameters from the executing Vincent Tool.

The parameters that should be provided to your `commit` function are up to you as the Vincent Policy developer, but it should be data the Vincent Tool developer will have access to, and should just be parameters that are required to execute your `commit` function.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

// Not included in the reference implementation,
// but this is a helper function that checks if the buy amount is allowed based on the spending limit policy
import { checkIfBuyAmountAllowed } from './policy-helpers/check-spending-limit';

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyEvalAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyCommitParamsSchema = z.object({
  appId: z.number(),
  amountSpentUsd: z.number(),
  maxSpendingLimitInUsd: z.number(),
  pkpEthAddress: z.string(),
  pkpPubKey: z.string(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: SpendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  commitParamsSchema: SpendingLimitPolicyCommitParamsSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },
  
  evaluate: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },
});
```

For the Spending Limit Policy, `SpendingLimitPolicyCommitParamsSchema` is requiring the properties it needs in order to make a transaction to it's bespoke smart contract to update the amount of USD spent on behalf of the Vincent App User by the App Delegatees in the past day.

#### `commitAllowResultSchema`

The `commitAllowResultSchema` is a Zod schema that describes the object that will be returned by the `commit` function if it executes successfully.

What's returned by the `commit` function for the allow case is up to you as the Vincent Policy developer, but it should contain information that will be useful to the Vincent App Delegatee or information that a Vincent App may want to display to the Vincent App User.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

// Not included in the reference implementation,
// but this is a helper function that checks if the buy amount is allowed based on the spending limit policy
import { checkIfBuyAmountAllowed } from './policy-helpers/check-spending-limit';

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyEvalAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyCommitParamsSchema = z.object({ /** ... */ });
const SpendingLimitPolicyCommitAllowResultSchema = z.object({
  spendTxHash: z.string(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: SpendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  commitParamsSchema: SpendingLimitPolicyCommitParamsSchema,
  commitAllowResultSchema: SpendingLimitPolicyCommitAllowResultSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },
  
  evaluate: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },
});
```

For the Spending Limit Policy, `SpendingLimitPolicyCommitAllowResultSchema` is returning the hash of the transaction that updates the amount of USD spent on behalf of the Vincent App User by the App Delegatees in the past day in it's own bespoke smart contract.

#### `commitDenyResultSchema`

The `commitDenyResultSchema` is a Zod schema that describes the object that will be returned by the `commit` function if it throws an error, or needs sends a "deny" signal to the Tool.

What's returned by the `commit` function for the deny case is up to you as the Vincent Policy developer, but it should contain information that will be useful to the Vincent App Delegatee or information that a Vincent App may want to display to the Vincent App User to explain the error that occurred during the policy's `commit` execution.

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

// Not included in the reference implementation,
// but this is a helper function that checks if the buy amount is allowed based on the spending limit policy
import { checkIfBuyAmountAllowed } from './policy-helpers/check-spending-limit';

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyEvalAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyCommitParamsSchema = z.object({ /** ... */ });
const SpendingLimitPolicyCommitAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyCommitDenyResultSchema = z.object({
  error: z.string(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: SpendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  commitParamsSchema: SpendingLimitPolicyCommitParamsSchema,
  commitAllowResultSchema: SpendingLimitPolicyCommitAllowResultSchema,
  commitDenyResultSchema: SpendingLimitPolicyCommitDenyResultSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },
  
  evaluate: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },
});
```

For the Spending Limit Policy, `SpendingLimitPolicyCommitDenyResultSchema` is returning a `string` that describes the error that occurred during the policy's `commit` execution.

#### The `commit` Function

This function **must** be defined inline in the `VincentPolicyDef` object in order for the type inference that `createVincentPolicy` provides to work.

The following is a reference implementation of the `commit` function for the Spending Limit Policy:

```typescript
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

// Not included in the reference implementation,
// but this is a helper function that checks if the buy amount is allowed based on the spending limit policy
import { checkIfBuyAmountAllowed } from './policy-helpers/check-spending-limit';

// Not included in the reference implementation,
// but this is a helper function that sends a transaction to the spending limit policy's bespoke smart contract
// to update the amount of USD spent on behalf of the Vincent App User by the App Delegatees in the past day
import { sendSpendTx } from './policy-helpers/send-spend-tx';

export const SpendingLimitPolicyToolParamsSchema z.object({ /** ... */ });
const SpendingLimitPolicyUserParamsSchema = z.object({ /** ... */ });

const SpendingLimitPolicyPrecheckAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyEvalAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyEvalDenyResultSchema = z.object({ /** ... */ });

const SpendingLimitPolicyCommitParamsSchema = z.object({ /** ... */ });
const SpendingLimitPolicyCommitAllowResultSchema = z.object({ /** ... */ });
const SpendingLimitPolicyCommitDenyResultSchema = z.object({
  error: z.string(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: SpendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  commitParamsSchema: SpendingLimitPolicyCommitParamsSchema,
  commitAllowResultSchema: SpendingLimitPolicyCommitAllowResultSchema,
  commitDenyResultSchema: SpendingLimitPolicyCommitDenyResultSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },
  
  evaluate: async ({ toolParams, userParams }, { allow, deny }) => { /** ... */ },

  commit: async (params, { allow }) => {
    const { appId, amountSpentUsd, maxSpendingLimitInUsd, pkpEthAddress, pkpPubKey } = params;

    const spendTxHash = await sendSpendTx({
      appId,
      amountSpentUsd,
      maxSpendingLimitInUsd,
      spendingLimitDuration: 86400, // number of seconds in a day
      pkpEthAddress,
      pkpPubKey,
    });

    return allow({
      spendTxHash,
    });
  }
});
```

The input parameters to the `commit` function are magic values that are provided by the `createVincentPolicy` wrapper function. `params` is an object that contains the properties defined in the `commitParamsSchema` property of the `VincentPolicyDef` object.

`allow` and `deny` are functions that are provided by the `createVincentPolicy` wrapper function. `allow` is a function that is called if the `commit` function executes successfully, and `deny` is a function that is called if the `commit` function throws an error, or needs sends a "deny" signal to the Tool.

In the case of the Spending Limit Policy, the `commit` functions doesn't actually make use of the `deny` function as `sendSpendTx` will throw an error if anything fails, and this error will be caught the the `createVincentPolicy` wrapper function and formatted automatically.

You would still call the `deny` function if you wanted to add additional context to an error message, or if you needed to send a "deny" signal to the Tool because something is wrong that didn't cause an error to be thrown (e.g. some application state isn't what it should be).

The Spending Limit Policy's `commit` function is using the `sendSpendTx` helper function to send a transaction to the spending limit policy's bespoke smart contract to update the amount of USD spent on behalf of the Vincent App User by the App Delegatees in the past day.

## Wrapping Up Your Custom Policy

Now that you have your `VincentPolicyDef` object, the next step is to wrap the object using the `vincentPolicyHandler` function. This helper function wraps your `VincentPolicyDef` object in a function that can be used to execute the policy, providing it the magic values, and handling the formatting of any thrown errors.

Because Vincent Policies are executed as Lit Protocol [Lit Actions](https://developer.litprotocol.com/sdk/serverless-signing/overview), you'll need to define your wrapped `VincentPolicyDef` in a separate file that will be bundled and compiled into a _Immediately Invoked Function Expression (IIFE)_, so that it can be uploaded to IPFS and used by the Lit Protocol network as a Lit Action.

For the Spending Limit Policy, a new file called `vincent-policy-wrapped.ts` is created:

```typescript
import { vincentPolicyHandler } from '@lit-protocol/vincent-tool-sdk';

// This is the VincentPolicyDef and the toolParamsSchema we've been defining above
import { SpendingLimitPolicyDef, SpendingLimitPolicyToolParamsSchema } from './vincent-policy';

declare const userPkpTokenId: string;
declare const toolParams: typeof SpendingLimitPolicyToolParamsSchema;

(async () =>
  vincentPolicyHandler({
    vincentPolicyDef: SpendingLimitPolicyDef,
    context: { userPkpTokenId },
    toolParams,
  }))();
```
