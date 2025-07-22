// src/type-inference-verification/create-policy-map-from-tool-policies.ts

/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';

import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentPolicy, createVincentToolPolicy } from '../lib/policyCore/vincentPolicy';
import { supportedPoliciesForTool } from '../lib/toolCore/helpers';

const PolicyConfig1 = createVincentPolicy({
  packageName: 'example-policy-1',
  toolParamsSchema: z.object({ x: z.string() }),
  evalAllowResultSchema: z.object({ pass: z.boolean() }),
  evalDenyResultSchema: z.object({ error: z.string() }),
  evaluate: async ({ toolParams }, ctx) => {
    return ctx.allow({ pass: true });
  },
});

const PolicyConfig2 = createVincentPolicy({
  packageName: 'example-policy-2',
  toolParamsSchema: z.object({ y: z.number() }),
  evalAllowResultSchema: z.object({ pass: z.literal(true) }),
  evalDenyResultSchema: z.object({ code: z.number() }),
  evaluate: async ({ toolParams }, ctx) => {
    return ctx.deny({ code: 403 });
  },
});

const bundled1 = asBundledVincentPolicy(PolicyConfig1, 'QmCID1' as const);
const bundled2 = asBundledVincentPolicy(PolicyConfig2, 'QmCID2' as const);

const policy1 = createVincentToolPolicy({
  toolParamsSchema: z.object({ x: z.string() }),
  bundledVincentPolicy: bundled1,
  toolParameterMappings: {
    x: 'x',
  },
});

const policy2 = createVincentToolPolicy({
  toolParamsSchema: z.object({ y: z.number() }),
  bundledVincentPolicy: bundled2,
  toolParameterMappings: {
    y: 'y',
  },
});

const result = supportedPoliciesForTool([policy1, policy2]);

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
