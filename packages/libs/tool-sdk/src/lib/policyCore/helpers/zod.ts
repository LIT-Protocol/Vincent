// src/lib/policyCore/helpers/zod.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodType } from 'zod';

import { z } from 'zod';

import type { PolicyResponseDeny } from '../../types';

import { bigintReplacer } from '../../utils';
import { createDenyResult } from './resultCreators';
import { isPolicyDenyResponse, isPolicyResponse } from './typeGuards';

/**
 * Matches the minimum structure of a PolicyResponse.
 * This is useful when validating that a response shape is at least plausible.
 */
export const PolicyResponseShape = z.object({
  allow: z.boolean(),
  result: z.unknown(),
});

/**
 * Validates a value using a Zod schema (or requires undefined if none given).
 * Returns parsed result or a standardized deny object.
 *
 * @param value - The raw value to validate
 * @param schema - A Zod schema to apply, or undefined (meaning: must be undefined)
 * @param phase - One of 'evaluate' | 'precheck' | 'commit'
 * @param stage - 'parameters' (before calling the lifecycle phase) or 'result' (after receiving the result)
 *
 * @returns The parsed result, or a PolicyResponseDeny with a ZodValidationDenyResult
 */
export function validateOrDeny<T extends ZodType<any, any, any>>(
  value: unknown,
  schema: T,
  phase: 'evaluate' | 'precheck' | 'commit',
  stage: 'input' | 'output',
): z.infer<T> | PolicyResponseDeny<never> {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    const descriptor = stage === 'input' ? 'parameters' : 'result';
    const message = `Invalid ${phase} ${descriptor}.`;
    return createDenyResult({
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

export function getValidatedParamsOrDeny<
  TToolParams extends z.ZodType<any, any, any>,
  TUserParams extends z.ZodType<any, any, any>,
>({
  rawToolParams,
  rawUserParams,
  toolParamsSchema,
  userParamsSchema,
  phase,
}: {
  rawToolParams: unknown;
  rawUserParams: unknown;
  toolParamsSchema: TToolParams;
  userParamsSchema: TUserParams;
  phase: 'evaluate' | 'precheck';
}):
  | PolicyResponseDeny<never>
  | {
      toolParams: z.infer<TToolParams>;
      userParams: z.infer<TUserParams>;
    } {
  const toolParams = validateOrDeny(rawToolParams, toolParamsSchema, phase, 'input');
  if (isPolicyDenyResponse(toolParams)) {
    return toolParams;
  }

  const userParams = validateOrDeny(rawUserParams, userParamsSchema, phase, 'input');
  if (isPolicyDenyResponse(userParams)) {
    return userParams;
  }

  return {
    toolParams,
    userParams,
  };
}

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
  allowResultSchema: z.ZodType<any, any, any>;
  denyResultSchema: z.ZodType<any, any, any>;
}): {
  schemaToUse: z.ZodType<any, any, any>;
  parsedType: 'allow' | 'deny' | 'unknown';
} {
  if (!isPolicyResponse(value)) {
    console.log(
      'getSchemaForPolicyResponseResult !isPolicyResponse',
      JSON.stringify(value, bigintReplacer),
    );

    return {
      schemaToUse: PolicyResponseShape,
      parsedType: 'unknown',
    };
  }

  console.log('getSchemaForPolicyResponseResult value is', JSON.stringify(value, bigintReplacer));
  return {
    schemaToUse: value.allow ? allowResultSchema : denyResultSchema,
    parsedType: value.allow ? 'allow' : 'deny',
  };
}
