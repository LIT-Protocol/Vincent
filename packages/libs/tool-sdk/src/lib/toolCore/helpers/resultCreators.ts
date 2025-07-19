// src/lib/toolCore/helpers/resultCreators.ts

import type { z, ZodType } from 'zod';

import type {
  ToolResultFailure,
  ToolResultFailureNoResult,
  ToolResultSuccess,
  ToolResultSuccessNoResult,
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
  message,
}: {
  message?: string;
}): ToolResultFailureNoResult;
export function createToolFailureResult<T>({
  message,
  result,
}: {
  result: T;
  message?: string;
}): ToolResultFailure<T>;
export function createToolFailureResult<T>({
  message,
  result,
}: {
  result?: T;
  message?: string;
}): ToolResultFailure<T> | ToolResultFailureNoResult {
  if (result === undefined) {
    return {
      success: false,
      error: message,
      result: undefined as never,
    };
  }

  return {
    success: false,
    error: message,
    result,
  };
}

export function createToolFailureNoResult(message: string): ToolResultFailureNoResult {
  return createToolFailureResult({ message });
}

export function wrapFailure<T extends z.ZodType<any, any, any>>(
  value: z.infer<T>,
  message?: string,
): ToolResultFailure<z.infer<T>> {
  return createToolFailureResult({ result: value, message });
}

export function wrapNoResultFailure<T extends ZodType<any, any, any> | undefined>(
  message: string,
): T extends ZodType<any, any, any> ? ToolResultFailure<z.infer<T>> : ToolResultFailureNoResult {
  return createToolFailureNoResult(message) as any;
}

export function wrapSuccess<T extends z.ZodType<any, any, any>>(
  value: z.infer<T>,
): ToolResultSuccess<z.infer<T>> {
  return createToolSuccessResult({ result: value });
}

export function wrapNoResultSuccess(): ToolResultSuccessNoResult {
  return createToolSuccessResult();
}
