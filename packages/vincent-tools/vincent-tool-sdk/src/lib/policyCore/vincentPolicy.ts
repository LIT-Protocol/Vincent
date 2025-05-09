// src/lib/policyCore/vincentPolicy.ts
import { z } from 'zod';
import { BaseContext, CommitFunction, PolicyLifecycleFunction, VincentPolicyDef } from '../types';
import { createPolicyContext } from './policyContext/policyContext';

/**
 * Wraps a raw VincentPolicyDef with internal logic and returns a fully typed
 * policy object, preserving inference for all lifecycle methods (`evaluate`, `precheck`, `commit`)
 * and providing metadata such as `ipfsCid` and `packageName`. Also includes
 * the original definition on `__vincentPolicyDef` for consumer-side re-wrapping.
 */
export function createVincentPolicy<
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
>(
  policyDef: VincentPolicyDef<
    PackageName,
    PolicyToolParams,
    UserParams,
    PrecheckAllowResult,
    PrecheckDenyResult,
    EvalAllowResult,
    EvalDenyResult,
    CommitParams,
    CommitAllowResult,
    CommitDenyResult,
    PolicyLifecycleFunction<PolicyToolParams, UserParams, EvalAllowResult, EvalDenyResult>,
    PolicyLifecycleFunction<PolicyToolParams, UserParams, PrecheckAllowResult, PrecheckDenyResult>,
    CommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>
  >,
) {
  if (policyDef.commitParamsSchema && !policyDef.commit) {
    throw new Error('Policy defines commitParamsSchema but is missing commit function');
  }

  const originalPolicyDef = policyDef;

  // Create wrapper functions that create a new context and merge baseContext into them
  const wrappedPolicyDef = {
    ...originalPolicyDef,
    packageName: originalPolicyDef.packageName,
    evaluate: async (
      args: {
        toolParams: z.infer<typeof originalPolicyDef.toolParamsSchema>;
        userParams: UserParams extends z.ZodType ? z.infer<UserParams> : undefined;
      },
      baseContext: BaseContext,
    ) => {
      const context = createPolicyContext({
        baseContext,
        ipfsCid: originalPolicyDef.ipfsCid,
        allowSchema: originalPolicyDef.evalAllowResultSchema,
        denySchema: originalPolicyDef.evalDenyResultSchema,
      });

      return originalPolicyDef.evaluate(args, context);
    },

    // Only create precheck wrapper if precheck exists; it is optional.
    ...(originalPolicyDef.precheck !== undefined
      ? {
          precheck: async (
            args: {
              toolParams: z.infer<typeof originalPolicyDef.toolParamsSchema>;
              userParams: UserParams extends z.ZodType ? z.infer<UserParams> : undefined;
            },
            baseContext: BaseContext,
          ) => {
            const context = createPolicyContext({
              ipfsCid: originalPolicyDef.ipfsCid,
              baseContext,
              allowSchema: originalPolicyDef.precheckAllowResultSchema,
              denySchema: originalPolicyDef.precheckDenyResultSchema,
            });

            const { precheck: precheckFn } = originalPolicyDef;

            if (!precheckFn) {
              throw new Error('precheck function unexpectedly missing');
            }

            return precheckFn(args, context);
          },
        }
      : { precheck: undefined }),

    // Only create commit wrapper if commit exists; it is optional also
    ...(originalPolicyDef.commit !== undefined
      ? {
          commit: async (
            args: CommitParams extends z.ZodType ? z.infer<CommitParams> : undefined,
            baseContext: BaseContext,
          ) => {
            const context = createPolicyContext({
              ipfsCid: originalPolicyDef.ipfsCid,
              baseContext,
              denySchema: originalPolicyDef.commitDenyResultSchema,
              allowSchema: originalPolicyDef.commitAllowResultSchema,
            });

            const { commit: commitFn } = originalPolicyDef;
            if (!commitFn) {
              throw new Error('commit function unexpectedly missing');
            }

            return commitFn(args, context);
          },
        }
      : { commit: undefined }),
  };

  return {
    ...wrappedPolicyDef,
    __vincentPolicyDef: originalPolicyDef,
  } as typeof wrappedPolicyDef & {
    __vincentPolicyDef: typeof originalPolicyDef;
  };
}

/**
 * Adapts a single policy to a specific tool by applying parameter mappings.
 * This allows the policy's schema-defined params to be inferred and automatically
 * extracted from the tool's input params. Also attaches schema metadata for result typing.
 */
export function createVincentToolPolicy<
  PackageName extends string,
  ToolParamsSchema extends z.ZodType,
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  PrecheckAllowResult extends z.ZodType | undefined = undefined,
  PrecheckDenyResult extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
  CommitParams extends z.ZodType | undefined = undefined,
  CommitAllowResult extends z.ZodType | undefined = undefined,
  CommitDenyResult extends z.ZodType | undefined = undefined,
>(config: {
  toolParamsSchema: ToolParamsSchema;
  policyDef: VincentPolicyDef<
    PackageName,
    PolicyToolParams,
    UserParams,
    PrecheckAllowResult,
    PrecheckDenyResult,
    EvalAllowResult,
    EvalDenyResult,
    CommitParams,
    CommitAllowResult,
    CommitDenyResult,
    PolicyLifecycleFunction<PolicyToolParams, UserParams, EvalAllowResult, EvalDenyResult>,
    PolicyLifecycleFunction<PolicyToolParams, UserParams, PrecheckAllowResult, PrecheckDenyResult>,
    CommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>
  >;
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<PolicyToolParams>;
  }>;
}) {
  // Use createVincentPolicy to create the wrapped policy
  const policyDef = createVincentPolicy(config.policyDef);

  const result = {
    policyDef,
    __vincentPolicyDef: config.policyDef,
    toolParameterMappings: config.toolParameterMappings,
    // Explicitly include schema types in the returned object for type inference
    __schemaTypes: {
      evalAllowResultSchema: config.policyDef.evalAllowResultSchema,
      evalDenyResultSchema: config.policyDef.evalDenyResultSchema,
      commitParamsSchema: config.policyDef.commitParamsSchema,
      commitAllowResultSchema: config.policyDef.commitAllowResultSchema,
      commitDenyResultSchema: config.policyDef.commitDenyResultSchema,
      // Explicit function types
      evaluate: config.policyDef.evaluate,
      precheck: config.policyDef.precheck,
      commit: config.policyDef.commit,
    },
  };

  // Use the same type assertion -- but include __schemaTypes to fix generic inference issues
  return result as {
    __vincentPolicyDef: typeof config.policyDef;
    policyDef: typeof policyDef;
    toolParameterMappings: typeof config.toolParameterMappings;
    __schemaTypes: {
      evalAllowResultSchema: EvalAllowResult;
      evalDenyResultSchema: EvalDenyResult;
      commitParamsSchema: CommitParams;
      commitAllowResultSchema: CommitAllowResult;
      commitDenyResultSchema: CommitDenyResult;
      // Explicit function types
      evaluate: typeof policyDef.evaluate;
      precheck: typeof policyDef.precheck;
      commit: typeof policyDef.commit;
    };
  };
}
