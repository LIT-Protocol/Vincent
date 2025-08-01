// src/lib/abilityCore/abilityConfig/types.ts

import type { z } from 'zod';

import type { PolicyEvaluationResultContext, AbilityExecutionPolicyContext } from '../../types';
import type { AbilityPolicyMap } from '../helpers';
import type {
  ContextFailure,
  ContextSuccess,
  EnforceAbilityResult,
  AbilityContext,
} from './context/types';

export type AbilityConfigLifecycleFunction<
  AbilityParams extends z.ZodType,
  Policies,
  SuccessSchema extends z.ZodType = z.ZodUndefined,
  FailSchema extends z.ZodType = z.ZodUndefined,
> = (
  args: {
    abilityParams: z.infer<AbilityParams>;
  },
  context: AbilityContext<SuccessSchema, FailSchema, Policies>,
) => Promise<
  EnforceAbilityResult<ContextSuccess<z.infer<SuccessSchema>> | ContextFailure<z.infer<FailSchema>>>
>;

export type VincentAbilityConfig<
  AbilityParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends AbilityPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFn =
    | undefined
    | AbilityConfigLifecycleFunction<
        AbilityParamsSchema,
        PolicyEvaluationResultContext<PoliciesByPackageName>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >,
  ExecuteFn = AbilityConfigLifecycleFunction<
    AbilityParamsSchema,
    AbilityExecutionPolicyContext<PoliciesByPackageName>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >,
> = {
  packageName: string;
  abilityDescription: string;

  abilityParamsSchema: AbilityParamsSchema;
  supportedPolicies: PolicyMap;

  precheckSuccessSchema?: PrecheckSuccessSchema;
  precheckFailSchema?: PrecheckFailSchema;
  executeSuccessSchema?: ExecuteSuccessSchema;
  executeFailSchema?: ExecuteFailSchema;

  precheck?: PrecheckFn;
  execute: ExecuteFn;
};
