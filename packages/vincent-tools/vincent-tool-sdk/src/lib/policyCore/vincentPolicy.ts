// src/lib/policyCore/vincentPolicy.ts
import { z } from 'zod';
import {
  CommitLifecycleFunction,
  PolicyLifecycleFunction,
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
  VincentPolicy,
  ZodValidationDenyResult,
} from '../types';
import { createPolicyContext } from './policyDef/context/policyDefContext';
import {
  createDenyResult,
  getSchemaForPolicyResponseResult,
  getValidatedParamsOrDeny,
  isPolicyDenyResponse,
  validateOrDeny,
} from './helpers';
import {
  PolicyDefCommitFunction,
  PolicyDefLifecycleFunction,
  VincentPolicyDef,
} from './policyDef/types';
import { createAllowResult, returnNoResultDeny, wrapAllow } from './helpers/resultCreators';
import { BundledVincentPolicy } from './bundledPolicy/types';

/**
 * Wraps a raw VincentPolicyDef with internal logic and returns a fully typed
 * policy object, preserving inference for all lifecycle methods (`evaluate`, `precheck`, `commit`)
 * and providing metadata such as `ipfsCid` and `packageName`.
 */
export function createVincentPolicy<
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
    PolicyDefLifecycleFunction<PolicyToolParams, UserParams, EvalAllowResult, EvalDenyResult>,
    PolicyDefLifecycleFunction<
      PolicyToolParams,
      UserParams,
      PrecheckAllowResult,
      PrecheckDenyResult
    >,
    PolicyDefCommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>
  >,
) {
  if (policyDef.commitParamsSchema && !policyDef.commit) {
    throw new Error('Policy defines commitParamsSchema but is missing commit function');
  }

  const userParamsSchema = (policyDef.userParamsSchema ?? z.undefined()) as UserParams;
  const evalAllowSchema = (policyDef.evalAllowResultSchema ?? z.undefined()) as EvalAllowResult;
  const evalDenySchema = (policyDef.evalDenyResultSchema ?? z.undefined()) as EvalDenyResult;

  const evaluate: PolicyLifecycleFunction<
    PolicyToolParams,
    UserParams,
    EvalAllowResult,
    EvalDenyResult
  > = async (args, baseContext) => {
    try {
      const context = createPolicyContext({
        baseContext,
        allowSchema: evalAllowSchema,
        denySchema: evalDenySchema,
      });

      const paramsOrDeny = getValidatedParamsOrDeny({
        rawToolParams: args.toolParams,
        rawUserParams: args.userParams,
        toolParamsSchema: policyDef.toolParamsSchema,
        userParamsSchema: userParamsSchema,
        phase: 'evaluate',
      });

      if (isPolicyDenyResponse(paramsOrDeny)) {
        return paramsOrDeny as EvalDenyResult extends z.ZodType
          ? PolicyResponseDeny<z.infer<EvalDenyResult> | ZodValidationDenyResult>
          : PolicyResponseDenyNoResult;
      }

      const { toolParams, userParams } = paramsOrDeny;

      const result = await policyDef.evaluate({ toolParams, userParams }, context);

      const { schemaToUse } = getSchemaForPolicyResponseResult({
        value: result,
        allowResultSchema: evalAllowSchema,
        denyResultSchema: evalDenySchema,
      });

      const resultOrDeny = validateOrDeny(result, schemaToUse, 'evaluate', 'output');

      if (isPolicyDenyResponse(resultOrDeny)) {
        return resultOrDeny as EvalDenyResult extends z.ZodType
          ? PolicyResponseDeny<z.infer<EvalDenyResult> | ZodValidationDenyResult>
          : PolicyResponseDenyNoResult;
      }

      return wrapAllow<EvalAllowResult>(resultOrDeny) as EvalAllowResult extends z.ZodType
        ? PolicyResponseAllow<z.infer<EvalAllowResult>>
        : PolicyResponseAllowNoResult;
    } catch (err) {
      return returnNoResultDeny<EvalDenyResult>(
        err instanceof Error ? err.message : 'Unknown error',
      ) as unknown as EvalDenyResult extends z.ZodType
        ? PolicyResponseDeny<z.infer<EvalDenyResult> | ZodValidationDenyResult>
        : PolicyResponseDenyNoResult;
    }
  };

  const precheckAllowSchema = (policyDef.precheckAllowResultSchema ??
    z.undefined()) as PrecheckAllowResult;
  const precheckDenySchema = (policyDef.precheckDenyResultSchema ??
    z.undefined()) as PrecheckDenyResult;
  const precheck = policyDef.precheck
    ? ((async (args, baseContext) => {
        try {
          const context = createPolicyContext({
            baseContext,
            allowSchema: precheckAllowSchema,
            denySchema: precheckDenySchema,
          });

          const { precheck: precheckFn } = policyDef;

          if (!precheckFn) {
            throw new Error('precheck function unexpectedly missing');
          }

          const paramsOrDeny = getValidatedParamsOrDeny({
            rawToolParams: args.toolParams,
            rawUserParams: args.userParams,
            toolParamsSchema: policyDef.toolParamsSchema,
            userParamsSchema,
            phase: 'precheck',
          });

          if (isPolicyDenyResponse(paramsOrDeny)) {
            return paramsOrDeny;
          }

          const result = await precheckFn(args, context);

          const { schemaToUse } = getSchemaForPolicyResponseResult({
            value: result,
            allowResultSchema: precheckAllowSchema,
            denyResultSchema: precheckDenySchema,
          });

          const resultOrDeny = validateOrDeny(result, schemaToUse, 'precheck', 'output');

          if (isPolicyDenyResponse(resultOrDeny)) {
            return resultOrDeny;
          }

          return createAllowResult({ result: resultOrDeny });
        } catch (err) {
          return createDenyResult({
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }) as PolicyLifecycleFunction<
        PolicyToolParams,
        UserParams,
        PrecheckAllowResult,
        PrecheckDenyResult
      >)
    : undefined;

  const commitAllowSchema = (policyDef.commitAllowResultSchema ??
    z.undefined()) as CommitAllowResult;
  const commitDenySchema = (policyDef.commitDenyResultSchema ?? z.undefined()) as CommitDenyResult;
  const commitParamsSchema = (policyDef.commitParamsSchema ?? z.undefined()) as CommitParams;
  const commit = policyDef.commit
    ? ((async (args, baseContext) => {
        try {
          const context = createPolicyContext({
            baseContext,
            denySchema: commitDenySchema,
            allowSchema: commitAllowSchema,
          });

          const { commit: commitFn } = policyDef;

          if (!commitFn) {
            throw new Error('commit function unexpectedly missing');
          }

          const paramsOrDeny = validateOrDeny(args, commitParamsSchema, 'commit', 'input');

          if (isPolicyDenyResponse(paramsOrDeny)) {
            return paramsOrDeny;
          }

          const result = await commitFn(args, context);

          const { schemaToUse } = getSchemaForPolicyResponseResult({
            value: result,
            allowResultSchema: commitAllowSchema,
            denyResultSchema: commitDenySchema,
          });

          const resultOrDeny = validateOrDeny(result, schemaToUse, 'commit', 'output');

          if (isPolicyDenyResponse(resultOrDeny)) {
            return resultOrDeny;
          }

          return createAllowResult({ result: resultOrDeny });
        } catch (err) {
          return createDenyResult({
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }) as CommitLifecycleFunction<CommitParams, CommitAllowResult, CommitDenyResult>)
    : undefined;

  const vincentPolicy: VincentPolicy<
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
    CommitLifecycleFunction<CommitParams, CommitAllowResult, CommitDenyResult>
  > = {
    ...policyDef,
    evaluate,
    precheck,
    commit,
  };

  return vincentPolicy;
}

/**
 * Adapts a single policy to a specific tool by applying parameter mappings.
 * This allows the policy's schema-defined params to be inferred and automatically
 * extracted from the tool's input params. Also attaches schema metadata for result typing.
 */
export function createVincentToolPolicy<
  const PackageName extends string,
  const IpfsCid extends string,
  ToolParamsSchema extends z.ZodType,
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType = z.ZodUndefined,
  PrecheckAllowResult extends z.ZodType = z.ZodUndefined,
  PrecheckDenyResult extends z.ZodType = z.ZodUndefined,
  EvalAllowResult extends z.ZodType = z.ZodUndefined,
  EvalDenyResult extends z.ZodType = z.ZodUndefined,
  CommitParams extends z.ZodType = z.ZodUndefined,
  CommitAllowResult extends z.ZodType = z.ZodUndefined,
  CommitDenyResult extends z.ZodType = z.ZodUndefined,
>(config: {
  toolParamsSchema: ToolParamsSchema;
  bundledVincentPolicy: BundledVincentPolicy<
    VincentPolicy<
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
      PolicyLifecycleFunction<
        PolicyToolParams,
        UserParams,
        PrecheckAllowResult,
        PrecheckDenyResult
      >,
      CommitLifecycleFunction<CommitParams, CommitAllowResult, CommitDenyResult>
    >,
    IpfsCid
  >;
  toolParameterMappings: Partial<{
    [K in keyof z.infer<ToolParamsSchema>]: keyof z.infer<PolicyToolParams>;
  }>;
}) {
  const {
    bundledVincentPolicy: { vincentPolicy, ipfsCid },
  } = config;

  const result = {
    vincentPolicy: vincentPolicy,
    ipfsCid,
    toolParameterMappings: config.toolParameterMappings,
    // Explicitly include schema types in the returned object for type inference
    __schemaTypes: {
      evalAllowResultSchema: vincentPolicy.evalAllowResultSchema,
      evalDenyResultSchema: vincentPolicy.evalDenyResultSchema,
      commitParamsSchema: vincentPolicy.commitParamsSchema,
      precheckAllowResultSchema: vincentPolicy.precheckAllowResultSchema,
      precheckDenyResultSchema: vincentPolicy.precheckDenyResultSchema,
      commitAllowResultSchema: vincentPolicy.commitAllowResultSchema,
      commitDenyResultSchema: vincentPolicy.commitDenyResultSchema,
      // Explicit function types
      evaluate: vincentPolicy.evaluate,
      precheck: vincentPolicy.precheck,
      commit: vincentPolicy.commit,
    },
  };

  // Use the same type assertion -- but include __schemaTypes to fix generic inference issues
  return result as {
    vincentPolicy: typeof vincentPolicy;
    ipfsCid: typeof ipfsCid;
    toolParameterMappings: typeof config.toolParameterMappings;
    __schemaTypes: {
      evalAllowResultSchema: EvalAllowResult;
      evalDenyResultSchema: EvalDenyResult;
      precheckAllowResultSchema: PrecheckAllowResult;
      precheckDenyResultSchema: PrecheckDenyResult;
      commitParamsSchema: CommitParams;
      commitAllowResultSchema: CommitAllowResult;
      commitDenyResultSchema: CommitDenyResult;
      // Explicit function types
      evaluate: typeof vincentPolicy.evaluate;
      precheck: typeof vincentPolicy.precheck;
      commit: typeof vincentPolicy.commit;
    };
  };
}
