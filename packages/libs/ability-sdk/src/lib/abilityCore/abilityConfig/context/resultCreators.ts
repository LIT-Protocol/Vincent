// src/lib/abilityCore/abilityConfig/context/resultCreators.ts

import type {
  ContextSuccess,
  ContextSuccessNoResult,
  ContextFailure,
  ContextFailureNoResult,
} from './types';

import { YouMustCallContextSucceedOrFail } from './types';

/**
 * Wraps a success result with payload
 */
export function createSuccess<T>(result: T): ContextSuccess<T> {
  return {
    success: true,
    result,
    [YouMustCallContextSucceedOrFail]: 'AbilityResult',
  } as ContextSuccess<T>;
}

/**
 * Wraps a success result without payload
 */
export function createSuccessNoResult(): ContextSuccessNoResult {
  return {
    success: true,
    [YouMustCallContextSucceedOrFail]: 'AbilityResult',
  } as ContextSuccessNoResult;
}

/**
 * Wraps a failure result with payload
 */
export function createFailure<T>(result: T): ContextFailure<T> {
  return {
    success: false,
    result,
    [YouMustCallContextSucceedOrFail]: 'AbilityResult',
  } as ContextFailure<T>;
}

/**
 * Wraps a failure result without payload
 */
export function createFailureNoResult(): ContextFailureNoResult {
  return {
    success: false,
    result: undefined as never,
    [YouMustCallContextSucceedOrFail]: 'AbilityResult',
  } as ContextFailureNoResult;
}
