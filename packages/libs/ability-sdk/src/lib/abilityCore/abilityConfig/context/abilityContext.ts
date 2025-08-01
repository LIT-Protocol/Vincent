// src/lib/abilityCore/abilityConfig/context/abilityContext.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z } from 'zod';

import type {
  PolicyEvaluationResultContext,
  AbilityExecutionPolicyContext,
  AbilityExecutionPolicyEvaluationResult,
  VincentPolicy,
} from '../../../types';
import type { BaseAbilityContext, AbilityContext } from './types';

import { createSuccess, createFailure } from './resultCreators';

/**
 * Builds an execution-time AbilityContext for use inside `execute()` lifecycle methods.
 * It upgrades the incoming external policy context with `commit()` methods derived
 * from the ability's supported policies and schema definitions. Ensures commit calls
 * are fully typed and validated internally.
 */
export function createExecutionAbilityContext<
  PolicyMapByPackageName extends Record<string, any>,
>(params: {
  baseContext: BaseAbilityContext<AbilityExecutionPolicyEvaluationResult<PolicyMapByPackageName>>;
  policiesByPackageName: PolicyMapByPackageName;
}): AbilityContext<any, any, AbilityExecutionPolicyContext<PolicyMapByPackageName>> {
  const { baseContext, policiesByPackageName } = params;

  const allowedPolicies =
    {} as AbilityExecutionPolicyContext<PolicyMapByPackageName>['allowedPolicies'];

  for (const key of Object.keys(policiesByPackageName)) {
    const k = key as keyof PolicyMapByPackageName;
    const entry = baseContext.policiesContext.allowedPolicies[k];

    if (!entry) continue;

    (allowedPolicies as any)[k] = {
      ...entry,
    };
  }

  const upgradedPoliciesContext: AbilityExecutionPolicyContext<PolicyMapByPackageName> = {
    evaluatedPolicies: baseContext.policiesContext.evaluatedPolicies,
    allow: true,
    deniedPolicy: undefined as never,
    allowedPolicies,
  };

  return {
    ...baseContext,
    policiesContext: upgradedPoliciesContext,
    succeed: createSuccess as AbilityContext<any, any, PolicyMapByPackageName>['succeed'],
    fail: createFailure as AbilityContext<any, any, PolicyMapByPackageName>['fail'],
  };
}

/**
 * Builds a precheck-time AbilityContext for use inside `precheck()` lifecycle methods.
 * It includes only the evaluated policy metadata and denies commit access,
 * ensuring developers don’t call commit prematurely. Enforces policy result typing.
 */
export function createPrecheckAbilityContext<
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
  baseContext: BaseAbilityContext<PolicyEvaluationResultContext<PolicyMapByPackageName>>;
}): AbilityContext<any, any, PolicyEvaluationResultContext<PolicyMapByPackageName>> {
  const { baseContext } = params;

  return {
    ...baseContext,
    succeed: createSuccess as AbilityContext<any, any, PolicyMapByPackageName>['succeed'],
    fail: createFailure as AbilityContext<any, any, PolicyMapByPackageName>['fail'],
  };
}
