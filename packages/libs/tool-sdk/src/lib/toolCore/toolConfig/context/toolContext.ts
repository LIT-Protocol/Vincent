// src/lib/toolCore/toolConfig/context/toolContext.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from 'zod';

import type {
  PolicyEvaluationResultContext,
  ToolExecutionPolicyContext,
  ToolExecutionPolicyEvaluationResult,
  VincentPolicy,
} from '../../../types';
import type { BaseToolContext, ToolContext } from './types';

import { createSuccess, createFailure } from './resultCreators';

/**
 * Builds an execution-time ToolContext for use inside `execute()` lifecycle methods.
 * It upgrades the incoming external policy context with `commit()` methods derived
 * from the tool's supported policies and schema definitions. Ensures commit calls
 * are fully typed and validated internally.
 */
export function createExecutionToolContext<
  PolicyMapByPackageName extends Record<string, any>,
>(params: {
  baseContext: BaseToolContext<ToolExecutionPolicyEvaluationResult<PolicyMapByPackageName>>;
  policiesByPackageName: PolicyMapByPackageName;
}): ToolContext<any, any, ToolExecutionPolicyContext<PolicyMapByPackageName>> {
  const { baseContext, policiesByPackageName } = params;

  const allowedPolicies =
    {} as ToolExecutionPolicyContext<PolicyMapByPackageName>['allowedPolicies'];

  for (const key of Object.keys(policiesByPackageName)) {
    const k = key as keyof PolicyMapByPackageName;
    const entry = baseContext.policiesContext.allowedPolicies[k];

    if (!entry) continue;

    (allowedPolicies as any)[k] = {
      ...entry,
    };
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
    succeed: createSuccess as ToolContext<any, any, PolicyMapByPackageName>['succeed'],
    fail: createFailure as ToolContext<any, any, PolicyMapByPackageName>['fail'],
  };
}

/**
 * Builds a precheck-time ToolContext for use inside `precheck()` lifecycle methods.
 * It includes only the evaluated policy metadata and denies commit access,
 * ensuring developers don’t call commit prematurely. Enforces policy result typing.
 */
export function createPrecheckToolContext<
  PolicyMapByPackageName extends Record<
    string,
    {
      __schemaTypes: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
      };
      vincentPolicy: VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any, any>;
    }
  >,
>(params: {
  baseContext: BaseToolContext<PolicyEvaluationResultContext<PolicyMapByPackageName>>;
}): ToolContext<any, any, PolicyEvaluationResultContext<PolicyMapByPackageName>> {
  const { baseContext } = params;

  return {
    ...baseContext,
    succeed: createSuccess as ToolContext<any, any, PolicyMapByPackageName>['succeed'],
    fail: createFailure as ToolContext<any, any, PolicyMapByPackageName>['fail'],
  };
}
