// src/type-inference-verification/create-vincent-ability.ts

import { z } from 'zod';

import { supportedPoliciesForAbility } from '../lib/abilityCore/helpers';
import { createVincentAbility } from '../lib/abilityCore/vincentAbility';
import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentPolicy, createVincentAbilityPolicy } from '../lib/policyCore/vincentPolicy';

const abilityParams = z.object({
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
  abilityParamsSchema: policySchema,
  evalAllowResultSchema: policyEvalAllow,
  evalDenyResultSchema: policyEvalDeny,
  evaluate: async ({ abilityParams }, context) => {
    return abilityParams.count < 10
      ? context.allow({ ok: true })
      : context.deny({ reason: 'Too high' });
  },
});

const bundled = asBundledVincentPolicy(PolicyConfig, 'QmCID123' as const);

const policy = createVincentAbilityPolicy({
  abilityParamsSchema: abilityParams,
  bundledVincentPolicy: bundled,
  abilityParameterMappings: {
    count: 'count',
  },
});

export const ability = createVincentAbility({
  packageName: 'my-ability@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([policy] as const),

  executeSuccessSchema: z.object({ status: z.string() }),
  executeFailSchema: z.object({ error: z.string() }),

  precheckSuccessSchema: z.object({ passed: z.boolean() }),
  precheckFailSchema: z.object({ failCode: z.literal('POLICY_FAIL') }),

  precheck: async ({ abilityParams }, { policiesContext, succeed, fail }) => {
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

  execute: async ({ abilityParams }, { policiesContext, succeed, fail }) => {
    // const result = policiesContext.allowedPolicies['limit-check'].result;
    //    ^? result: { ok: boolean }

    return succeed({ status: 'executed' });
  },
});
