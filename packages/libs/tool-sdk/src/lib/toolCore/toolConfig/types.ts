// src/lib/toolCore/toolConfig/types.ts

import { z } from 'zod';
import { ContextFailure, ContextSuccess, EnforceToolResult, ToolContext } from './context/types';
import { PolicyEvaluationResultContext, ToolExecutionPolicyContext } from '../../types';
import { ToolPolicyMap } from '../helpers';

export type ToolConfigLifecycleFunction<
  ToolParams extends z.ZodType,
  Policies,
  SuccessSchema extends z.ZodType = z.ZodUndefined,
  FailSchema extends z.ZodType = z.ZodUndefined,
> = (
  args: {
    toolParams: z.infer<ToolParams>;
  },
  context: ToolContext<SuccessSchema, FailSchema, Policies>,
) => Promise<
  EnforceToolResult<ContextSuccess<z.infer<SuccessSchema>> | ContextFailure<z.infer<FailSchema>>>
>;

export type VincentToolConfig<
  ToolParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFn =
    | undefined
    | ToolConfigLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PoliciesByPackageName>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >,
  ExecuteFn = ToolConfigLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyContext<PoliciesByPackageName>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >,
> = {
  packageName: string;
  toolDescription: string;

  toolParamsSchema: ToolParamsSchema;
  supportedPolicies: PolicyMap;

  precheckSuccessSchema?: PrecheckSuccessSchema;
  precheckFailSchema?: PrecheckFailSchema;
  executeSuccessSchema?: ExecuteSuccessSchema;
  executeFailSchema?: ExecuteFailSchema;

  precheck?: PrecheckFn;
  execute: ExecuteFn;
};
