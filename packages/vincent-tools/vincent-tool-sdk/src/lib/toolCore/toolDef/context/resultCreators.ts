// src/lib/toolCore/toolDef/context/resultCreators.ts

import {
  ContextSuccess,
  ContextSuccessNoResult,
  ContextFailure,
  ContextFailureNoResult,
  YouMustCallContextSucceedOrFail,
} from './types';

/**
 * Wraps a success result with payload
 */
export function createSuccess<T>(result: T): ContextSuccess<T> {
  return {
    success: true,
    result,
    [YouMustCallContextSucceedOrFail]: 'ToolResult',
  } as ContextSuccess<T>;
}

/**
 * Wraps a success result without payload
 */
export function createSuccessNoResult(): ContextSuccessNoResult {
  return {
    success: true,
    [YouMustCallContextSucceedOrFail]: 'ToolResult',
  } as ContextSuccessNoResult;
}

/**
 * Wraps a failure result with payload
 */
export function createFailure<T>(result: T, error?: string): ContextFailure<T> {
  return {
    success: false,
    result,
    ...(error ? { error } : {}),
    [YouMustCallContextSucceedOrFail]: 'ToolResult',
  } as ContextFailure<T>;
}

/**
 * Wraps a failure result without payload
 */
export function createFailureNoResult(error?: string): ContextFailureNoResult {
  return {
    success: false,
    result: undefined as never,
    ...(error ? { error } : {}),
    [YouMustCallContextSucceedOrFail]: 'ToolResult',
  } as ContextFailureNoResult;
}
