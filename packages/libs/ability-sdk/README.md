# ability-sdk

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build ability-sdk` to build the library.

## Usage

# Vincent Policy & Ability SDK

This library provides a type-safe lifecycle system for defining and composing **policies** and **abilities**, with strong TypeScript inference support throughout.

## Core Concepts

- **Policies** encapsulate decision logic (precheck, evaluate, commit) and define their input/output schemas.
- **Abilities** orchestrate multiple policies and expose `precheck` and `execute` lifecycle methods.
- **Context injection** provides `allow()` / `deny()` and `succeed()` / `fail()` methods, with schema-safe return typing.
- All inference is preserved automatically using `createVincentPolicy`, `createVincentAbilityPolicy`, and `createVincentAbility`.

---

### Calling `commit()` on a Policy from within a Ability

Policies can define a `commit()` lifecycle method to finalize changes once an ability executes successfully. These `commit()` functions are injected automatically into the `allowedPolicies` object of the `AbilityContext`.

### Example Policy (max daily spend)

```ts
import { z } from 'zod';
import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';

import { getAmountSpentToday, adjustDailySpendAmount } from '@my-org/spending-limit-client';

export const dailySpendPolicy = createVincentPolicy({
  ipfsCid: 'policy-committable',
  packageName: '@lit-protocol/max-spend-policy',

  abilityParamsSchema: z.object({
    buySomething: z.boolean(),
    buyAmount: z.number(),
  }),
  userParamsSchema: z.object({
    perBuyLimit: z.number(),
    maxAmountPerDay: z.number(),
  }),

  evalAllowResultSchema: z.object({
    ok: z.boolean(),
    amountRemaining: z.number(),
    amountToSpend: z.number(),
  }),
  evalDenyResultSchema: z.union([
    z.object({
      reason: z.literal('Buy amount request exceeds per-buy limit'),
      buyAmount: z.number(),
    }),
    z.object({
      reason: z.enum(['Buy amount request exceeds max amount per day']),
      buyAmount: z.number(),
      amountSpentToday: z.number(),
      amountRemaining: z.number(),
    }),
  ]),

  commitParamsSchema: z.object({ amountSpent: z.number() }),
  commitAllowResultSchema: z.object({
    transactionId: z.string(),
    timestamp: z.number(),
  }),
  commitDenyResultSchema: z.object({
    errorCode: z.number().optional(),
    message: z.string(),
  }),

  evaluate: async ({ abilityParams, userParams }, context) => {
    const { maxAmountPerDay, perBuyLimit } = userParams;
    const { buyAmount } = abilityParams;

    if (buyAmount > perBuyLimit) {
      return context.deny({
        reason: 'Buy amount request exceeds per-buy limit',
        buyAmount,
      });
    }

    const amountSpentToday = await getAmountSpentToday(context.delegation.delegator);
    const amountRemaining = maxAmountPerDay - amountSpentToday;

    if (buyAmount > amountRemaining) {
      return context.deny({
        reason: 'Buy amount request exceeds max amount per day',
        amountSpentToday,
        buyAmount,
        amountRemaining,
      });
    }

    return context.allow({
      ok: true,
      amountRemaining,
      amountToSpend: buyAmount,
    });
  },

  commit: async ({ amountSpent }, context) => {
    try {
      const spendCommitResult: { transactionId: string; timestamp: number } =
        await adjustDailySpendAmount(context.delegation.delegator, amountSpent);

      return context.allow(spendCommitResult);
    } catch (e: unknown) {
      if (e instanceof Error) {
        if ('errorCode' in e) {
          return context.deny({
            errorCode: e.errorCode as number,
            message: e.message,
          });
        } else {
          return context.deny({ message: e.message });
        }
      }

      return context.deny({ message: String(e) });
    }
  },
});
```

---

### Example Ability - Uniswap

```ts
import { z } from 'zod';

import {
  createVincentAbilityPolicy,
  createVincentAbility,
} from '@lit-protocol/vincent-ability-sdk';

