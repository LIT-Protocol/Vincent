// types.ts
import { z } from 'zod';

interface PolicyResultBase {
  ipfsCid: string;
  allow: boolean;
  details?: string[];
}

export type PolicyResultAllow<AllowResult = never> = AllowResult extends never
  ? Omit<PolicyResultBase, 'allow'> & { allow: true; result?: never }
  : Omit<PolicyResultBase, 'allow'> & { allow: true; result: AllowResult };

export type PolicyResultDeny<DenyResult = never> = DenyResult extends never
  ? Omit<PolicyResultBase, 'allow'> & {
      allow: false;
      error?: string;
      result?: never;
    }
  : Omit<PolicyResultBase, 'allow'> & {
      allow: false;
      result: DenyResult;
      error?: string;
    };

export type PolicyResult<AllowResult = unknown, DenyResult = unknown> =
  | PolicyResultAllow<AllowResult>
  | PolicyResultDeny<DenyResult>;

export interface PolicyResultAllowNoResult extends PolicyResultBase {
  allow: true;
  result?: never;
}

export interface PolicyResultDenyNoResult extends PolicyResultBase {
  allow: false;
  error?: string;
  result?: never;
}

export type PolicyResultNoResult =
  | PolicyResultAllowNoResult
  | PolicyResultDenyNoResult;

// PolicyDef interfaces are very verbose, but the verbosity is necessary to ensure proper typing for the policy definitions,
// especially in the context of the VincentPolicyEvaluationResults dictionary, where every value has a different type.
export interface BasicPolicyDef<
  ToolParams extends z.ZodType,
  UserParams extends z.ZodType,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
> {
  ipfsCid: string;
  toolParamsSchema: ToolParams;
  userParamsSchema: UserParams;
  evalAllowResultSchema?: EvalAllowResult;
  evalDenyResultSchema?: EvalDenyResult;
  evaluate: (args: {
    toolParams: z.infer<ToolParams>;
    userParams: z.infer<UserParams>;
  }) => Promise<
    PolicyResult<
      EvalAllowResult extends z.ZodType ? z.infer<EvalAllowResult> : never,
      EvalDenyResult extends z.ZodType ? z.infer<EvalDenyResult> : never
    >
  >;
}

export interface PolicyWithPrecheck<
  ToolParams extends z.ZodType,
  UserParams extends z.ZodType,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
> extends BasicPolicyDef<
    ToolParams,
    UserParams,
    EvalAllowResult,
    EvalDenyResult
  > {
  precheckAllowResultSchema?: PrecheckAllowResult;
  precheckDenyResultSchema?: PrecheckDenyResult;
  precheck: (args: {
    toolParams: z.infer<ToolParams>;
    userParams: z.infer<UserParams>;
  }) => Promise<
    | (PrecheckAllowResult extends z.ZodType
        ? PolicyResultAllow<z.infer<PrecheckAllowResult>>
        : PolicyResultAllowNoResult)
    | (PrecheckDenyResult extends z.ZodType
        ? PolicyResultDeny<z.infer<PrecheckDenyResult>>
        : PolicyResultDenyNoResult)
  >;
}

export interface PolicyWithCommit<
  ToolParams extends z.ZodType,
  UserParams extends z.ZodType,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
> extends BasicPolicyDef<
    ToolParams,
    UserParams,
    EvalAllowResult,
    EvalDenyResult
  > {
  commitParamsSchema: NonNullable<CommitParams>;
  commitAllowResultSchema?: CommitAllowResult;
  commitDenyResultSchema?: CommitDenyResult;
  commit: (
    args: CommitParams extends z.ZodType ? z.infer<CommitParams> : never,
  ) => Promise<
    | (CommitAllowResult extends z.ZodType
        ? PolicyResultAllow<z.infer<CommitAllowResult>>
        : PolicyResultAllowNoResult)
    | (CommitDenyResult extends z.ZodType
        ? PolicyResultDeny<z.infer<CommitDenyResult>>
        : PolicyResultDenyNoResult)
  >;
}

