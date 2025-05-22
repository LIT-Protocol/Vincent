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
    [YouMustCallContextSucceedOrFail]: 'ToolResponse',
  } as ContextSuccess<T>;
}

/**
 * Wraps a success result without payload
 */
export function createSuccessNoResult(): ContextSuccessNoResult {
  return {
    success: true,
    [YouMustCallContextSucceedOrFail]: 'ToolResponse',
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
    [YouMustCallContextSucceedOrFail]: 'ToolResponse',
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
    [YouMustCallContextSucceedOrFail]: 'ToolResponse',
  } as ContextFailureNoResult;
}
