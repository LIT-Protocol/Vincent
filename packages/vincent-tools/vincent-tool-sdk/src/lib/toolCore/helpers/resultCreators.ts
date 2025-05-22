// src/lib/toolCore/helpers/resultCreators.ts

import {
  ToolResponseFailure,
  ToolResponseFailureNoResult,
  ToolResponseSuccess,
  ToolResponseSuccessNoResult,
} from '../../types';

import { z, ZodType } from 'zod';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function createToolSuccessResult(): ToolResponseSuccessNoResult;
export function createToolSuccessResult<T>({ result }: { result: T }): ToolResponseSuccess<T>;
export function createToolSuccessResult<T>(args?: {
  result: T;
}): ToolResponseSuccess<T> | ToolResponseSuccessNoResult {
  if (!args || args.result === undefined) {
    return { success: true };
  }
  return { success: true, result: args.result };
}

export function createToolFailureResult({
  message,
}: {
  message?: string;
}): ToolResponseFailureNoResult;
export function createToolFailureResult<T>({
  message,
  result,
}: {
  result: T;
  message?: string;
}): ToolResponseFailure<T>;
export function createToolFailureResult<T>({
  message,
  result,
}: {
  result?: T;
  message?: string;
}): ToolResponseFailure<T> | ToolResponseFailureNoResult {
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

export function createToolFailureNoResult(message: string): ToolResponseFailureNoResult {
  return createToolFailureResult({ message });
}

export function wrapFailure<T extends z.ZodType<any, any, any>>(
  value: z.infer<T>,
  message?: string,
): ToolResponseFailure<z.infer<T>> {
  return createToolFailureResult({ result: value, message });
}

export function wrapNoResultFailure<T extends ZodType<any, any, any> | undefined>(
  message: string,
): T extends ZodType<any, any, any>
  ? ToolResponseFailure<z.infer<T>>
  : ToolResponseFailureNoResult {
  return createToolFailureNoResult(message) as any;
}

export function wrapSuccess<T extends z.ZodType<any, any, any>>(
  value: z.infer<T>,
): ToolResponseSuccess<z.infer<T>> {
  return createToolSuccessResult({ result: value });
}

export function wrapNoResultSuccess(): ToolResponseSuccessNoResult {
  return createToolSuccessResult();
}
