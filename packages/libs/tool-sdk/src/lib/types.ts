// src/lib/types.ts

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { z, ZodError } from 'zod';

import type { ToolPolicyMap } from './toolCore/helpers';
import type { BaseToolContext } from './toolCore/toolConfig/context/types';

export interface PolicyResponseAllow<AllowResult> {
  allow: true;
  result: AllowResult;
}

export interface PolicyResponseAllowNoResult {
  allow: true;
  result?: never;
}

export interface SchemaValidationError {
  zodError: ZodError<unknown>;
  phase: string;
  stage: string;
}

export interface PolicyResponseDeny<DenyResult> {
  allow: false;
  runtimeError?: string;
  result: DenyResult;
  schemaValidationError?: SchemaValidationError;
}

export interface PolicyResponseDenyNoResult {
  allow: false;
  runtimeError?: string;
  result: never;
  schemaValidationError?: SchemaValidationError;
}

export type PolicyResponse<
  AllowResult extends z.ZodType | undefined,
  DenyResult extends z.ZodType | undefined,
> =
  | (AllowResult extends z.ZodType
      ? PolicyResponseAllow<z.infer<AllowResult>>
      : PolicyResponseAllowNoResult)
  | (DenyResult extends z.ZodType
      ? PolicyResponseDeny<z.infer<DenyResult>>
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
      ? PolicyResponseDeny<z.infer<DenyResult>>
      : PolicyResponseDenyNoResult)
>;

export type InferOrUndefined<T> = T extends z.ZodType ? z.infer<T> : undefined;

// Tool supported policy with proper typing on the parameter mappings
/** @hidden */
export type VincentToolPolicy<
  ToolParamsSchema extends z.ZodType,
  VP extends VincentPolicy<any, any, any, any, any, any, any, any, any, any, any, any, any>,
  VincentToolApiVersion extends string = string,
  PackageName extends string = string,
  IpfsCid extends string = string,
> = {
  ipfsCid: IpfsCid;
  /** @hidden */
  vincentToolApiVersion: VincentToolApiVersion;
  vincentPolicy: VP & { packageName: PackageName };
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<VP['toolParamsSchema']>;
  }>;
  /** @hidden */
  __schemaTypes: {
    policyToolParamsSchema: VP['toolParamsSchema'];
    userParamsSchema?: VP['userParamsSchema'];
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
      ? PolicyResponseDeny<z.infer<CommitDenyResult>>
      : PolicyResponseDenyNoResult)
>;

/** @inline */
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

/** @hidden */
export type PolicyEvaluationResultContext<
  Policies extends Record<
    string,
    {
      vincentPolicy: VincentPolicy<any, any, any, any, any, any, any, any, any, any>;
      /** @hidden */
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
        runtimeError?: string;
        schemaValidationError?: SchemaValidationError;
        packageName: keyof Policies;
        result: Policies[Extract<keyof Policies, string>]['__schemaTypes'] extends {
          evalDenyResultSchema: infer Schema;
        }
          ? Schema extends z.ZodType
            ? z.infer<Schema>
            : undefined
          : undefined;
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
      /** @hidden */
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
      /** @hidden */
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
  result: FailResult;
  runtimeError?: string;
  schemaValidationError?: SchemaValidationError;
}

export interface ToolResultFailureNoResult {
  success: false;
  runtimeError?: string;
  result?: never;
  schemaValidationError?: SchemaValidationError;
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

/**
 *
 * @typeParam ToolParamsSchema {@removeTypeParameterCompletely}
 * @typeParam PkgNames {@removeTypeParameterCompletely}
 * @typeParam PolicyMap {@removeTypeParameterCompletely}
 * @typeParam PoliciesByPackageName {@removeTypeParameterCompletely}
 * @typeParam ExecuteSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam ExecuteFailSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckFailSchema {@removeTypeParameterCompletely}
 * @typeParam ExecuteFn {@removeTypeParameterCompletely}
 * @typeParam PrecheckFn {@removeTypeParameterCompletely}
 *
 * @category Interfaces
 */
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
  packageName: string;
  toolDescription: string;
  precheck?: PrecheckFn;
  execute: ExecuteFn;
  toolParamsSchema: ToolParamsSchema;
  supportedPolicies: PolicyMap;
  /** @hidden */
  __schemaTypes: {
    executeSuccessSchema?: ExecuteSuccessSchema;
    executeFailSchema?: ExecuteFailSchema;
    precheckSuccessSchema?: PrecheckSuccessSchema;
    precheckFailSchema?: PrecheckFailSchema;
  };
};

/** @hidden */
export interface ToolConsumerContext {
  delegatorPkpEthAddress: string;
}

/** @hidden */
export interface PolicyConsumerContext {
  delegatorPkpEthAddress: string;
  toolIpfsCid: string; // FIXME: This will be removed when we have shipped lit action ipfs cids stack
}

/** @hidden */
export interface BaseContext {
  toolIpfsCid: string;
  appId: number;
  appVersion: number;
  delegation: {
    delegateeAddress: string;
    delegatorPkpInfo: {
      tokenId: string;
      ethAddress: string;
      publicKey: string;
    };
  };
}
