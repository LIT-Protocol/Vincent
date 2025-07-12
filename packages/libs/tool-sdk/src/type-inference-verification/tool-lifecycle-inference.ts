// src/type-inference-verification/tool-lifecycle-inference.ts

import { z } from 'zod';
import { createVincentPolicy, createVincentToolPolicy } from '../lib/policyCore/vincentPolicy';
import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentTool } from '../lib/toolCore/vincentTool';
import { supportedPoliciesForTool } from '../lib/toolCore/helpers';
import { createAllowResult } from '../lib/policyCore/helpers/resultCreators';

const toolParamsSchema = z.object({
  flag: z.boolean(),
  value: z.number(),
});

const aVincentPolicy = createVincentPolicy({
  packageName: 'a' as const,
  toolParamsSchema: z.object({ foo: z.string() }),
  evalAllowResultSchema: z.object({ approved: z.boolean() }),
  commit: async (_, ctx) => ctx.allow(),
  evaluate: async (_, ctx) => ctx.allow({ approved: true }),
});

const policyA = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy: asBundledVincentPolicy(aVincentPolicy, 'cid-a' as const),
  toolParameterMappings: {
    flag: 'foo',
  },
});

const bVincentPolicy = createVincentPolicy({
  packageName: 'b' as const,
  toolParamsSchema: z.object({ bar: z.number() }),
  evalAllowResultSchema: z.string(),
  evaluate: async (_, ctx) => ctx.allow('hello'),
});

const policyB = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy: asBundledVincentPolicy(bVincentPolicy, 'cid-b' as const),
  toolParameterMappings: {
    value: 'bar',
  },
});

const tool = createVincentTool({
  packageName: '@lit-protocol/yestool3@1.0.0',
  toolDescription: 'Yes Tool',
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([policyA, policyB] as const),
  execute: async ({ toolParams }, { policiesContext, succeed, fail }) => {
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
  await tool.execute(
    {
      toolParams: {
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
