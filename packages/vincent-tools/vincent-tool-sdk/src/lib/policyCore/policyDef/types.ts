import { z } from 'zod';
import {
  ContextAllowResponse,
  ContextAllowResponseNoResult,
  ContextDenyResponse,
  ContextDenyResponseNoResult,
  EnforcePolicyResponse,
  PolicyContext,
} from './context/types';

export type PolicyDefLifecycleFunction<
  ToolParams extends z.ZodType,
  UserParams extends z.ZodType = z.ZodUndefined,
  AllowResult extends z.ZodType = z.ZodUndefined,
  DenyResult extends z.ZodType = z.ZodUndefined,
> = (
  args: {
    toolParams: z.infer<ToolParams>;
    userParams: z.infer<UserParams>;
  },
  ctx: PolicyContext<AllowResult, DenyResult>,
) => Promise<
  EnforcePolicyResponse<
    | (AllowResult extends z.ZodUndefined
        ? ContextAllowResponseNoResult
        : ContextAllowResponse<z.infer<AllowResult>>)
    | (DenyResult extends z.ZodUndefined
        ? ContextDenyResponseNoResult
        : ContextDenyResponse<z.infer<DenyResult>>)
  >
>;
export type PolicyDefCommitFunction<
  CommitParams extends z.ZodType = z.ZodUndefined,
  CommitAllowResult extends z.ZodType = z.ZodUndefined,
  CommitDenyResult extends z.ZodType = z.ZodUndefined,
> = (
  args: CommitParams extends z.ZodType ? z.infer<CommitParams> : undefined,
  context: PolicyContext<CommitAllowResult, CommitDenyResult>,
) => Promise<
  EnforcePolicyResponse<
    | (CommitAllowResult extends z.ZodUndefined
        ? ContextAllowResponseNoResult
        : ContextAllowResponse<z.infer<CommitAllowResult>>)
    | (CommitDenyResult extends z.ZodUndefined
        ? ContextDenyResponseNoResult
        : ContextDenyResponse<z.infer<CommitDenyResult>>)
  >
>;

export type VincentPolicyDef<
  PackageName extends string,
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType = z.ZodUndefined,
  PrecheckAllowResult extends z.ZodType = z.ZodUndefined,
  PrecheckDenyResult extends z.ZodType = z.ZodUndefined,
  EvalAllowResult extends z.ZodType = z.ZodUndefined,
  EvalDenyResult extends z.ZodType = z.ZodUndefined,
  CommitParams extends z.ZodType = z.ZodUndefined,
  CommitAllowResult extends z.ZodType = z.ZodUndefined,
  CommitDenyResult extends z.ZodType = z.ZodUndefined,
  EvaluateFn = PolicyDefLifecycleFunction<
    PolicyToolParams,
    UserParams,
    EvalAllowResult,
    EvalDenyResult
  >,
  PrecheckFn =
    | undefined
    | PolicyDefLifecycleFunction<
        PolicyToolParams,
        UserParams,
        PrecheckAllowResult,
        PrecheckDenyResult
      >,
  CommitFn = undefined | PolicyDefCommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>,
> = {
  packageName: PackageName;
  toolParamsSchema: PolicyToolParams;
  userParamsSchema?: UserParams;
  evalAllowResultSchema?: EvalAllowResult;
  evalDenyResultSchema?: EvalDenyResult;
  precheckAllowResultSchema?: PrecheckAllowResult;
  precheckDenyResultSchema?: PrecheckDenyResult;
  commitParamsSchema?: CommitParams;
  commitAllowResultSchema?: CommitAllowResult;
  commitDenyResultSchema?: CommitDenyResult;

  // Function properties - now directly using the function generic types
  evaluate: EvaluateFn;
  precheck?: PrecheckFn;
  commit?: CommitFn;
};
