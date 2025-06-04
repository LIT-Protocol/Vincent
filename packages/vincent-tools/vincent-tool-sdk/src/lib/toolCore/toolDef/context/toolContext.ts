// src/lib/toolCore/toolDef/context/toolContext.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import type {
  PolicyEvaluationResultContext,
  ToolExecutionPolicyContext,
  ToolExecutionPolicyEvaluationResult,
  VincentPolicy,
} from '../../../types';

import type { BaseToolContext, ToolContext } from './types';

import {
  createSuccess,
  createSuccessNoResult,
  createFailure,
  createFailureNoResult,
} from './resultCreators';

/**
 * Builds an execution-time ToolContext for use inside `execute()` lifecycle methods.
 * It upgrades the incoming external policy context with `commit()` methods derived
 * from the tool's supported policies and schema definitions. Ensures commit calls
 * are fully typed and validated internally.
 */
export function createExecutionToolContext<
  PolicyMapByPackageName extends Record<string, any>,
  SuccessSchema extends z.ZodType = z.ZodUndefined,
  FailSchema extends z.ZodType = z.ZodUndefined,
>(params: {
  baseContext: BaseToolContext<ToolExecutionPolicyEvaluationResult<PolicyMapByPackageName>>;
  successSchema?: SuccessSchema;
  failSchema?: FailSchema;
  supportedPolicies: PolicyMapByPackageName;
}): ToolContext<SuccessSchema, FailSchema, ToolExecutionPolicyContext<PolicyMapByPackageName>> {
  const { baseContext, successSchema, failSchema, supportedPolicies } = params;

  const succeed = successSchema ? createSuccess : createSuccessNoResult;
  const fail = failSchema ? createFailure : createFailureNoResult;

  const allowedPolicies =
    {} as ToolExecutionPolicyContext<PolicyMapByPackageName>['allowedPolicies'];

  for (const key of Object.keys(supportedPolicies)) {
    const k = key as keyof PolicyMapByPackageName;
    const entry = baseContext.policiesContext.allowedPolicies[k];
    const policyDef = supportedPolicies[k]?.vincentPolicy;

    if (!entry) continue;

    if (typeof policyDef?.commit === 'function') {
      (allowedPolicies as any)[k] = {
        ...entry,
        commit: policyDef.commit,
      };
    } else {
      (allowedPolicies as any)[k] = {
        ...entry,
      };
    }
  }

  const upgradedPoliciesContext: ToolExecutionPolicyContext<PolicyMapByPackageName> = {
    evaluatedPolicies: baseContext.policiesContext.evaluatedPolicies,
    allow: true,
    deniedPolicy: undefined as never,
    allowedPolicies,
  };

  return {
    ...baseContext,
    policiesContext: upgradedPoliciesContext,
    succeed: succeed as ToolContext<SuccessSchema, FailSchema>['succeed'],
    fail: fail as ToolContext<SuccessSchema, FailSchema>['fail'],
  };
}

/**
 * Builds a precheck-time ToolContext for use inside `precheck()` lifecycle methods.
 * It includes only the evaluated policy metadata and denies commit access,
 * ensuring developers don’t call commit prematurely. Enforces policy result typing.
 */
export function createPrecheckToolContext<
  PolicyMap extends Record<
    string,
    {
      __schemaTypes: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
      };
      vincentPolicy: VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any, any>;
    }
  >,
  SuccessSchema extends z.ZodType = z.ZodUndefined,
  FailSchema extends z.ZodType = z.ZodUndefined,
>(params: {
  baseContext: BaseToolContext<PolicyEvaluationResultContext<PolicyMap>>;
  successSchema?: SuccessSchema;
  failSchema?: FailSchema;
}): ToolContext<SuccessSchema, FailSchema, PolicyEvaluationResultContext<PolicyMap>> {
  const { baseContext, successSchema, failSchema } = params;

  const succeed = successSchema ? createSuccess : createSuccessNoResult;
  const fail = failSchema ? createFailure : createFailureNoResult;

  return {
    ...baseContext,
    succeed: succeed as ToolContext<SuccessSchema, FailSchema, any>['succeed'],
    fail: fail as ToolContext<SuccessSchema, FailSchema, any>['fail'],
  };
}
