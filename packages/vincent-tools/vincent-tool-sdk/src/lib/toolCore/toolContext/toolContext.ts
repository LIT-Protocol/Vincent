// src/lib/toolCore/toolContext/toolContext.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import {
  PolicyEvaluationResultContext,
  ToolExecutionPolicyContext,
  ToolExecutionPolicyEvaluationResult,
  VincentPolicyDef,
} from '../../types';
import { BaseToolContext, ToolContext, YouMustCallContextSucceedOrFail } from './types';

/**
 * Builds an execution-time ToolContext for use inside `execute()` lifecycle methods.
 * It upgrades the incoming external policy context with `commit()` methods derived
 * from the tool's supported policies and schema definitions. Ensures commit calls
 * are fully typed and validated internally.
 */
export function createExecutionToolContext<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  PolicyMapType extends Record<string, any>,
>(params: {
  baseContext: BaseToolContext<ToolExecutionPolicyEvaluationResult<PolicyMapType>>;
  successSchema?: SuccessSchema;
  failSchema?: FailSchema;
  supportedPolicies: unknown;
}): ToolContext<SuccessSchema, FailSchema, ToolExecutionPolicyContext<PolicyMapType>> {
  const { baseContext, successSchema, failSchema, supportedPolicies } = params;

  const succeed = successSchema
    ? (((result) => ({
        success: true,
        result,
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['succeed'])
    : ((() => ({
        success: true,
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['succeed']);

  const fail = failSchema
    ? (((result, error) => ({
        success: false,
        result,
        ...(error ? { error } : {}),
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['fail'])
    : (((error?: string) => ({
        success: false,
        ...(error ? { error } : {}),
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['fail']);

  const map = supportedPolicies as PolicyMapType;

  const upgradedPoliciesContext: ToolExecutionPolicyContext<PolicyMapType> = {
    evaluatedPolicies: baseContext.policiesContext.evaluatedPolicies,
    allow: true,
    deniedPolicy: undefined as never,
    allowedPolicies: (Object.keys(map) as (keyof PolicyMapType)[]).reduce(
      (acc, key) => {
        const entry = baseContext.policiesContext.allowedPolicies[key] as
          | ToolExecutionPolicyContext<PolicyMapType>['allowedPolicies'][typeof key]
          | undefined;

        const policyDef = map[key]?.policyDef;

        if (entry && policyDef?.commit) {
          acc[key] = {
            ...entry,
            commit: policyDef.commit,
          };
        } else if (entry) {
          acc[key] = entry;
        }

        return acc;
      },
      {} as ToolExecutionPolicyContext<PolicyMapType>['allowedPolicies'],
    ),
  };

  return {
    ...baseContext,
    policiesContext: upgradedPoliciesContext,
    succeed,
    fail,
  };
}

/**
 * Builds a precheck-time ToolContext for use inside `precheck()` lifecycle methods.
 * It includes only the evaluated policy metadata and denies commit access,
 * ensuring developers don’t call commit prematurely. Enforces policy result typing.
 */
export function createPrecheckToolContext<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  PolicyMap extends Record<
    string,
    {
      vincentPolicy: VincentPolicyDef<
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any
      >;
    }
  >,
>(params: {
  baseContext: BaseToolContext<PolicyEvaluationResultContext<PolicyMap>>;
  successSchema?: SuccessSchema;
  failSchema?: FailSchema;
}): ToolContext<SuccessSchema, FailSchema, PolicyEvaluationResultContext<PolicyMap>> {
  const { baseContext, successSchema, failSchema } = params;

  const succeed = successSchema
    ? (((result) => ({
        success: true,
        result,
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['succeed'])
    : ((() => ({
        success: true,
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['succeed']);

  const fail = failSchema
    ? (((result, error) => ({
        success: false,
        result,
        ...(error ? { error } : {}),
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['fail'])
    : (((error?: string) => ({
        success: false,
        ...(error ? { error } : {}),
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['fail']);

  return {
    ...baseContext,
    succeed,
    fail,
  };
}
