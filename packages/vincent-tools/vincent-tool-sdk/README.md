# vincent-tool

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build vincent-tool` to build the library.

## Usage

# Vincent Policy & Tool SDK

This library provides a type-safe lifecycle system for defining and composing **policies** and **tools**, with strong TypeScript inference support throughout.

## 🧩 Core Concepts

- **Policies** encapsulate decision logic (precheck, evaluate, commit) and define their input/output schemas.
- **Tools** orchestrate multiple policies and expose `precheck` and `execute` lifecycle methods.
- **Context injection** provides `allow()` / `deny()` and `succeed()` / `fail()` methods, with schema-safe return typing.
- All inference is preserved automatically using `createVincentPolicy`, `createVincentToolPolicy`, and `createVincentTool`.
---
### 🔁 Calling `commit()` on a Policy from within a Tool

Policies can define a `commit()` lifecycle method to finalize changes once a tool executes successfully. These `commit()` functions are injected automatically into the `allowedPolicies` object of the `ToolContext`.

### Example Policy (max daily spend)
```ts
import { z } from 'zod';
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

import {
  getAmountSpentToday,
  adjustDailySpendAmount,
} from '@my-org/spending-limit-client';

export const dailySpendPolicy = createVincentPolicy({
  ipfsCid: 'policy-committable',
  packageName: '@lit-protocol/max-spend-policy',

  toolParamsSchema: z.object({
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

  evaluate: async ({ toolParams, userParams }, context) => {
    const { maxAmountPerDay, perBuyLimit } = userParams;
    const { buyAmount } = toolParams;

    if (buyAmount > perBuyLimit) {
      return context.deny({
        reason: 'Buy amount request exceeds per-buy limit',
        buyAmount,
      });
    }

    const amountSpentToday = await getAmountSpentToday(
      context.delegation.delegator,
    );
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

### Example Tool - Uniswap

```ts
import { z } from 'zod';

import { createVincentToolPolicy, createVincentTool } from '@lit-protocol/vincent-tool-sdk';

import { dailySpendPolicy } from '@lit-protocol/max-spend-policy';

import uniswapV3Client from '@uniswap/v3-sdk';

const toolParamsSchema = z.object({
  buy: z.boolean(),
  buyAmount: z.number(),
});

export const myTokenSwapTool = createVincentTool({
  toolParamsSchema,

  supportedPolicies: [
    createVincentToolPolicy({
      toolParamsSchema,
      policyDef: dailySpendPolicy,
      toolParameterMappings: { buy: 'buyAmount' },
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

  async execute(toolParams, { succeed, fail, policiesContext }) {
    const spendPolicyContext =
      policiesContext.allowedPolicies['@lit-protocol/max-spend-policy'];

    const amountSpent: number = await uniswapV3Client.performSwap({});

    if (spendPolicyContext) {
      const spendCommitResult = await spendPolicyContext.commit({
        amountSpent,
      });

      if (!spendCommitResult.allow) {
        return fail({
          error: `Policy commit denied with code ${spendCommitResult.result.errorCode}`,
          message: 'Tool executed but policy commit denied',
        });
      }

      if (spendCommitResult.allow) {
        return succeed({
          amountSpent,
          spendCommitResult: spendCommitResult.result,
          message: 'Tool executed and spending limit policy commit completed',
        });
      }
    }

    return succeed({
      message: 'Tool executed for user without enabled spending limit',
    });
  },
});

```
---

## 👨‍💻 Consumer Usage (with Inference!)
### Note: These are low-level interfaces that are not typically used by app, tool or policy developers directly. Consumers at this level are our LIT action wrappers and the LitToolClient -- see @lit-protocol/vincent-sdk for the LitToolClient.

Tool and policy authors export their tool and policies like this:

```ts
export const myTool = createVincentTool(...);
export const limitPolicy = createVincentPolicy(...);
```

Then, consumers can use:

```ts
import { myTool } from 'awesome-tool-package';

const typedTool = createVincentTool(myTool.__vincentToolDef);

typedTool.execute(
  { amount: 50, action: 'transfer' },
  {
    delegation: { delegatee: 'a', delegator: 'b' },
    policiesContext: {
      evaluatedPolicies: ['limit-check', 'type-check'],
      allowedPolicies: {
        'limit-check': { result: { approved: true } },
        'type-check': { result: { allowed: true } },
      },
    },
  },
); // ✅ fully typed and schema validated
```
---

## 🔧 Summary of Create Functions

| Function | Purpose |
|---------|---------|
| `createVincentPolicy(def)` | Defines a reusable, type-safe policy with lifecycle methods |
| `createVincentToolPolicy({ policyDef, mappings })` | Adapts a policy to a tool’s parameter schema |
| `createVincentTool(def)` | Composes policies and schemas into a type-safe tool with `execute` and `precheck` |

---

## 🧠 Tip
Tool and policy authors should export the result of `createVincentPolicy` / `createVincentTool()`
