// src/type-inference-verification/create-vincent-ability-policy.ts

import { z } from 'zod';

import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentPolicy, createVincentAbilityPolicy } from '../lib/policyCore/vincentPolicy';

const abilityParamsSchema = z.object({
  x: z.string(),
});

const policyParamsSchema = z.object({
  message: z.string(),
});

const evalAllow = z.object({ allowed: z.boolean() });
const evalDeny = z.object({ reason: z.string() });

const PolicyConfig = createVincentPolicy({
  packageName: 'my-policy' as const,
  abilityParamsSchema: policyParamsSchema,
  evalAllowResultSchema: evalAllow,
  evalDenyResultSchema: evalDeny,
  evaluate: async ({ abilityParams }, ctx) => {
    return ctx.allow({ allowed: true });
  },
});

const bundled = asBundledVincentPolicy(PolicyConfig, 'QmCID12345' as const);

const abilityPolicy = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy: bundled,
  abilityParameterMappings: {
    x: 'message',
  },
});

type Expect<T extends true> = T;

// ✅ Should pass only if ipfsCid is a literal string
type CidIsLiteral = Expect<
  (typeof abilityPolicy)['ipfsCid'] extends string
    ? string extends (typeof abilityPolicy)['ipfsCid']
      ? false // 🔴 widened
      : true // ✅ literal
    : false
>;

const cid: CidIsLiteral = true;
console.log(cid);

// ✅ Infere nce: ipfsCid should be literal
// type Cid = typeof abilityPolicy.ipfsCid;
//    ^? "QmCID12345"

// ✅ Inference: packageName should be literal
// type Package = typeof abilityPolicy.vincentPolicy.packageName;
//    ^? "my-policy"

// ✅ Inference: schema accessors should be accurate
// type AllowSchema = typeof abilityPolicy.__schemaTypes.evalAllowResultSchema;
//    ^? z.ZodObject<{ allowed: z.ZodBoolean }>

// ✅ Function types inferred
// type EvaluateFn = typeof abilityPolicy.__schemaTypes.evaluate;
//    ^? (input: ..., context: ...) => Promise<...>

// ❌ Invalid schema field — should error
// @ts-expect-error invalid schema key
console.log(abilityPolicy.__schemaTypes.notARealSchema);

export {};
