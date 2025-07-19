// src/type-inference-verification/tool-lifecycle-succeed-fail-tests.ts
import { z } from 'zod';

import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentPolicy, createVincentToolPolicy } from '../lib/policyCore/vincentPolicy';
import { supportedPoliciesForTool } from '../lib/toolCore/helpers';
import { createVincentTool } from '../lib/toolCore/vincentTool';

const toolParams = z.object({ x: z.string() });
const dummyPolicy = createVincentToolPolicy({
  toolParamsSchema: toolParams,
  bundledVincentPolicy: asBundledVincentPolicy(
    createVincentPolicy({
      toolParamsSchema: z.object({ foo: z.string() }),
      evalAllowResultSchema: z.string(),
      evaluate: async (_, ctx) => ctx.allow('ok'),
    }),
    {
      ipfsCid: 'cid-test' as const,
      packageName: 'test' as const,
    },
  ),
  toolParameterMappings: { x: 'foo' },
});

const S = z.object({ ok: z.boolean() });
const F = z.object({ err: z.string() });

export const tool_s_p = createVincentTool({
  toolDescription: 'Yes Tool',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([dummyPolicy]),
  executeSuccessSchema: S,
  precheckSuccessSchema: S,
  execute: async (_, { succeed, fail }) => {
    // @ts-expect-error - succeed requires argument matching success schema
    succeed();
    succeed({ ok: true });
    fail();
    // @ts-expect-error - fail should not take object when no fail schema
    fail({ err: 'fail' });
    return succeed({ ok: true });
  },
  precheck: async (_, { succeed, fail }) => {
    // @ts-expect-error - succeed requires argument matching success schema
    succeed();
    succeed({ ok: true });
    fail();
    // @ts-expect-error - fail should not take object when no fail schema
    fail({ err: 'fail' });
    return succeed({ ok: true });
  },
});

export const tool_s_none = createVincentTool({
  toolDescription: 'Yes Tool',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([dummyPolicy]),
  executeSuccessSchema: S,
  execute: async (_, { succeed, fail }) => {
    // @ts-expect-error - succeed requires argument matching success schema
    succeed();
    succeed({ ok: true });
    fail();
    // @ts-expect-error - fail should not take object when no fail schema
    fail({ err: 'fail' });
    return succeed({ ok: true });
  },
  precheck: async (_, { succeed, fail }) => {
    succeed();
    // @ts-expect-error - succeed should not take argument without schema
    succeed({ ok: true });
    fail();
    // @ts-expect-error - fail should not take object when no fail schema
    fail({ err: 'fail' });
    return succeed();
  },
});

export const tool_f_pf = createVincentTool({
  toolDescription: 'Yes Tool',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([dummyPolicy]),
  executeFailSchema: F,
  precheckFailSchema: F,
  execute: async (_, { succeed, fail }) => {
    succeed();
    // @ts-expect-error - succeed should not take argument without schema
    succeed({ ok: true });
    // @ts-expect-error - fail requires argument matching fail schema
    fail();
    return fail({ err: 'fail' });
  },
  precheck: async (_, { succeed, fail }) => {
    succeed();
    // @ts-expect-error - succeed should not take argument without schema
    succeed({ ok: true });
    // @ts-expect-error - fail requires argument matching fail schema
    fail();
    return fail({ err: 'fail' });
  },
});

export const tool_f_p = createVincentTool({
  toolDescription: 'Yes Tool',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([dummyPolicy]),
  executeFailSchema: F,
  precheckSuccessSchema: S,
  execute: async (_, { succeed, fail }) => {
    succeed();
    // @ts-expect-error - succeed should not take argument without schema
    succeed({ ok: true });
    // @ts-expect-error - fail requires argument matching fail schema
    fail();
    return fail({ err: 'fail' });
  },
  precheck: async (_, { succeed, fail }) => {
    // @ts-expect-error - succeed requires argument matching success schema
    succeed();
    succeed({ ok: true });
    fail();
    // @ts-expect-error - fail should not take object when no fail schema
    fail({ err: 'fail' });
    return succeed({ ok: true });
  },
});

export const tool_f_none = createVincentTool({
  toolDescription: 'Yes Tool',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([dummyPolicy]),
  executeFailSchema: F,
  execute: async (_, { succeed, fail }) => {
    succeed();
    // @ts-expect-error - succeed should not take argument without schema
    succeed({ ok: true });
    // @ts-expect-error - fail requires argument matching fail schema
    fail();
    return fail({ err: 'fail' });
  },
  precheck: async (_, { succeed, fail }) => {
    succeed();
    // @ts-expect-error - succeed should not take argument without schema
    succeed({ ok: true });
    fail();
    // @ts-expect-error - fail should not take object when no fail schema
    fail({ err: 'fail' });
    return succeed();
  },
});

export const tool_none_pf = createVincentTool({
  toolDescription: 'Yes Tool',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([dummyPolicy]),
  precheckFailSchema: F,
  execute: async (_, { succeed, fail }) => {
    succeed();
    // @ts-expect-error - succeed should not take argument without schema
    succeed({ ok: true });
    fail();
    // @ts-expect-error - fail should not take object when no fail schema
    fail({ err: 'fail' });
    return succeed();
  },
  precheck: async (_, { succeed, fail }) => {
    succeed();
    // @ts-expect-error - succeed should not take argument without schema
    succeed({ ok: true });
    // @ts-expect-error - fail requires argument matching fail schema
    fail();
    return fail({ err: 'fail' });
  },
});

export const tool_none_p = createVincentTool({
  toolDescription: 'Yes Tool',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([dummyPolicy]),
  precheckSuccessSchema: S,
  execute: async (_, { succeed, fail }) => {
    succeed();
    // @ts-expect-error - succeed should not take argument without schema
    succeed({ ok: true });
    fail();
    // @ts-expect-error - fail should not take object when no fail schema
    fail({ err: 'fail' });
    return succeed();
  },
  precheck: async (_, { succeed, fail }) => {
    // @ts-expect-error - succeed requires argument matching success schema
    succeed();
    succeed({ ok: true });
    fail();
    // @ts-expect-error - fail should not take object when no fail schema
    fail({ err: 'fail' });
    return succeed({ ok: true });
  },
});
