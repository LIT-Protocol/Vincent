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

/**
 * Overload: return a fully-typed allow response with a result
 */
export function createAllowResult<T>(params: {
  ipfsCid: string;
  result: T;
}): PolicyResponseAllow<T>;

/**
 * Overload: return an allow response with no result
 */
export function createAllowResult(params: { ipfsCid: string }): PolicyResponseAllowNoResult;

/**
 * Implementation
 */
export function createAllowResult<T>(params: {
  ipfsCid: string;
  result?: T;
}): PolicyResponseAllow<T> | PolicyResponseAllowNoResult {
  const { ipfsCid, result } = params;

  if (result === undefined) {
    return {
      ipfsCid,
      allow: true,
      result: undefined as never,
    };
  }

  return {
    ipfsCid,
    allow: true,
    result,
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
