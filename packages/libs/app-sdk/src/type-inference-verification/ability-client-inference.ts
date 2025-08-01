import { z } from 'zod';

import {
  createVincentAbility,
  createVincentPolicy,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
  asBundledVincentPolicy,
  asBundledVincentAbility,
} from '@lit-protocol/vincent-ability-sdk';

import { getVincentAbilityClient } from '../abilityClient/vincentAbilityClient';

const currencyPolicy = createVincentPolicy({
  packageName: 'currency-policy',
  abilityParamsSchema: z.object({ currency: z.string() }),
  evaluate: async ({ abilityParams }, ctx) =>
    ctx.allow({ approvedCurrency: abilityParams.currency }),
  evalAllowResultSchema: z.object({ approvedCurrency: z.string() }),
  evalDenyResultSchema: z.object({ borked: z.string() }),
});

const currencyAbilityPolicy = createVincentAbilityPolicy({
  abilityParamsSchema: z.object({
    currency: z.string(),
  }),
  bundledVincentPolicy: asBundledVincentPolicy(currencyPolicy, 'QmCurrency123' as const),
  abilityParameterMappings: {
    currency: 'currency',
  },
});

const rateLimitPolicy = createVincentPolicy({
  packageName: 'rate-limit',
  abilityParamsSchema: z.object({ userId: z.string() }),
  evaluate: async (_, ctx) => ctx.allow({ allowed: true }),
  evalAllowResultSchema: z.object({ allowed: z.literal(true) }),
  commit: async (_, ctx) => ctx.allow({ committed: true }),
  commitAllowResultSchema: z.object({ committed: z.boolean() }),
});

const rateLimitAbilityPolicy = createVincentAbilityPolicy({
  abilityParamsSchema: z.object({
    userId: z.string(),
  }),
  bundledVincentPolicy: asBundledVincentPolicy(rateLimitPolicy, 'QmRateLimit123' as const),
  abilityParameterMappings: {
    userId: 'userId',
  },
});

const abilityParamsSchema = z.object({
  currency: z.string(),
  userId: z.string(),
});

const ability = createVincentAbility({
  packageName: '@lit-protocol/ability3@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([currencyAbilityPolicy, rateLimitAbilityPolicy]),
  execute: async ({ abilityParams }, ctx) => ctx.succeed({ ok: true }),
  executeSuccessSchema: z.object({ ok: z.literal(true) }),
});

const client = getVincentAbilityClient({
  bundledVincentAbility: asBundledVincentAbility(ability, 'QmFakeAbility123' as const),
  ethersSigner: {} as any, // stubbed
});

export async function run() {
  const abilityParams = {
    currency: 'USD',
    userId: 'user-123',
  } as const;

  const precheckResult = await client.precheck(abilityParams, {
    delegatorPkpEthAddress: '0xabc',
  });

  if (precheckResult.success === true) {
    // ✅ Inferred success result shape
    const successResult = precheckResult.result;

    // Should be ok to access successResult with correct type
    if (successResult !== undefined) {
      // @ts-expect-error - no properties defined on undefined schema
      console.log(successResult.foo);
    }

    const policiesContext = precheckResult?.context?.policiesContext;

    if (precheckResult && policiesContext && policiesContext.allow) {
      const p = policiesContext.allowedPolicies;

      // ✅ Should infer currency-policy result shape
      if (p['currency-policy']) {
        // @ts-expect-error There is no precheck result schema; result must be undefined
        p['currency-policy'].result.approvedCurrency.toUpperCase();

        // @ts-expect-error - no commit on currency-policy
        p['currency-policy'].commit();
      }

      // ✅ Should infer rate-limit result shape and commit
      if (p['rate-limit']) {
        // @ts-expect-error There is no precheck result schema; result must be undefined
        const val: true = p['rate-limit'].result.allowed;
        console.log(val);
      }

      // @ts-expect-error - policy not in map
      console.log(p['non-existent-policy']);
    }
  } else {
    // ✅ Inferred failure shape
    const fail = precheckResult.result;

    // @ts-expect-error - fail is z.undefined(), cannot have properties
    console.log(fail.reason);

    // Can still access error message
    precheckResult.runtimeError?.toUpperCase();

    // Should still be optional policiesContext
    const deniedPolicy = precheckResult.context?.policiesContext?.deniedPolicy;
    if (deniedPolicy) {
      if (
        deniedPolicy.packageName === 'currency-policy' &&
        deniedPolicy.result &&
        // @ts-expect-error There's no precheck deny schema!
        deniedPolicy.result.borked
      ) {
        // @ts-expect-error There's no precheck deny schema!
        console.log(deniedPolicy.result.borked);
      }
      console.log(deniedPolicy.result);
    }
  }

  // 🧪 Now check execute inference
  const executeResult = await client.execute(abilityParams, {
    delegatorPkpEthAddress: '0x09182301238',
  });

  if (executeResult.success === true) {
    if (executeResult.result) {
      const val: { ok: true } = executeResult.result;

      // @ts-expect-error - invalid field on success result
      console.log(val.failureReason);

      const result = executeResult.context?.policiesContext?.allowedPolicies;
      if (result) {
        const currencyPolicyResult = result['currency-policy'];
        if (currencyPolicyResult) {
          console.log(currencyPolicyResult.result.approvedCurrency);
        }
      }
    }
  } else {
    console.log(executeResult.context?.policiesContext?.deniedPolicy?.result);
  }
}

