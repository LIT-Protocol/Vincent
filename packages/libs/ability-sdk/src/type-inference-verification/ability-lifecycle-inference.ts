// src/type-inference-verification/ability-lifecycle-inference.ts

import { z } from 'zod';

import { supportedPoliciesForAbility } from '../lib/abilityCore/helpers';
import { createVincentAbility } from '../lib/abilityCore/vincentAbility';
import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createAllowResult } from '../lib/policyCore/helpers/resultCreators';
import { createVincentPolicy, createVincentAbilityPolicy } from '../lib/policyCore/vincentPolicy';

const abilityParamsSchema = z.object({
  flag: z.boolean(),
  value: z.number(),
});

const aVincentPolicy = createVincentPolicy({
  packageName: 'a' as const,
  abilityParamsSchema: z.object({ foo: z.string() }),
  evalAllowResultSchema: z.object({ approved: z.boolean() }),
  commit: async (_, ctx) => ctx.allow(),
  evaluate: async (_, ctx) => ctx.allow({ approved: true }),
});

const policyA = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy: asBundledVincentPolicy(aVincentPolicy, 'cid-a' as const),
  abilityParameterMappings: {
    flag: 'foo',
  },
});

const bVincentPolicy = createVincentPolicy({
  packageName: 'b' as const,
  abilityParamsSchema: z.object({ bar: z.number() }),
  evalAllowResultSchema: z.string(),
  evaluate: async (_, ctx) => ctx.allow('hello'),
});

const policyB = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy: asBundledVincentPolicy(bVincentPolicy, 'cid-b' as const),
  abilityParameterMappings: {
    value: 'bar',
  },
});

const ability = createVincentAbility({
  packageName: '@lit-protocol/yesability3@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([policyA, policyB] as const),
  execute: async ({ abilityParams }, { policiesContext, succeed, fail }) => {
    // Type inference for allowedPolicies
    const a = policiesContext.allowedPolicies['a'];
    const b = policiesContext.allowedPolicies.b;

    // ✅ Expect result to be { approved: boolean }
    if (a) {
      console.log(a.result.approved);

      // ✅ Should compile - commit exists on 'a'
      if (a.commit) {
        const res = await a.commit();

        const wat: boolean = res.allow;
        console.log(wat);

        if (res.allow) {
          // @ts-expect-error - 'success' doesn't exist because no commit result schema
          console.log(res.result.success);
        }
      }
    }

    if (b) {
      // @ts-expect-error - 'approved' doesn't exist on string
      console.log(b.result.approved);

      // ✅ Expect result to be string
      const s: string = b.result;
      console.log(s);

      fail();

      // b.commit();
    }

    return succeed();
  },
  executeSuccessSchema: z.undefined(),
  executeFailSchema: z.undefined(),
});

export async function run() {
  await ability.execute(
    {
      abilityParams: {
        flag: true,
        value: 123,
      },
    },
    {
      delegation: {
        delegatorPkpInfo: {
          tokenId: '90128301832',
          ethAddress: '0x102398103981032',
          publicKey: '0398103810938ef987ef978fe987ef',
        },
        delegateeAddress: 'y',
      },
      policiesContext: {
        evaluatedPolicies: ['a', 'b'],
        allowedPolicies: {
          a: {
            result: { approved: true },
            commit: async () => createAllowResult({ result: undefined }),
          },
          // @ts-expect-error - commit is inferred as `never` and omitted on purpose
          b: {
            result: 'hello',
          },
        },
      },
    },
  );
}
