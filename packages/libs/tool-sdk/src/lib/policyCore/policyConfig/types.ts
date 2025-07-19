import type { z } from 'zod';

import type {
  ContextAllowResponse,
  ContextAllowResponseNoResult,
  ContextDenyResponse,
  ContextDenyResponseNoResult,
  EnforcePolicyResponse,
  PolicyContext,
} from './context/types';

/** `evaluate()` and `precheck()` functions that you define when using `createVincentPolicy()` will match this function signature.
 * Note that the arguments and return types are inferred based on the ZOD schemas that you pass to `createVincentPolicy`
 *
 * @category Interfaces
 */
export type PolicyConfigLifecycleFunction<
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

/** Unlike `evaluate()` and `precheck()`, commit receives specific arguments provided by the tool during its `execute()` phase
 * instead of than `toolParams` and `userParams` that the tool was called with.
 *
 * @category Interfaces
 */
export type PolicyConfigCommitFunction<
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

/**
 * @typeParam PackageName {@removeTypeParameterCompletely}
 * @typeParam PolicyToolParams {@removeTypeParameterCompletely}
 * @typeParam UserParams {@removeTypeParameterCompletely}
 * @typeParam PrecheckAllowResult {@removeTypeParameterCompletely}
 * @typeParam PrecheckDenyResult {@removeTypeParameterCompletely}
 * @typeParam EvalAllowResult {@removeTypeParameterCompletely}
 * @typeParam EvalDenyResult {@removeTypeParameterCompletely}
 * @typeParam CommitParams {@removeTypeParameterCompletely}
 * @typeParam CommitAllowResult {@removeTypeParameterCompletely}
 * @typeParam CommitDenyResult {@removeTypeParameterCompletely}
 * @typeParam CommitDenyResult {@removeTypeParameterCompletely}
 */
export type VincentPolicyConfig<
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
  EvaluateFn = PolicyConfigLifecycleFunction<
    PolicyToolParams,
    UserParams,
    EvalAllowResult,
    EvalDenyResult
  >,
  PrecheckFn =
    | undefined
    | PolicyConfigLifecycleFunction<
        PolicyToolParams,
        UserParams,
        PrecheckAllowResult,
        PrecheckDenyResult
      >,
  CommitFn =
    | undefined
    | PolicyConfigCommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>,
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
