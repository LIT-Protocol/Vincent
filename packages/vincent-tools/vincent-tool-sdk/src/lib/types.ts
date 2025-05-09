// src/lib/types.ts

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import {
  ContextAllowResponse,
  ContextAllowResponseNoResult,
  ContextDenyResponse,
  ContextDenyResponseNoResult,
  PolicyContext,
  YouMustCallContextAllowOrDeny,
} from './policyContext/types';

export interface PolicyResponseAllow<AllowResult> {
  ipfsCid: string;
  allow: true;
  result: AllowResult;
}

export interface PolicyResponseAllowNoResult {
  ipfsCid: string;
  allow: true;
  result?: never;
}

export interface PolicyResponseDeny<DenyResult> {
  ipfsCid: string;
  allow: false;
  result: DenyResult;
  error?: string;
}

export interface PolicyResponseDenyNoResult {
  ipfsCid: string;
  allow: false;
  error?: string;
  result: never;
}

export type PolicyResponse<AllowResult, DenyResults> =
  | (PolicyResponseAllow<AllowResult> | PolicyResponseAllowNoResult)
  | (PolicyResponseDeny<DenyResults> | PolicyResponseDenyNoResult);

// Type for the wrapped commit function that handles both with and without args
export type WrappedCommitFunction<CommitParams, Result> = CommitParams extends void
  ? () => Promise<Result> // No arguments version
  : (args: CommitParams) => Promise<Result>; // With arguments version

type EnforcePolicyResponse<T> = typeof YouMustCallContextAllowOrDeny extends keyof T
  ? T
  : {
      ERROR: 'You must return the result of context.allow() or context.deny()';
      FIX: 'Do not construct the return value manually. Use the injected context helpers.';
    };

export type EvaluateFunction<
  ToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined,
  AllowResult extends z.ZodType | undefined,
  DenyResult extends z.ZodType | undefined,
> = (
  args: {
    toolParams: z.infer<ToolParams>;
    userParams: UserParams extends z.ZodType ? z.infer<UserParams> : undefined;
  },
  ctx: PolicyContext<AllowResult, DenyResult>,
) => Promise<
  EnforcePolicyResponse<
    | (AllowResult extends z.ZodType
        ? ContextAllowResponse<z.infer<AllowResult>>
        : ContextAllowResponseNoResult)
    | (DenyResult extends z.ZodType
        ? ContextDenyResponse<z.infer<DenyResult>>
        : ContextDenyResponseNoResult)
  >
>;

export type PrecheckFunction<
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined,
  PrecheckAllowResult extends z.ZodType | undefined,
  PrecheckDenyResult extends z.ZodType | undefined,
> = (
  args: {
    toolParams: z.infer<PolicyToolParams>;
    userParams: UserParams extends z.ZodType ? z.infer<UserParams> : undefined;
  },
  context: PolicyContext<PrecheckAllowResult, PrecheckDenyResult>,
) => Promise<
  EnforcePolicyResponse<
    | (PrecheckAllowResult extends z.ZodType
        ? ContextAllowResponse<z.infer<PrecheckAllowResult>>
        : ContextAllowResponseNoResult)
    | (PrecheckDenyResult extends z.ZodType
        ? ContextDenyResponse<z.infer<PrecheckDenyResult>>
        : ContextDenyResponseNoResult)
  >
>;

export type CommitFunction<
  CommitParams extends z.ZodType | undefined,
  CommitAllowResult extends z.ZodType | undefined,
  CommitDenyResult extends z.ZodType | undefined,
> = (
  args: CommitParams extends z.ZodType ? z.infer<CommitParams> : undefined,
  context: PolicyContext<CommitAllowResult, CommitDenyResult>,
) => Promise<
  EnforcePolicyResponse<
    | (CommitAllowResult extends z.ZodType
        ? ContextAllowResponse<z.infer<CommitAllowResult>>
        : ContextAllowResponseNoResult)
    | (CommitDenyResult extends z.ZodType
        ? ContextDenyResponse<z.infer<CommitDenyResult>>
        : ContextDenyResponseNoResult)
  >
>;

export type VincentPolicy = {
  ipfsCid: string;
  packageName: string;
  evaluate?: EvaluateFunction<any, any, any, any>;
  commit?: CommitFunction<any, any, any>;
  precheck?: PrecheckFunction<any, any, any, any>;
  __vincentPolicyDef: VincentPolicyDef<
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
};

export type VincentPolicyDef<
  PackageName extends string,
  PolicyToolParams extends z.ZodType,
  // Schema generics
  UserParams extends z.ZodType | undefined = undefined,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
  EvaluateFn = EvaluateFunction<PolicyToolParams, UserParams, EvalAllowResult, EvalDenyResult>,
  PrecheckFn =
    | undefined
    | PrecheckFunction<PolicyToolParams, UserParams, PrecheckAllowResult, PrecheckDenyResult>,
  CommitFn = undefined | CommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>,
