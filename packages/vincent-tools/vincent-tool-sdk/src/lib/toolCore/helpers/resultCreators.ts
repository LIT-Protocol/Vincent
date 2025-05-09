// src/lib/toolCore/helpers/resultCreators.ts

import {
  ToolResponseFailure,
  ToolResponseFailureNoResult,
  ToolResponseSuccess,
  ToolResponseSuccessNoResult,
} from '../../types';

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
