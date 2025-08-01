// src/type-inference-verification/ability-lifecycle-succeed-fail-tests.ts
import { z } from 'zod';

import { supportedPoliciesForAbility } from '../lib/abilityCore/helpers';
import { createVincentAbility } from '../lib/abilityCore/vincentAbility';
import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentPolicy, createVincentAbilityPolicy } from '../lib/policyCore/vincentPolicy';

const abilityParams = z.object({ x: z.string() });
const dummyPolicy = createVincentAbilityPolicy({
  abilityParamsSchema: abilityParams,
  bundledVincentPolicy: asBundledVincentPolicy(
    createVincentPolicy({
      packageName: 'test' as const,
      abilityParamsSchema: z.object({ foo: z.string() }),
      evalAllowResultSchema: z.string(),
      evaluate: async (_, ctx) => ctx.allow('ok'),
    }),
    'cid-test' as const,
  ),
  abilityParameterMappings: { x: 'foo' },
});

const S = z.object({ ok: z.boolean() });
const F = z.object({ err: z.string() });

export const ability_s_p = createVincentAbility({
  packageName: '@lit-protocol/yesability3@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([dummyPolicy]),
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

export const ability_s_none = createVincentAbility({
  packageName: '@lit-protocol/yesability3@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([dummyPolicy]),
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

export const ability_f_pf = createVincentAbility({
  packageName: '@lit-protocol/yesability3@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([dummyPolicy]),
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

export const ability_f_p = createVincentAbility({
  packageName: '@lit-protocol/yesability3@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([dummyPolicy]),
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

export const ability_f_none = createVincentAbility({
  packageName: '@lit-protocol/yesability3@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([dummyPolicy]),
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

export const ability_none_pf = createVincentAbility({
  packageName: '@lit-protocol/yesability3@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([dummyPolicy]),
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

export const ability_none_p = createVincentAbility({
  packageName: '@lit-protocol/yesability3@1.0.0',
  abilityDescription: 'Yes Ability',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([dummyPolicy]),
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
