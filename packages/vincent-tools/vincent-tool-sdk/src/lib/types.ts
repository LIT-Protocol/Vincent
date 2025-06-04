// src/lib/types.ts

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, type ZodError } from 'zod';
import { BaseToolContext } from './toolCore/toolDef/context/types';
import { ToolPolicyMap } from './toolCore/helpers';

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

export type PolicyResponse<
  AllowResult extends z.ZodType | undefined,
  DenyResult extends z.ZodType | undefined,
> =
  | (AllowResult extends z.ZodType
      ? PolicyResponseAllow<z.infer<AllowResult>>
      : PolicyResponseAllowNoResult)
  | (DenyResult extends z.ZodType
      ? PolicyResponseDeny<z.infer<DenyResult> | ZodValidationDenyResult>
      : PolicyResponseDenyNoResult);

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
  ctx: BaseContext,
) => Promise<
  | (AllowResult extends z.ZodType
      ? PolicyResponseAllow<z.infer<AllowResult>>
      : PolicyResponseAllowNoResult)
  | (DenyResult extends z.ZodType
      ? PolicyResponseDeny<z.infer<DenyResult> | ZodValidationDenyResult>
      : PolicyResponseDenyNoResult)
>;

export type InferOrUndefined<T> = T extends z.ZodType ? z.infer<T> : undefined;

// Tool supported policy with proper typing on the parameter mappings
export type VincentToolPolicy<
  ToolParamsSchema extends z.ZodType,
  VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any>,
  PackageName extends string = string,
  IpfsCid extends string = string,
> = {
  ipfsCid: IpfsCid;
  vincentPolicy: VP & { packageName: PackageName };
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<VP['toolParamsSchema']>;
  }>;
  __schemaTypes: {
    evalAllowResultSchema?: VP['evalAllowResultSchema'];
    evalDenyResultSchema?: VP['evalDenyResultSchema'];
    precheckAllowResultSchema?: VP['precheckAllowResultSchema'];
    precheckDenyResultSchema?: VP['precheckDenyResultSchema'];
    commitParamsSchema?: VP['commitParamsSchema'];
    commitAllowResultSchema?: VP['commitAllowResultSchema'];
    commitDenyResultSchema?: VP['commitDenyResultSchema'];
    evaluate: VP['evaluate'];
    precheck?: VP['precheck'];
    commit?: VP['commit'];
  };
};

export type CommitLifecycleFunction<
  CommitParams extends z.ZodType | undefined,
  CommitAllowResult extends z.ZodType | undefined,
  CommitDenyResult extends z.ZodType | undefined,
> = (
  args: CommitParams extends z.ZodType ? z.infer<CommitParams> : undefined,
  ctx: BaseContext,
) => Promise<
  | (CommitAllowResult extends z.ZodType
      ? PolicyResponseAllow<z.infer<CommitAllowResult>>
      : PolicyResponseAllowNoResult)
  | (CommitDenyResult extends z.ZodType
      ? PolicyResponseDeny<z.infer<CommitDenyResult> | ZodValidationDenyResult>
      : PolicyResponseDenyNoResult)
>;

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
  CommitFn = undefined | CommitLifecycleFunction<CommitParams, CommitAllowResult, CommitDenyResult>,
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
  evaluate: EvaluateFn;
  precheck?: PrecheckFn;
  commit?: CommitFn;
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
                    ? PolicyResponseAllow<z.infer<CommitAllowSchema>>
                    : PolicyResponseAllowNoResult
                  : PolicyResponseAllowNoResult)
              | (Policies[PolicyKey]['__schemaTypes'] extends {
                  commitDenyResultSchema: infer CommitDenySchema;
                }
                  ? CommitDenySchema extends z.ZodType
                    ? PolicyResponseDeny<z.infer<CommitDenySchema>>
                    : PolicyResponseDenyNoResult
                  : PolicyResponseDenyNoResult)
            >
          : never
        : undefined;
    };
  };
} & {
  readonly deniedPolicy?: never;
};

export interface ToolResultSuccess<SuccessResult = never> {
  success: true;
  result: SuccessResult;
}

export interface ToolResultSuccessNoResult {
  success: true;
  result?: never;
}

export interface ToolResultFailure<FailResult = never> {
  success: false;
  result: FailResult | ZodValidationDenyResult;
  error?: string;
}

export interface ToolResultFailureNoResult {
  success: false;
  error?: string;
  result?: never;
}
export type ToolResult<SucceedResult, FailResults> =
  | (ToolResultSuccess<SucceedResult> | ToolResultSuccessNoResult)
  | (ToolResultFailure<FailResults> | ToolResultFailureNoResult);

export type ToolLifecycleFunction<
  ToolParamsSchema extends z.ZodType,
  Policies,
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
> = (
  params: {
    toolParams: z.infer<ToolParamsSchema>;
  },
  context: BaseToolContext<Policies>,
) => Promise<ToolResult<SuccessSchema, FailSchema>>;

export type VincentTool<
  ToolParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
  ExecuteSuccessSchema extends z.ZodType | undefined = undefined,
  ExecuteFailSchema extends z.ZodType | undefined = undefined,
  PrecheckSuccessSchema extends z.ZodType | undefined = undefined,
  PrecheckFailSchema extends z.ZodType | undefined = undefined,
  ExecuteFn = ToolLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyContext<PoliciesByPackageName>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >,
  PrecheckFn =
    | undefined
    | ToolLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PoliciesByPackageName>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >,
> = {
  precheck?: PrecheckFn;
  execute: ExecuteFn;
  toolParamsSchema: ToolParamsSchema;
  policyMap: PolicyMap;
  __schemaTypes: {
    executeSuccessSchema?: ExecuteSuccessSchema;
    executeFailSchema?: ExecuteFailSchema;
    precheckSuccessSchema?: PrecheckSuccessSchema;
    precheckFailSchema?: PrecheckFailSchema;
  };
};

export interface BaseContext {
  delegation: {
    delegatee: string;
    delegator: string;
  };
}
