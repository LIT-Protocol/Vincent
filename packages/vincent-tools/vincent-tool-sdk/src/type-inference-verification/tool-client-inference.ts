import { z } from 'zod';
import { createVincentTool } from '../lib/toolCore/vincentTool';
import { createVincentPolicy, createVincentToolPolicy } from '../lib/policyCore/vincentPolicy';
import { createVincentToolClient } from '../lib/toolClient/vincentToolClient';
import { createPolicyMapFromToolPolicies } from '../lib/toolCore/helpers/createPolicyMapFromToolPolicies';
import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';

const currencyPolicy = createVincentPolicy({
  packageName: 'currency-policy',
  toolParamsSchema: z.object({ currency: z.string() }),
  evaluate: async ({ toolParams }, ctx) => ctx.allow({ approvedCurrency: toolParams.currency }),
  evalAllowResultSchema: z.object({ approvedCurrency: z.string() }),
});

const currencyToolPolicy = createVincentToolPolicy({
  toolParamsSchema: z.object({
    currency: z.string(),
  }),
  bundledVincentPolicy: asBundledVincentPolicy(currencyPolicy, 'QmCurrency123' as const),
  toolParameterMappings: {
    currency: 'currency',
  },
});

const rateLimitPolicy = createVincentPolicy({
  packageName: 'rate-limit',
  toolParamsSchema: z.object({ userId: z.string() }),
  evaluate: async (_, ctx) => ctx.allow({ allowed: true }),
  evalAllowResultSchema: z.object({ allowed: z.literal(true) }),
  commit: async (_, ctx) => ctx.allow({ committed: true }),
  commitAllowResultSchema: z.object({ committed: z.boolean() }),
});

const rateLimitToolPolicy = createVincentToolPolicy({
  toolParamsSchema: z.object({
    userId: z.string(),
  }),
  bundledVincentPolicy: asBundledVincentPolicy(rateLimitPolicy, 'QmRateLimit123' as const),
  toolParameterMappings: {
    userId: 'userId',
  },
});

const toolParamsSchema = z.object({
  currency: z.string(),
  userId: z.string(),
});

const tool = createVincentTool({
  toolParamsSchema,
  policyMap: createPolicyMapFromToolPolicies([currencyToolPolicy, rateLimitToolPolicy]),
  execute: async ({ toolParams }, ctx) => ctx.succeed({ ok: true }),
  executeSuccessSchema: z.object({ ok: z.literal(true) }),
});

const client = createVincentToolClient({
  vincentTool: tool,
  ethersSigner: {} as any, // stubbed
});

export async function run() {
  const toolParams = {
    currency: 'USD',
    userId: 'user-123',
  } as const;

  const precheckResult = await client.precheck(toolParams, {
    delegator: '0xabc',
    toolIpfsCid: 'QmFakeTool123',
  });

  if (precheckResult.success === true) {
    // ✅ Inferred success result shape
    const successResult = precheckResult.result;

    // Should be ok to access successResult with correct type
    if (successResult !== undefined) {
      // @ts-expect-error - no properties defined on undefined schema
      console.log(successResult.foo);
    }

    const policiesContext = precheckResult.policiesContext;

    if (policiesContext && policiesContext.allow) {
      const p = policiesContext.allowedPolicies;

      // ✅ Should infer currency-policy result shape
      if (p['currency-policy']) {
        p['currency-policy'].result.approvedCurrency.toUpperCase();
        // @ts-expect-error - no commit on currency-policy
        p['currency-policy'].commit();
      }

      // ✅ Should infer rate-limit result shape and commit
      if (p['rate-limit']) {
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
    precheckResult.error?.toUpperCase();

    // Should still be optional policiesContext
    const deniedPolicy = precheckResult.policiesContext?.deniedPolicy;
    if (deniedPolicy) {
      console.log(deniedPolicy.result);
    }
  }

  // 🧪 Now check execute inference
  const executeResult = await client.execute(toolParams, {
    delegation: {
      delegatee: '0xabc',
      delegator: '0xdef',
    },
    // toolIpfsCid: 'QmFakeTool123',
  });

  if (executeResult.success === true) {
    if (executeResult.result) {
      const val: { ok: true } = executeResult.result;

      // @ts-expect-error - invalid field on success result
      console.log(val.failureReason);

      const result = executeResult.policiesContext?.allowedPolicies;
      if (result) {
        const currencyPolicyResult = result['currency-policy'];
        if (currencyPolicyResult) {
          console.log(currencyPolicyResult.result.approvedCurrency);
        }
      }
    }
  } else {
    console.log(executeResult.policiesContext?.deniedPolicy?.result);
  }
}

const fullSchemaPolicy = createVincentPolicy({
  packageName: 'full-policy',
  toolParamsSchema: z.object({ count: z.number() }),
  evaluate: async ({ toolParams }, ctx) => {
    if (toolParams.count > 0) {
      return ctx.allow({ result: 'ok' });
    } else {
      return ctx.deny({ reason: 'must be > 0' });
    }
  },
  evalAllowResultSchema: z.object({ result: z.literal('ok') }),
  evalDenyResultSchema: z.object({ reason: z.string() }),
});

const fullSchemaToolPolicy = createVincentToolPolicy({
  toolParamsSchema: z.object({ count: z.number() }),
  bundledVincentPolicy: asBundledVincentPolicy(fullSchemaPolicy, 'QmFullSchema123' as const),
  toolParameterMappings: {
    count: 'count',
  },
});

const fullTool = createVincentTool({
  toolParamsSchema: z.object({ count: z.number() }),
  policyMap: createPolicyMapFromToolPolicies([fullSchemaToolPolicy]),
  precheck: async ({ toolParams }, ctx) => {
    if (toolParams.count > 10) {
      return ctx.succeed({ accepted: true });
    } else {
      return ctx.fail({ reason: 'too small' });
    }
  },
  precheckSuccessSchema: z.object({ accepted: z.literal(true) }),
  precheckFailSchema: z.object({ reason: z.string() }),
  execute: async ({ toolParams }, ctx) => {
    if (toolParams.count < 100) {
      return ctx.succeed({ ok: true });
    } else {
      return ctx.fail({ reason: 'too big' });
    }
  },
  executeSuccessSchema: z.object({ ok: z.literal(true) }),
  executeFailSchema: z.object({ reason: z.string() }),
});

const fullClient = createVincentToolClient({
  vincentTool: fullTool,
  ethersSigner: {} as any,
});

const fullParams = { count: 5 };

export async function gogo() {
  const precheck = await fullClient.precheck(fullParams, {
    delegator: '0xabc',
    toolIpfsCid: 'QmFullSchema123',
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
    delegation: {
      delegatee: '0xabc',
      delegator: '0xdef',
    },
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