> = {
  // Schema properties
  ipfsCid: string;
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
// Tool supported policy with proper typing on the parameter mappings
export type VincentToolPolicy<
  ToolParamsSchema extends z.ZodType,
  PolicyDefType extends VincentPolicyDef<
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
  >,
  PackageName extends string = string,
> = {
  policyDef: PolicyDefType & { packageName: PackageName };
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<PolicyDefType['toolParamsSchema']>;
  }>;
};

export type PolicyEvaluationResultContext<
  Policies extends Record<
    string,
    {
      policyDef: VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>;
      __schemaTypes?: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
        evaluate?: Function;
        precheck?: Function;
        commit?: Function;
      };
    }
  >,
> = {
  evaluatedPolicies: Array<keyof Policies>;
} & (
  | {
      allow: true;
      allowedPolicies: {
        [PolicyKey in keyof Policies]?: {
          result: Policies[PolicyKey]['__schemaTypes'] extends {
            evalAllowResultSchema: infer Schema;
          }
            ? Schema extends z.ZodType
              ? z.infer<Schema>
              : never
            : never;
        };
      };
      deniedPolicy?: never;
    }
  | {
      allow: false;
      deniedPolicy: {
        packageName: keyof Policies;
        result: {
          error?: string;
        } & (Policies[Extract<keyof Policies, string>]['__schemaTypes'] extends {
          evalDenyResultSchema: infer Schema;
        }
          ? Schema extends z.ZodType
            ? z.infer<Schema>
            : undefined
          : undefined);
      };
      allowedPolicies?: {
        [PolicyKey in keyof Policies]?: {
          result: Policies[PolicyKey]['__schemaTypes'] extends {
            evalAllowResultSchema: infer Schema;
          }
            ? Schema extends z.ZodType
              ? z.infer<Schema>
              : never
            : never;
        };
      };
    }
);

export type ToolExecutionPolicyEvaluationResult<
  Policies extends Record<
    string,
    {
      policyDef: VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>;
      __schemaTypes?: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
        evaluate?: Function;
        precheck?: Function;
        commit?: Function;
      };
    }
  >,
> = {
  evaluatedPolicies: Array<keyof Policies>;
  allowedPolicies: {
    [PolicyKey in keyof Policies]?: {
      result: Policies[PolicyKey]['__schemaTypes'] extends {
        evalAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
    };
  };
};

export type ToolExecutionPolicyContext<
  Policies extends Record<
    string,
    {
      policyDef: VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>;
      __schemaTypes?: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
        evaluate?: Function;
        precheck?: Function;
        commit?: Function;
      };
    }
  >,
