// src/lib/toolCore/helpers/zod.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, ZodType } from 'zod';
import { ToolResponseFailure, ToolResponseFailureNoResult } from '../../types';
import { createToolFailureResult } from './resultCreators';

/**
 * Matches the minimum structure of a ToolResponse.
 * This is useful when validating that a response shape is at least plausible.
 */
export const ToolResponseShape = z.object({
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
): z.infer<T> | ToolResponseFailure | ToolResponseFailureNoResult {
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
