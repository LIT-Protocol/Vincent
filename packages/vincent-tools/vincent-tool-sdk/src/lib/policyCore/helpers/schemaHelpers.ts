// src/lib/policyCore/helpers/schemaHelpers.ts

import { ZodType, z } from 'zod';
import { isPolicyResponse } from './typeGuards';
import { PolicyResponseShape } from './zod';

/**
 * Given an unknown policy response result and the known allow/deny schemas,
 * this function returns the appropriate Zod schema to use when validating `.result`.
 *
 * - If the response shape is invalid, returns a Zod schema matching the PolicyResponse structure.
 * - If the shape is valid, returns either the allow or deny result schema.
 */
export function getSchemaForPolicyResponseResult({
  value,
  allowResultSchema,
  denyResultSchema,
}: {
  value: unknown;
  allowResultSchema?: ZodType;
  denyResultSchema?: ZodType;
}): {
  schemaToUse: ZodType;
  parsedType: 'allow' | 'deny' | 'unknown';
} {
  if (!isPolicyResponse(value)) {
    return {
      schemaToUse: PolicyResponseShape,
      parsedType: 'unknown',
    };
  }

  const schemaToUse = value.allow
    ? (allowResultSchema ?? z.undefined())
    : (denyResultSchema ?? z.undefined());

  return {
    schemaToUse,
    parsedType: value.allow ? 'allow' : 'deny',
  };
}
