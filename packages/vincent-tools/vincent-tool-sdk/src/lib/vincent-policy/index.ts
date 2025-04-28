import z from 'zod';
import {
  PolicyResult,
  PolicyResultAllow,
  PolicyResultAllowNoResult,
  PolicyResultDeny,
  PolicyResultDenyNoResult,
} from '../types';

export function validateVincentPolicyDef<
  ToolParamsSchema extends z.ZodType,
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
>(config: {
  toolParamsSchema: ToolParamsSchema;
  policyDef: {
    ipfsCid: string;
    toolParamsSchema: PolicyToolParams;
    userParamsSchema: UserParams;
    evalAllowResultSchema?: EvalAllowResult;
    evalDenyResultSchema?: EvalDenyResult;
    precheckAllowResultSchema?: PrecheckAllowResult;
    precheckDenyResultSchema?: PrecheckDenyResult;
    commitParamsSchema?: CommitParams;
    commitAllowResultSchema?: CommitAllowResult;
    commitDenyResultSchema?: CommitDenyResult;

    evaluate: (args: {
      toolParams: z.infer<PolicyToolParams>;
      userParams: z.infer<UserParams>;
    }) => Promise<
      PolicyResult<
        EvalAllowResult extends z.ZodType ? z.infer<EvalAllowResult> : never,
        EvalDenyResult extends z.ZodType ? z.infer<EvalDenyResult> : never
      >
    >;

    precheck?: (args: {
      toolParams: z.infer<PolicyToolParams>;
      userParams: z.infer<UserParams>;
    }) => Promise<
      | (PrecheckAllowResult extends z.ZodType
          ? PolicyResultAllow<z.infer<PrecheckAllowResult>>
          : PolicyResultAllowNoResult)
      | (PrecheckDenyResult extends z.ZodType
          ? PolicyResultDeny<z.infer<PrecheckDenyResult>>
          : PolicyResultDenyNoResult)
    >;

    commit?: CommitParams extends z.ZodType
      ? (
          args: z.infer<CommitParams>,
        ) => Promise<
          | (CommitAllowResult extends z.ZodType
              ? PolicyResultAllow<z.infer<CommitAllowResult>>
              : PolicyResultAllowNoResult)
          | (CommitDenyResult extends z.ZodType
              ? PolicyResultDeny<z.infer<CommitDenyResult>>
              : PolicyResultDenyNoResult)
        >
      : never;
  };
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<PolicyToolParams>;
  }>;
}) {
  if (config.policyDef.commitParamsSchema && !config.policyDef.commit) {
    throw new Error(
      'Policy defines commitParamsSchema but is missing commit function',
    );
  }

  // Add type assertion for the returned policy definitions
  const policyDef = config.policyDef;

  // Create a typed result with non-optional commit if all required schemas are present
  const result = {
    policyDef: policyDef,
    toolParameterMappings: config.toolParameterMappings,
  };

  return result as {
    policyDef: typeof policyDef &
      (CommitParams extends z.ZodType
        ? {
            commit: NonNullable<(typeof policyDef)['commit']>;
          }
        : {});
    toolParameterMappings: typeof config.toolParameterMappings;
  };
}
