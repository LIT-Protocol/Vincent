// src/lib/toolCore/toolDef/types.ts

import { z } from 'zod';
import {
  ContextFailure,
  ContextFailureNoResult,
  ContextSuccess,
  ContextSuccessNoResult,
  EnforceToolResult,
  ToolContext,
} from './context/types';
import { PolicyEvaluationResultContext, ToolExecutionPolicyContext } from '../../types';
import { ToolPolicyMap } from '../helpers';

export type ToolDefLifecycleFunction<
  ToolParams extends z.ZodType,
  Policies,
  SuccessSchema extends z.ZodType = z.ZodUndefined,
  FailSchema extends z.ZodType = z.ZodUndefined,
> = (
  args: {
    toolParams: z.infer<ToolParams>;
    policiesContext: Policies;
  },
  context: ToolContext<SuccessSchema, FailSchema, Policies>,
) => Promise<
  EnforceToolResult<
    | (SuccessSchema extends z.ZodType
        ? ContextSuccess<z.infer<SuccessSchema>>
        : ContextSuccessNoResult)
    | (FailSchema extends z.ZodType ? ContextFailure<z.infer<FailSchema>> : ContextFailureNoResult)
  >
>;

export type VincentToolDef<
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
    | ToolDefLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PoliciesByPackageName>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >,
  ExecuteFn = ToolDefLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyContext<PoliciesByPackageName>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >,
> = {
  toolParamsSchema: ToolParamsSchema;
  policyMap: PolicyMap;

  precheckSuccessSchema?: PrecheckSuccessSchema;
  precheckFailSchema?: PrecheckFailSchema;
  executeSuccessSchema?: ExecuteSuccessSchema;
  executeFailSchema?: ExecuteFailSchema;

  precheck?: PrecheckFn;
  execute: ExecuteFn;
};