import { dailySpendPolicy } from '@lit-protocol/max-spend-policy';

import uniswapV3Client from '@uniswap/v3-sdk';

const abilityParamsSchema = z.object({
  buy: z.boolean(),
  buyAmount: z.number(),
});

export const myTokenSwapAbility = createVincentAbility({
  packageName: 'tokenswapability',
  abilityDescription: 'Token Swap Ability',

  abilityParamsSchema,

  supportedPolicies: [
    createVincentAbilityPolicy({
      abilityParamsSchema,
      PolicyConfig: dailySpendPolicy,
      abilityParameterMappings: { buy: 'buyAmount' },
    }),
  ],
  executeSuccessSchema: z.object({
    message: z.string(),
    amountSpent: z.number().optional(),
    spendCommitResult: z
      .object({
        transactionId: z.string(),
        timestamp: z.number(),
      })
      .optional(),
  }),

  executeFailSchema: z.object({ error: z.string(), message: z.string() }),

  async execute(abilityParams, { succeed, fail, policiesContext }) {
    const spendPolicyContext = policiesContext.allowedPolicies['@lit-protocol/max-spend-policy'];

    const amountSpent: number = await uniswapV3Client.performSwap({});

    if (spendPolicyContext) {
      const spendCommitResult = await spendPolicyContext.commit({
        amountSpent,
      });

      if (!spendCommitResult.allow) {
        return fail({
          error: `Policy commit denied with code ${spendCommitResult.result.errorCode}`,
          message: 'Ability executed but policy commit denied',
        });
      }

      if (spendCommitResult.allow) {
        return succeed({
          amountSpent,
          spendCommitResult: spendCommitResult.result,
          message: 'Ability executed and spending limit policy commit completed',
        });
      }
    }

    return succeed({
      message: 'Ability executed for user without enabled spending limit',
    });
  },
});
```

---

### Gated Signer Ability

A **Gated Signer Ability** is a specialized ability designed to validate and sign EOA transactions or AA user operations. It enforces a strict validation lifecycle before using the delegated PKP to sign the request.

#### Lifecycle

1. **Decode**: The ability decodes the transaction data using the provided `decodeTransaction` function.
2. **Simulation**: The ability simulates the transaction/userOperation on-chain to determine asset changes.
3. **Validate Simulation**: The `validateSimulation` function checks if the simulation results are acceptable (e.g., no unexpected asset transfers).
4. **Validate Transaction**: The `validateTransaction` function inspects the decoded transaction to ensure it complies with security policies (e.g., allowed contracts, methods, arguments).
5. **Sign**: If all validations pass, the ability signs the transaction or userOperation using the PKP.

#### Creating a Gated Signer Ability

You can create a Gated Signer Ability using `createVincentGatedSignerAbility`:

```ts
import { createVincentGatedSignerAbility } from '@lit-protocol/vincent-ability-sdk/gatedSigner';

import { decodeTransaction } from './decodeTransaction';
import { validateSimulation } from './validateSimulation';
import { validateTransaction } from './validateTransaction';

export const myGatedSignerAbility = createVincentGatedSignerAbility({
  packageName: '@my-org/my-gated-signer',
  abilityDescription: 'Safely signs transactions for My Protocol',

  // Lifecycle functions
  decodeTransaction,
  validateSimulation,
  validateTransaction,
});
```

The lifecycle functions must implement the `LifecycleFunctionSteps` interface:

```ts
interface LifecycleFunctionSteps {
  decodeTransaction: (params: DecodeTransactionParams) => DecodedTransaction;
  validateSimulation: (params: ValidateSimulationParams) => void;
  validateTransaction: (params: ValidateTransactionParams) => void;
}
```

This abstraction simplifies the creation of abilities that act as secure signers, ensuring consistent validation logic across different implementations.

## Tip

Ability and policy authors should export the result of `createVincentPolicy()` / `createVincentAbility()` / `createVincentGatedSignerAbility()`
