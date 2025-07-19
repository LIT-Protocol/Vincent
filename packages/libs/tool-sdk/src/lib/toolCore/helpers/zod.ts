// src/lib/toolCore/helpers/zod.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodType } from 'zod';

import { z } from 'zod';

import type { ToolResultFailure, ToolResultFailureNoResult } from '../../types';

import { createToolFailureResult } from './resultCreators';
import { isToolResult } from './typeGuards';

/**
 * Matches the minimum structure of a ToolResult.
 * This is useful when validating that a response shape is at least plausible.
 */
export const ToolResultShape = z.object({
  success: z.boolean(),
  result: z.unknown(),
});

/**
 * Used as the default fallback schema when one is missing and the result must be undefined.
 */
const mustBeUndefinedSchema = z.undefined();

/**
 * Validates a value using a Zod schema (or requires undefined if none given).
 * Returns parsed result or a standardized failure object.
 *
 * @param value - The raw value to validate
 * @param schema - A Zod schema to apply
 * @param stage - Whether this is input or output validation
 * @param phase - Whether this is 'precheck' or 'execute'
 */
export function validateOrFail<T extends ZodType<any, any, any>>(
  value: unknown,
  schema: T,
  phase: 'precheck' | 'execute',
  stage: 'input' | 'output',
): z.infer<T> | ToolResultFailure | ToolResultFailureNoResult {
  const effectiveSchema = schema ?? mustBeUndefinedSchema;
  const parsed = effectiveSchema.safeParse(value);

  if (!parsed.success) {
    const descriptor = stage === 'input' ? 'parameters' : 'result';
    const message = `Invalid ${phase} ${descriptor}.`;
    return createToolFailureResult({
      message,
      result: { zodError: parsed.error },
    });
  }

  return parsed.data;
}

/**
 * Given an unknown tool response result and the known success/failure schemas,
 * this function returns the appropriate Zod schema to use when validating `.result`.
 *
 * - If the response shape is invalid, returns a Zod schema matching the ToolResult structure.
 * - If the shape is valid, returns either the success or failure result schema.
 */
export function getSchemaForToolResult({
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
  if (!isToolResult(value)) {
    return {
      schemaToUse: ToolResultShape,
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
