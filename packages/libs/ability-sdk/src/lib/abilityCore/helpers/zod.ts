// src/lib/abilityCore/helpers/zod.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodType } from 'zod';

import { z } from 'zod';

import type { AbilityResultFailure, AbilityResultFailureNoResult } from '../../types';

import { createAbilityFailureResult } from './resultCreators';
import { isAbilityResult } from './typeGuards';

/**
 * Matches the minimum structure of a AbilityResult.
 * This is useful when validating that a response shape is at least plausible.
 */
export const AbilityResultShape = z.object({
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
): z.infer<T> | AbilityResultFailure<never> | AbilityResultFailureNoResult {
  const effectiveSchema = schema ?? mustBeUndefinedSchema;
  const parsed = effectiveSchema.safeParse(value);

  if (!parsed.success) {
    const descriptor = stage === 'input' ? 'parameters' : 'result';
    const message = `Invalid ${phase} ${descriptor}.`;
    return createAbilityFailureResult({
      runtimeError: message,
      schemaValidationError: {
        zodError: parsed.error,
        phase,
        stage,
      },
    });
  }

  return parsed.data;
}

/**
 * Given an unknown ability response result and the known success/failure schemas,
 * this function returns the appropriate Zod schema to use when validating `.result`.
 *
 * - If the response shape is invalid, returns a Zod schema matching the AbilityResult structure.
 * - If the shape is valid, returns either the success or failure result schema.
 */
export function getSchemaForAbilityResult({
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
  if (!isAbilityResult(value)) {
    return {
      schemaToUse: AbilityResultShape,
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
