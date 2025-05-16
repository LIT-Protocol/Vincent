// src/lib/policyCore/helpers/resultCreators.ts

import {
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
  PolicyEvaluationResultContext,
} from '../../types';

/**
 * Overload: return a fully-typed deny response with a result
 */
export function createDenyResult<T>(params: { message: string; result: T }): PolicyResponseDeny<T>;
/**
 * Overload: return a deny response with no result
 */
export function createDenyResult(params: { message: string }): PolicyResponseDenyNoResult;
/**
 * Implementation
 */
export function createDenyResult<T>(params: {
  message: string;
  result?: T;
}): PolicyResponseDeny<T> | PolicyResponseDenyNoResult {
  if (params.result === undefined) {
    return {
      allow: false,
      error: params.message,
      result: undefined as never,
    };
  }

  return {
    allow: false,
    error: params.message,
    result: params.result,
  };
}

/**
 * Overload: return a fully-typed allow response with a result
 */
export function createAllowResult<T>(params: { result: T }): PolicyResponseAllow<T>;

/**
 * Overload: return an allow response with no result
 */

/**
 * Implementation
 */
export function createAllowResult<T>(params: {
  result?: T;
}): PolicyResponseAllow<T> | PolicyResponseAllowNoResult {
  if (params.result === undefined) {
    return {
      allow: true,
      result: undefined as never,
    };
  }

  return {
    allow: true,
    result: params.result,
  };
}

export function createAllowEvaluationResult<PolicyMapType extends Record<string, any>>(params: {
  evaluatedPolicies: Array<keyof PolicyMapType>;
  allowedPolicies: PolicyEvaluationResultContext<PolicyMapType>['allowedPolicies'];
}): PolicyEvaluationResultContext<PolicyMapType> {
  return {
    allow: true,
    evaluatedPolicies: params.evaluatedPolicies,
    allowedPolicies: params.allowedPolicies,
    deniedPolicy: undefined, // important for union discrimination
  } as PolicyEvaluationResultContext<PolicyMapType>;
}

export function createDenyEvaluationResult<PolicyMapType extends Record<string, any>>(params: {
  evaluatedPolicies: Array<keyof PolicyMapType>;
  allowedPolicies: PolicyEvaluationResultContext<PolicyMapType>['allowedPolicies'];
  deniedPolicy: PolicyEvaluationResultContext<PolicyMapType>['deniedPolicy'];
}): PolicyEvaluationResultContext<PolicyMapType> {
  return {
    allow: false,
    evaluatedPolicies: params.evaluatedPolicies,
    allowedPolicies: params.allowedPolicies,
    deniedPolicy: params.deniedPolicy,
  } as PolicyEvaluationResultContext<PolicyMapType>;
}
