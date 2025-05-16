// src/lib/types.ts

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, type ZodError } from 'zod';
import {
  ContextAllowResponse,
  ContextAllowResponseNoResult,
  ContextDenyResponse,
  ContextDenyResponseNoResult,
  EnforcePolicyResponse,
  PolicyContext,
} from './policyCore/policyContext/types';
import {
  ContextFailure,
  ContextFailureNoResult,
  ContextSuccess,
  ContextSuccessNoResult,
  EnforceToolResponse,
  ToolContext,
} from './toolCore/toolContext/types';
import { EnrichedVincentToolPolicy } from './toolCore/vincentTool';

export interface PolicyResponseAllow<AllowResult> {
  allow: true;
  result: AllowResult;
}

export interface PolicyResponseAllowNoResult {
  allow: true;
  result?: never;
}

export interface ZodValidationDenyResult {
  zodError: ZodError<unknown>;
}

export interface PolicyResponseDeny<DenyResult> {
  allow: false;
  error?: string;
  result: DenyResult | ZodValidationDenyResult;
}

export interface PolicyResponseDenyNoResult {
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

export type PolicyLifecycleFunction<
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

export type InferOrUndefined<T> = T extends z.ZodType ? z.infer<T> : undefined;

export type VincentPolicyDef<
  PackageName extends string,
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
  EvaluateFn = PolicyLifecycleFunction<
    PolicyToolParams,
    UserParams,
    EvalAllowResult,
    EvalDenyResult
  >,
  PrecheckFn =
    | undefined
    | PolicyLifecycleFunction<
        PolicyToolParams,
        UserParams,
        PrecheckAllowResult,
        PrecheckDenyResult
      >,
  CommitFn = undefined | CommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>,
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
// Tool supported policy with proper typing on the parameter mappings
export type VincentToolPolicy<
  ToolParamsSchema extends z.ZodType,
  PolicyDefType extends VincentPolicy<any, any, any, any, any, any, any, any, any, any>,
  PackageName extends string = string,
> = {
  vincentPolicy: PolicyDefType & { packageName: PackageName };
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<PolicyDefType['toolParamsSchema']>;
  }>;
};

export type VincentPolicy<
  PackageName extends string,
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
> = {
  packageName: PackageName;
  toolParamsSchema: PolicyToolParams;
  userParamsSchema?: UserParams;
  precheckAllowResultSchema?: PrecheckAllowResult;
  precheckDenyResultSchema?: PrecheckDenyResult;
  evalAllowResultSchema?: EvalAllowResult;
  evalDenyResultSchema?: EvalDenyResult;
  commitParamsSchema?: CommitParams;
  commitAllowResultSchema?: CommitAllowResult;
  commitDenyResultSchema?: CommitDenyResult;

  precheck?: (
    args: {
      toolParams: z.infer<PolicyToolParams>;
      userParams: InferOrUndefined<UserParams>;
    },
    baseContext: BaseContext,
  ) => Promise<
    | (PrecheckAllowResult extends z.ZodType
        ? PolicyResponseAllow<z.infer<PrecheckAllowResult>>
        : PolicyResponseAllowNoResult)
    | (PrecheckDenyResult extends z.ZodType
        ? PolicyResponseDeny<z.infer<PrecheckDenyResult>>
        : PolicyResponseDenyNoResult)
  >;

  evaluate: (
    args: {
      toolParams: z.infer<PolicyToolParams>;
      userParams: InferOrUndefined<UserParams>;
    },
    baseContext: BaseContext,
  ) => Promise<
    | (EvalAllowResult extends z.ZodType
        ? PolicyResponseAllow<z.infer<EvalAllowResult>>
        : PolicyResponseAllowNoResult)
    | (EvalDenyResult extends z.ZodType
        ? PolicyResponseDeny<z.infer<EvalDenyResult>>
        : PolicyResponseDenyNoResult)
  >;

  commit?: (
    args: InferOrUndefined<CommitParams>,
    baseContext: BaseContext,
  ) => Promise<
    | (CommitAllowResult extends z.ZodType
        ? PolicyResponseAllow<z.infer<CommitAllowResult>>
        : PolicyResponseAllowNoResult)
    | (CommitDenyResult extends z.ZodType
        ? PolicyResponseDeny<z.infer<CommitDenyResult>>
        : PolicyResponseDenyNoResult)
  >;
};

export type PolicyEvaluationResultContext<
  Policies extends Record<
    string,
    {
      vincentPolicy: VincentPolicy<any, any, any, any, any, any, any, any, any, any>;
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
      vincentPolicy: VincentPolicy<any, any, any, any, any, any, any, any, any, any>;
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
      vincentPolicy: VincentPolicy<any, any, any, any, any, any, any, any, any, any>;
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
  readonly deniedPolicy?: never;
};

export interface ToolResponseSuccess<SuccessResult = never> {
  success: true;
  result: SuccessResult;
}

export interface ToolResponseSuccessNoResult {
  success: true;
  result?: never;
}

export interface ToolResponseFailure<FailResult = never> {
  success: false;
  result: FailResult | ZodValidationDenyResult;
  error?: string;
}

export interface ToolResponseFailureNoResult {
  success: false;
  error?: string;
  result?: never;
}
export type ToolResponse<SucceedResult, FailResults> =
  | (ToolResponseSuccess<SucceedResult> | ToolResponseSuccessNoResult)
  | (ToolResponseFailure<FailResults> | ToolResponseFailureNoResult);

export type ToolLifecycleFunction<
  ToolParams extends z.ZodType,
  Policies,
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
> = (
  args: {
    toolParams: z.infer<ToolParams>;
    policiesContext: Policies;
  },
  context: ToolContext<SuccessSchema, FailSchema, Policies>,
) => Promise<
  EnforceToolResponse<
    | (SuccessSchema extends z.ZodType
        ? ContextSuccess<z.infer<SuccessSchema>>
        : ContextSuccessNoResult)
    | (FailSchema extends z.ZodType ? ContextFailure<z.infer<FailSchema>> : ContextFailureNoResult)
  >
>;

export interface VincentToolDef<
  ToolParamsSchema extends z.ZodType,
  PolicyArray extends readonly VincentToolPolicy<
    ToolParamsSchema,
    VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>
  >[],
  PkgNames extends
    PolicyArray[number]['vincentPolicy']['packageName'] = PolicyArray[number]['vincentPolicy']['packageName'],
  PolicyMapType extends Record<string, EnrichedVincentToolPolicy> = {
    [K in PkgNames]: Extract<PolicyArray[number], { vincentPolicy: { packageName: K } }>;
  },
  PrecheckSuccessSchema extends z.ZodType | undefined = undefined,
  PrecheckFailSchema extends z.ZodType | undefined = undefined,
  ExecuteSuccessSchema extends z.ZodType | undefined = undefined,
  ExecuteFailSchema extends z.ZodType | undefined = undefined,
  PrecheckFn =
    | ToolLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PolicyMapType>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >
    | undefined,
  ExecuteFn = ToolLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyContext<PolicyMapType>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >,
> {
  packageName: string;
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
