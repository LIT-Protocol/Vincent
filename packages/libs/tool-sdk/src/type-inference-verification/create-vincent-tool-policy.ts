// src/type-inference-verification/create-vincent-tool-policy.ts

import { z } from 'zod';

import { asBundledVincentPolicy } from '../lib/policyCore/bundledPolicy/bundledPolicy';
import { createVincentPolicy, createVincentToolPolicy } from '../lib/policyCore/vincentPolicy';

const toolParamsSchema = z.object({
  x: z.string(),
});

const policyParamsSchema = z.object({
  message: z.string(),
});

const evalAllow = z.object({ allowed: z.boolean() });
const evalDeny = z.object({ reason: z.string() });

const PolicyConfig = createVincentPolicy({
  packageName: 'my-policy' as const,
  toolParamsSchema: policyParamsSchema,
  evalAllowResultSchema: evalAllow,
  evalDenyResultSchema: evalDeny,
  evaluate: async ({ toolParams }, ctx) => {
    return ctx.allow({ allowed: true });
  },
});

const bundled = asBundledVincentPolicy(PolicyConfig, 'QmCID12345' as const);

const toolPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy: bundled,
  toolParameterMappings: {
    x: 'message',
  },
});

type Expect<T extends true> = T;

// ✅ Should pass only if ipfsCid is a literal string
type CidIsLiteral = Expect<
  (typeof toolPolicy)['ipfsCid'] extends string
    ? string extends (typeof toolPolicy)['ipfsCid']
      ? false // 🔴 widened
      : true // ✅ literal
    : false
>;

const cid: CidIsLiteral = true;
console.log(cid);

// ✅ Infere nce: ipfsCid should be literal
// type Cid = typeof toolPolicy.ipfsCid;
//    ^? "QmCID12345"

// ✅ Inference: packageName should be literal
// type Package = typeof toolPolicy.vincentPolicy.packageName;
//    ^? "my-policy"

// ✅ Inference: schema accessors should be accurate
// type AllowSchema = typeof toolPolicy.__schemaTypes.evalAllowResultSchema;
//    ^? z.ZodObject<{ allowed: z.ZodBoolean }>

// ✅ Function types inferred
// type EvaluateFn = typeof toolPolicy.__schemaTypes.evaluate;
//    ^? (input: ..., context: ...) => Promise<...>

// ❌ Invalid schema field — should error
// @ts-expect-error invalid schema key
console.log(toolPolicy.__schemaTypes.notARealSchema);

export {};