export interface PolicyWithPrecheckAndCommit<
  ToolParams extends z.ZodType,
  UserParams extends z.ZodType,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
> extends BasicPolicyDef<
    ToolParams,
    UserParams,
    EvalAllowResult,
    EvalDenyResult
  > {
  precheckAllowResultSchema?: PrecheckAllowResult;
  precheckDenyResultSchema?: PrecheckDenyResult;
  precheck: (args: {
    toolParams: z.infer<ToolParams>;
    userParams: z.infer<UserParams>;
  }) => Promise<
    | (PrecheckAllowResult extends z.ZodType
        ? PolicyResultAllow<z.infer<PrecheckAllowResult>>
        : PolicyResultAllowNoResult)
    | (PrecheckDenyResult extends z.ZodType
        ? PolicyResultDeny<z.infer<PrecheckDenyResult>>
        : PolicyResultDenyNoResult)
  >;

  commitParamsSchema: NonNullable<CommitParams>;
  commitAllowResultSchema?: CommitAllowResult;
  commitDenyResultSchema?: CommitDenyResult;
  commit: (
    args: CommitParams extends z.ZodType ? z.infer<CommitParams> : never,
  ) => Promise<
    | (CommitAllowResult extends z.ZodType
        ? PolicyResultAllow<z.infer<CommitAllowResult>>
        : PolicyResultAllowNoResult)
    | (CommitDenyResult extends z.ZodType
        ? PolicyResultDeny<z.infer<CommitDenyResult>>
        : PolicyResultDenyNoResult)
  >;
}

// Union type for all policy definitions
// Do not be alarmed by the `any` types here -- the actual policies are still constrained by the types that make up the union
export type VincentPolicyDef =
  | BasicPolicyDef<any, any, any, any>
  | PolicyWithPrecheck<any, any, any, any, any, any>
  | PolicyWithCommit<any, any, any, any, any, any, any>
  | PolicyWithPrecheckAndCommit<any, any, any, any, any, any, any, any, any>;

// Helper type to determine if a policy has commit
export type HasCommit<P> = P extends { commit: infer CommitFn }
  ? CommitFn extends Function
    ? true
    : false
  : false;

// Tool supported policy with proper typing
export type VincentToolSupportedPolicy<
  ToolParamsSchema extends z.ZodType,
  PolicyDefType extends VincentPolicyDef,
> = {
  policyDef: PolicyDefType;
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<
      PolicyDefType['toolParamsSchema']
    >;
  }>;
};

// Policy evaluation results with proper typing for commit
export type VincentPolicyEvaluationResults<
  Policies extends Record<string, { policyDef: VincentPolicyDef }>,
> = {
  evaluatedPolicies: Array<keyof Policies>;
  allowPolicyResults: {
    [PolicyKey in keyof Policies]?: {
      result: PolicyResultAllow<any>;
    } & (HasCommit<Policies[PolicyKey]['policyDef']> extends true
      ? {
          commit: Extract<
            Policies[PolicyKey]['policyDef'],
            { commit: Function }
          >['commit'];
        }
      : {});
  };
} & (
  | { allow: true; denyPolicyResult?: never }
  | {
      allow: false;
      denyPolicyResult: {
        result: PolicyResultDeny<any>;
        ipfsCid: keyof Policies;
      };
    }
);

// Tool definition
export interface VincentToolDef<
  ToolParamsSchema extends z.ZodType,
  Policies extends Record<
    string,
    VincentToolSupportedPolicy<ToolParamsSchema, VincentPolicyDef>
  >,
> {
  toolParamsSchema: ToolParamsSchema;
  supportedPolicies: Policies;
  precheck: (
    params: z.infer<ToolParamsSchema>,
    policyEvaluationResults: VincentPolicyEvaluationResults<Policies>,
  ) => Promise<unknown>;
  execute: (
    params: z.infer<ToolParamsSchema>,
    policyEvaluationResults: VincentPolicyEvaluationResults<Policies>,
  ) => Promise<unknown>;
}
