// src/lib/policyCore/helpers/resultCreators.ts

import { PolicyResponseDeny, PolicyResponseDenyNoResult } from '../../types';

/**
 * Overload: return a fully-typed deny response with a result
 */
export function createDenyResult<T>(params: {
  ipfsCid: string;
  message: string;
  result: T;
}): PolicyResponseDeny<T>;
/**
 * Overload: return a deny response with no result
 */
export function createDenyResult(params: {
  ipfsCid: string;
  message: string;
}): PolicyResponseDenyNoResult;
/**
 * Implementation
 */
export function createDenyResult<T>(params: {
  ipfsCid: string;
  message: string;
  result?: T;
}): PolicyResponseDeny<T> | PolicyResponseDenyNoResult {
  const { ipfsCid, message, result } = params;

  if (result === undefined) {
    return {
      ipfsCid,
      allow: false,
      error: message,
      result: undefined as never,
    };
  }

  return {
    ipfsCid,
    allow: false,
    error: message,
    result,
  };
}