const fullSchemaPolicy = createVincentPolicy({
  packageName: 'full-policy',
  abilityParamsSchema: z.object({ count: z.number() }),
  evaluate: async ({ abilityParams }, ctx) => {
    if (abilityParams.count > 0) {
      return ctx.allow({ result: 'ok' });
    } else {
      return ctx.deny({ reason: 'must be > 0' });
    }
  },
  evalAllowResultSchema: z.object({ result: z.literal('ok') }),
  evalDenyResultSchema: z.object({ reason: z.string() }),
});

const fullSchemaAbilityPolicy = createVincentAbilityPolicy({
  abilityParamsSchema: z.object({ count: z.number() }),
  bundledVincentPolicy: asBundledVincentPolicy(fullSchemaPolicy, 'QmFullSchema123' as const),
  abilityParameterMappings: {
    count: 'count',
  },
});

const fullAbility = createVincentAbility({
  packageName: '@lit-protocol/ability3@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema: z.object({ count: z.number() }),
  supportedPolicies: supportedPoliciesForAbility([fullSchemaAbilityPolicy]),
  precheck: async ({ abilityParams }, ctx) => {
    if (abilityParams.count > 10) {
      return ctx.succeed({ accepted: true });
    } else {
      return ctx.fail({ reason: 'too small' });
    }
  },
  precheckSuccessSchema: z.object({ accepted: z.literal(true) }),
  precheckFailSchema: z.object({ reason: z.string() }),
  execute: async ({ abilityParams }, ctx) => {
    if (abilityParams.count < 100) {
      return ctx.succeed({ ok: true });
    } else {
      return ctx.fail({ reason: 'too big' });
    }
  },
  executeSuccessSchema: z.object({ ok: z.literal(true) }),
  executeFailSchema: z.object({ reason: z.string() }),
});

const fullClient = getVincentAbilityClient({
  bundledVincentAbility: asBundledVincentAbility(fullAbility, 'QmFullAbility123' as const),
  ethersSigner: {} as any,
});

const fullParams = { count: 5 };

export async function gogo() {
  const precheck = await fullClient.precheck(fullParams, {
    delegatorPkpEthAddress: '0x1sfskjdfhf',
  });

  if (precheck.success === true) {
    const ok = precheck.result.accepted;
    console.log(ok);

    // @ts-expect-error foo not valid on precheck result
    console.log(precheck.result.foo);
  } else {
    const reason = precheck.result.reason;
    console.log(reason);
    // @ts-expect-error accepted not valid on failure!
    console.log(precheck.result.accepted);
  }

  const execute = await fullClient.execute(fullParams, {
    delegatorPkpEthAddress: '0x098479847928734',
  });

  if (execute.success === true) {
    const val: true = execute.result.ok;
    console.log(val);
    // @ts-expect-error reason not valid on success result
    console.log(execute.result.reason);
  } else {
    const msg: string = execute.result.reason;
    console.log(msg);
    // @ts-expect-error OK not valid on failure result
    console.log(execute.result.ok);
  }
}
