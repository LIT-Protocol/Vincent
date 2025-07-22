// src/type-inference-verification/create-vincent-tool.ts

import { z } from 'zod';

import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentPolicy, createVincentToolPolicy } from '../lib/policyCore/vincentPolicy';
import { supportedPoliciesForTool } from '../lib/toolCore/helpers';
import { createVincentTool } from '../lib/toolCore/vincentTool';

const toolParams = z.object({
  action: z.string(),
  count: z.number(),
});

// === Define a policy ===
const policySchema = z.object({
  count: z.number(),
});

const policyEvalAllow = z.object({ ok: z.boolean() });
const policyEvalDeny = z.object({ reason: z.string() });

const PolicyConfig = createVincentPolicy({
  packageName: 'limit-check' as const,
  toolParamsSchema: policySchema,
  evalAllowResultSchema: policyEvalAllow,
  evalDenyResultSchema: policyEvalDeny,
  evaluate: async ({ toolParams }, context) => {
    return toolParams.count < 10
      ? context.allow({ ok: true })
      : context.deny({ reason: 'Too high' });
  },
});

const bundled = asBundledVincentPolicy(PolicyConfig, 'QmCID123' as const);

const policy = createVincentToolPolicy({
  toolParamsSchema: toolParams,
  bundledVincentPolicy: bundled,
  toolParameterMappings: {
    count: 'count',
  },
});

export const tool = createVincentTool({
  packageName: 'my-tool@1.0.0',
  toolDescription: 'Yes Tool',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([policy] as const),

  executeSuccessSchema: z.object({ status: z.string() }),
  executeFailSchema: z.object({ error: z.string() }),

  precheckSuccessSchema: z.object({ passed: z.boolean() }),
  precheckFailSchema: z.object({ failCode: z.literal('POLICY_FAIL') }),

  precheck: async ({ toolParams }, { policiesContext, succeed, fail }) => {
    // ✅ Check context access
    if (policiesContext.allowedPolicies?.['limit-check']) {
      console.log('Policy check succeeded');
      const result = policiesContext.allowedPolicies['limit-check'].result;
      console.log(result);
    }
    //    ^? result: { ok: boolean }

    // ❌ Invalid key — should error
    // @ts-expect-error unknown policy name
    const wat = policiesContext.allowedPolicies['not-real'];

    console.log(wat);

    return policiesContext.allow ? succeed({ passed: true }) : fail({ failCode: 'POLICY_FAIL' });
  },

  execute: async ({ toolParams }, { policiesContext, succeed, fail }) => {
    // const result = policiesContext.allowedPolicies['limit-check'].result;
    //    ^? result: { ok: boolean }

    return succeed({ status: 'executed' });
  },
});
