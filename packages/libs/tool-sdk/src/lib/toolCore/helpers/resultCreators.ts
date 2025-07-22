// src/lib/toolCore/helpers/resultCreators.ts

import type { z, ZodType } from 'zod';

import type {
  ToolResultFailure,
  ToolResultFailureNoResult,
  ToolResultSuccess,
  ToolResultSuccessNoResult,
  SchemaValidationError,
} from '../../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function createToolSuccessResult(): ToolResultSuccessNoResult;
export function createToolSuccessResult<T>({ result }: { result: T }): ToolResultSuccess<T>;
export function createToolSuccessResult<T>(args?: {
  result: T;
}): ToolResultSuccess<T> | ToolResultSuccessNoResult {
  if (!args || args.result === undefined) {
    return { success: true };
  }
  return { success: true, result: args.result };
}

export function createToolFailureResult({
  runtimeError,
  schemaValidationError,
}: {
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
}): ToolResultFailureNoResult;
export function createToolFailureResult<T>({
  runtimeError,
  result,
  schemaValidationError,
}: {
  result: T;
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
}): ToolResultFailure<T>;
export function createToolFailureResult<T>({
  runtimeError,
  result,
  schemaValidationError,
}: {
  result?: T;
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
}): ToolResultFailure<T> | ToolResultFailureNoResult {
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

export function createToolFailureNoResult(
  runtimeError: string,
  schemaValidationError?: SchemaValidationError,
): ToolResultFailureNoResult {
  return createToolFailureResult({ runtimeError, schemaValidationError });
}

export function wrapFailure<T extends z.ZodType<any, any, any>>(
  value: z.infer<T>,
  runtimeError?: string,
  schemaValidationError?: SchemaValidationError,
): ToolResultFailure<z.infer<T>> {
  return createToolFailureResult({ result: value, runtimeError, schemaValidationError });
}

export function wrapNoResultFailure<T extends ZodType<any, any, any> | undefined>(
  runtimeError: string,
  schemaValidationError?: SchemaValidationError,
): T extends ZodType<any, any, any> ? ToolResultFailure<z.infer<T>> : ToolResultFailureNoResult {
  return createToolFailureNoResult(runtimeError, schemaValidationError) as any;
}

export function wrapSuccess<T extends z.ZodType<any, any, any>>(
  value: z.infer<T>,
): ToolResultSuccess<z.infer<T>> {
  return createToolSuccessResult({ result: value });
}

export function wrapNoResultSuccess(): ToolResultSuccessNoResult {
  return createToolSuccessResult();
}
