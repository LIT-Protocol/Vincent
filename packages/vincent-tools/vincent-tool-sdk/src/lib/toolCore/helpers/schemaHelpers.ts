// src/lib/toolCore/helpers/schemaHelpers.ts

import { ZodType, z } from 'zod';
import { isToolResponse } from './typeGuards';
import { ToolResponseShape } from './zod';

/**
 * Given an unknown tool response result and the known success/failure schemas,
 * this function returns the appropriate Zod schema to use when validating `.result`.
 *
 * - If the response shape is invalid, returns a Zod schema matching the ToolResponse structure.
 * - If the shape is valid, returns either the success or failure result schema.
 */
export function getSchemaForToolResponseResult({
  value,
  successResultSchema,
  failureResultSchema,
}: {
  value: unknown;
  successResultSchema?: ZodType;
  failureResultSchema?: ZodType;
}): {
  schemaToUse: ZodType;
  parsedType: 'success' | 'failure' | 'unknown';
} {
  if (!isToolResponse(value)) {
    return {
      schemaToUse: ToolResponseShape,
      parsedType: 'unknown',
    };
  }

  const schemaToUse = value.success
    ? (successResultSchema ?? z.undefined())
    : (failureResultSchema ?? z.undefined());

  return {
    schemaToUse,
    parsedType: value.success ? 'success' : 'failure',
  };
}
