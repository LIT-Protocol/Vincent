// src/type-inference-verification/create-policy-map-from-ability-policies.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';

import { supportedPoliciesForAbility } from '../lib/abilityCore/helpers';
import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentPolicy, createVincentAbilityPolicy } from '../lib/policyCore/vincentPolicy';

const PolicyConfig1 = createVincentPolicy({
  packageName: 'example-policy-1',
  abilityParamsSchema: z.object({ x: z.string() }),
  evalAllowResultSchema: z.object({ pass: z.boolean() }),
  evalDenyResultSchema: z.object({ error: z.string() }),
  evaluate: async ({ abilityParams }, ctx) => {
    return ctx.allow({ pass: true });
  },
});

const PolicyConfig2 = createVincentPolicy({
  packageName: 'example-policy-2',
  abilityParamsSchema: z.object({ y: z.number() }),
  evalAllowResultSchema: z.object({ pass: z.literal(true) }),
  evalDenyResultSchema: z.object({ code: z.number() }),
  evaluate: async ({ abilityParams }, ctx) => {
    return ctx.deny({ code: 403 });
  },
});

const bundled1 = asBundledVincentPolicy(PolicyConfig1, 'QmCID1' as const);
const bundled2 = asBundledVincentPolicy(PolicyConfig2, 'QmCID2' as const);

const policy1 = createVincentAbilityPolicy({
  abilityParamsSchema: z.object({ x: z.string() }),
  bundledVincentPolicy: bundled1,
  abilityParameterMappings: {
    x: 'x',
  },
});

const policy2 = createVincentAbilityPolicy({
  abilityParamsSchema: z.object({ y: z.number() }),
  bundledVincentPolicy: bundled2,
  abilityParameterMappings: {
    y: 'y',
  },
});

const result = supportedPoliciesForAbility([policy1, policy2]);

// ✅ Known package names — should succeed
const p1 = result.policyByPackageName['example-policy-1'];
const p2 = result.policyByPackageName['example-policy-2'];

console.log(p1, p2);

// ✅ Known CIDs — should succeed
const c1 = result.policyByIpfsCid['QmCID1'];
const c2 = result.policyByIpfsCid['QmCID2'];

console.log(c1, c2);

// @ts-expect-error should error: unknown package name
const failPkg = result.policyByPackageName['not-a-real-policy'];

// @ts-expect-error should error: unknown ipfsCid
const failCid = result.policyByIpfsCid['QmInvalidCID'];

export {};
