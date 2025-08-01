// src/lib/abilityCore/helpers/resultCreators.ts

import type { z, ZodType } from 'zod';

import type {
  AbilityResultFailure,
  AbilityResultFailureNoResult,
  AbilityResultSuccess,
  AbilityResultSuccessNoResult,
  SchemaValidationError,
} from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function createAbilitySuccessResult(): AbilityResultSuccessNoResult;
export function createAbilitySuccessResult<T>({ result }: { result: T }): AbilityResultSuccess<T>;
export function createAbilitySuccessResult<T>(args?: {
  result: T;
}): AbilityResultSuccess<T> | AbilityResultSuccessNoResult {
  if (!args || args.result === undefined) {
    return { success: true };
  }
  return { success: true, result: args.result };
}

export function createAbilityFailureResult({
  runtimeError,
  schemaValidationError,
}: {
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
}): AbilityResultFailureNoResult;
export function createAbilityFailureResult<T>({
  runtimeError,
  result,
  schemaValidationError,
}: {
  result: T;
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
}): AbilityResultFailure<T>;
export function createAbilityFailureResult<T>({
  runtimeError,
  result,
  schemaValidationError,
}: {
  result?: T;
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
}): AbilityResultFailure<T> | AbilityResultFailureNoResult {
  if (result === undefined) {
    return {
      success: false,
      runtimeError: runtimeError,
      result: undefined as never,
      ...(schemaValidationError ? { schemaValidationError } : {}),
    };
  }

  return {
    success: false,
    runtimeError: runtimeError,
    result,
    ...(schemaValidationError ? { schemaValidationError } : {}),
  };
}

export function createAbilityFailureNoResult(
  runtimeError: string,
  schemaValidationError?: SchemaValidationError,
): AbilityResultFailureNoResult {
  return createAbilityFailureResult({ runtimeError, schemaValidationError });
}

export function wrapFailure<T extends z.ZodType<any, any, any>>(
  value: z.infer<T>,
  runtimeError?: string,
  schemaValidationError?: SchemaValidationError,
): AbilityResultFailure<z.infer<T>> {
  return createAbilityFailureResult({ result: value, runtimeError, schemaValidationError });
}

export function wrapNoResultFailure<T extends ZodType<any, any, any> | undefined>(
  runtimeError: string,
  schemaValidationError?: SchemaValidationError,
): T extends ZodType<any, any, any>
  ? AbilityResultFailure<z.infer<T>>
  : AbilityResultFailureNoResult {
  return createAbilityFailureNoResult(runtimeError, schemaValidationError) as any;
}

export function wrapSuccess<T extends z.ZodType<any, any, any>>(
  value: z.infer<T>,
): AbilityResultSuccess<z.infer<T>> {
  return createAbilitySuccessResult({ result: value });
}

export function wrapNoResultSuccess(): AbilityResultSuccessNoResult {
  return createAbilitySuccessResult();
}