> = {
  evaluatedPolicies: Array<keyof Policies>;
  allow: true;
  allowedPolicies: {
    [PolicyKey in keyof Policies]?: {
      result: Policies[PolicyKey]['__schemaTypes'] extends {
        evalAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
      commit: Policies[PolicyKey]['__schemaTypes'] extends {
        commit: infer CommitFn;
      }
        ? CommitFn extends Function
          ? WrappedCommitFunction<
              Policies[PolicyKey]['__schemaTypes'] extends {
                commitParamsSchema: infer CommitParams;
              }
                ? CommitParams extends z.ZodType
                  ? z.infer<CommitParams>
                  : void
                : never, // Use 'void' instead of 'never' for no-params case
              | (Policies[PolicyKey]['__schemaTypes'] extends {
                  commitAllowResultSchema: infer CommitAllowSchema;
                }
                  ? CommitAllowSchema extends z.ZodType
                    ? ContextAllowResponse<z.infer<CommitAllowSchema>>
                    : ContextAllowResponseNoResult
                  : ContextAllowResponseNoResult)
              | (Policies[PolicyKey]['__schemaTypes'] extends {
                  commitDenyResultSchema: infer CommitDenySchema;
                }
                  ? CommitDenySchema extends z.ZodType
                    ? ContextDenyResponse<z.infer<CommitDenySchema>>
                    : ContextDenyResponseNoResult
                  : ContextDenyResponseNoResult)
            >
          : never
        : undefined;
    };
  };
} & {
  readonly deniedPolicy: never;
};

/**
 * Enforces that tool results (success/failure) must come from context helpers like `context.succeed()` or `context.fail()`.
 */
export const YouMustCallContextSucceedOrFail: unique symbol = Symbol(
  'ExecuteToolResult must come from context.succeed() or context.fail()',
);

export type PhantomToolReturnType<T> = T & {
  [YouMustCallContextSucceedOrFail]: 'ToolResponse';
};

export type EnforceToolResponse<T> = typeof YouMustCallContextSucceedOrFail extends keyof T
  ? T
  : {
      ERROR: 'You must return the result of context.succeed() or context.fail()';
      FIX: 'Do not construct tool result objects manually.';
    };

export type ToolExecutionSuccess<SuccessResult = never> = SuccessResult extends never
  ? ToolExecutionSuccessNoResult
  : PhantomToolReturnType<{
      success: true;
      result: SuccessResult;
    }>;

export type ToolExecutionSuccessNoResult = PhantomToolReturnType<{
  success: true;
  result?: never;
}>;

export type ToolExecutionFailure<FailResult = never> = FailResult extends never
  ? ToolExecutionFailureNoResult
  : PhantomToolReturnType<{
      success: false;
      result: FailResult;
      error?: string;
    }>;

export type ToolExecutionFailureNoResult = PhantomToolReturnType<{
  success: false;
  error?: string;
  result?: never;
}>;

export type ToolPrecheckSuccess<SuccessResult = never> = SuccessResult extends never
  ? ToolPrecheckSuccessNoResult
  : PhantomToolReturnType<{
      success: true;
      result: SuccessResult;
    }>;

export type ToolPrecheckSuccessNoResult = PhantomToolReturnType<{
  success: true;
  result?: never;
}>;

export type ToolPrecheckFailure<FailResult = never> = FailResult extends never
  ? ToolPrecheckFailureNoResult
  : PhantomToolReturnType<{
      success: false;
      result: FailResult;
      error?: string;
    }>;

export type ToolPrecheckFailureNoResult = PhantomToolReturnType<{
  success: false;
  error?: string;
  result?: never;
}>;

export type ToolPrecheckFunction<
  ToolParams extends z.ZodType,
  Policies,
  PrecheckSuccessSchema extends z.ZodType | undefined,
  PrecheckFailSchema extends z.ZodType | undefined,
> = (
  args: {
    toolParams: z.infer<ToolParams>;
    policiesContext: Policies;
  },
  context: ToolContext<PrecheckSuccessSchema, PrecheckFailSchema, Policies>,
) => Promise<
  EnforceToolResponse<
    | (PrecheckSuccessSchema extends z.ZodType
        ? ToolPrecheckSuccess<z.infer<PrecheckSuccessSchema>>
        : ToolPrecheckSuccessNoResult)
    | (PrecheckFailSchema extends z.ZodType
        ? ToolPrecheckFailure<z.infer<PrecheckFailSchema>>
        : ToolPrecheckFailureNoResult)
  >
>;

export type ToolExecuteFunction<
  ToolParams extends z.ZodType,
  Policies,
  ExecuteSuccessSchema extends z.ZodType | undefined,
  ExecuteFailSchema extends z.ZodType | undefined,
> = (
  args: {
    toolParams: z.infer<ToolParams>;
    policiesContext: Policies;
  },
  context: ToolContext<ExecuteSuccessSchema, ExecuteFailSchema, Policies>,
) => Promise<
  EnforceToolResponse<
    | (ExecuteSuccessSchema extends z.ZodType
        ? ToolExecutionSuccess<z.infer<ExecuteSuccessSchema>>
        : ToolExecutionSuccessNoResult)
    | (ExecuteFailSchema extends z.ZodType
        ? ToolExecutionFailure<z.infer<ExecuteFailSchema>>
        : ToolExecutionFailureNoResult)
  >
>;

export interface BaseToolContext<Policies> extends BaseContext {
  policiesContext: Policies;
}

export interface ToolContext<
  SuccessSchema extends z.ZodType | undefined = undefined,
  FailSchema extends z.ZodType | undefined = undefined,
  Policies = any,
> extends BaseToolContext<Policies> {
  succeed: SuccessSchema extends z.ZodType
    ? (result: z.infer<SuccessSchema>) => ToolExecutionSuccess<z.infer<SuccessSchema>>
    : () => ToolExecutionSuccess;

  fail: FailSchema extends z.ZodType
    ? (result: z.infer<FailSchema>, error?: string) => ToolExecutionFailure<z.infer<FailSchema>>
    : (error?: string) => ToolExecutionFailure;
}

export interface VincentToolDef<
  ToolParamsSchema extends z.ZodType,
  PolicyArray extends readonly VincentToolPolicy<
    ToolParamsSchema,
    VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>
  >[],
  PkgNames extends
    PolicyArray[number]['policyDef']['packageName'] = PolicyArray[number]['policyDef']['packageName'],
  PolicyMapType extends Record<
    string,
    {
      policyDef: VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>;
      __schemaTypes?: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
      };
    }
  > = {
    [K in PkgNames]: Extract<PolicyArray[number], { policyDef: { packageName: K } }>;
  },
  PrecheckSuccessSchema extends z.ZodType | undefined = undefined,
  PrecheckFailSchema extends z.ZodType | undefined = undefined,
  ExecuteSuccessSchema extends z.ZodType | undefined = undefined,
  ExecuteFailSchema extends z.ZodType | undefined = undefined,
  PrecheckFn =
    | undefined
    | ToolPrecheckFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PolicyMapType>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >,
  ExecuteFn = ToolExecuteFunction<
    ToolParamsSchema,
    ToolExecutionPolicyContext<PolicyMapType>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >,
> {
  toolParamsSchema: ToolParamsSchema;
  supportedPolicies: PolicyArray;
  precheckSuccessSchema?: PrecheckSuccessSchema;
  precheckFailSchema?: PrecheckFailSchema;
  executeSuccessSchema?: ExecuteSuccessSchema;
  executeFailSchema?: ExecuteFailSchema;

  precheck?: PrecheckFn;
  execute: ExecuteFn;
}

export interface BaseContext {
  delegation: {
    delegatee: string;
    delegator: string;
  };
}
