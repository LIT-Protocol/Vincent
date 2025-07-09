// src/lib/policyCore/vincentPolicy.ts
import { z } from 'zod';
import {
  CommitLifecycleFunction,
  PolicyLifecycleFunction,
  PolicyResponse,
  PolicyResponseAllow,
  PolicyResponseAllowNoResult,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
  VincentPolicy,
  ZodValidationDenyResult,
} from '../types';
import { createPolicyContext } from './policyConfig/context/policyConfigContext';
import {
  createDenyResult,
  getSchemaForPolicyResponseResult,
  getValidatedParamsOrDeny,
  isPolicyDenyResponse,
  validateOrDeny,
} from './helpers';
import {
  PolicyConfigCommitFunction,
  PolicyConfigLifecycleFunction,
  VincentPolicyConfig,
} from './policyConfig/types';
import { createAllowResult, returnNoResultDeny, wrapAllow } from './helpers/resultCreators';
import { BundledVincentPolicy } from './bundledPolicy/types';

/**
 * The `createVincentPolicy()` method is used to define a policy's lifecycle methods and ensure that arguments provided to the tool's
 * lifecycle methods, as well as their return values, are validated and fully type-safe by defining ZOD schemas for them.
 *
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
 * @category API Methods
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
  PolicyConfig: VincentPolicyConfig<
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
    PolicyConfigLifecycleFunction<PolicyToolParams, UserParams, EvalAllowResult, EvalDenyResult>,
    PolicyConfigLifecycleFunction<
      PolicyToolParams,
      UserParams,
      PrecheckAllowResult,
      PrecheckDenyResult
    >,
    PolicyConfigCommitFunction<CommitParams, CommitAllowResult, CommitDenyResult>
  >,
) {
  if (PolicyConfig.commitParamsSchema && !PolicyConfig.commit) {
    throw new Error('Policy defines commitParamsSchema but is missing commit function');
  }

  const userParamsSchema = (PolicyConfig.userParamsSchema ?? z.undefined()) as UserParams;
  const evalAllowSchema = (PolicyConfig.evalAllowResultSchema ?? z.undefined()) as EvalAllowResult;
  const evalDenySchema = (PolicyConfig.evalDenyResultSchema ?? z.undefined()) as EvalDenyResult;

  const evaluate: PolicyLifecycleFunction<
    PolicyToolParams,
    UserParams,
    EvalAllowResult,
    EvalDenyResult
  > = async (args, baseContext) => {
    try {
      const context = createPolicyContext({
        baseContext,
        allowSchema: PolicyConfig.evalAllowResultSchema,
        denySchema: PolicyConfig.evalDenyResultSchema,
      });

      const paramsOrDeny = getValidatedParamsOrDeny({
        rawToolParams: args.toolParams,
        rawUserParams: args.userParams,
        toolParamsSchema: PolicyConfig.toolParamsSchema,
        userParamsSchema: userParamsSchema,
        phase: 'evaluate',
      });

      if (isPolicyDenyResponse(paramsOrDeny)) {
        return paramsOrDeny as EvalDenyResult extends z.ZodType
          ? PolicyResponseDeny<z.infer<EvalDenyResult> | ZodValidationDenyResult>
          : PolicyResponseDenyNoResult;
      }

      const { toolParams, userParams } = paramsOrDeny;

      const result = await PolicyConfig.evaluate({ toolParams, userParams }, context);

      const { schemaToUse } = getSchemaForPolicyResponseResult({
        value: result,
        allowResultSchema: evalAllowSchema,
        denyResultSchema: evalDenySchema,
      });

      const resultOrDeny = validateOrDeny(
        (result as PolicyResponse<any, any>).result,
        schemaToUse,
        'evaluate',
        'output',
      );

      if (isPolicyDenyResponse(resultOrDeny)) {
        return resultOrDeny as EvalDenyResult extends z.ZodType
          ? PolicyResponseDeny<z.infer<EvalDenyResult> | ZodValidationDenyResult>
          : PolicyResponseDenyNoResult;
      }

      // We parsed the result -- it may be a success or a failure; return appropriately.
      if (isPolicyDenyResponse(result)) {
        return createDenyResult({
          message: result.error,
          result: resultOrDeny,
        }) as EvalDenyResult extends z.ZodType
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

  const precheckAllowSchema = (PolicyConfig.precheckAllowResultSchema ??
    z.undefined()) as PrecheckAllowResult;
  const precheckDenySchema = (PolicyConfig.precheckDenyResultSchema ??
    z.undefined()) as PrecheckDenyResult;
  const precheck = PolicyConfig.precheck
    ? ((async (args, baseContext) => {
        try {
          const context = createPolicyContext({
            baseContext,
            allowSchema: PolicyConfig.precheckAllowResultSchema,
            denySchema: PolicyConfig.precheckDenyResultSchema,
          });

          const { precheck: precheckFn } = PolicyConfig;

          if (!precheckFn) {
            throw new Error('precheck function unexpectedly missing');
          }

          const paramsOrDeny = getValidatedParamsOrDeny({
            rawToolParams: args.toolParams,
            rawUserParams: args.userParams,
            toolParamsSchema: PolicyConfig.toolParamsSchema,
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

          const resultOrDeny = validateOrDeny(
            (result as PolicyResponse<any, any>).result,
            schemaToUse,
            'precheck',
            'output',
          );

          if (isPolicyDenyResponse(resultOrDeny)) {
            return resultOrDeny;
          }

          // We parsed the result -- it may be a success or a failure; return appropriately.
          if (isPolicyDenyResponse(result)) {
            return createDenyResult({
              message: result.error,
              result: resultOrDeny,
            });
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

  const commitAllowSchema = (PolicyConfig.commitAllowResultSchema ??
    z.undefined()) as CommitAllowResult;
  const commitDenySchema = (PolicyConfig.commitDenyResultSchema ??
    z.undefined()) as CommitDenyResult;
  const commitParamsSchema = (PolicyConfig.commitParamsSchema ?? z.undefined()) as CommitParams;
  const commit = PolicyConfig.commit
    ? ((async (args, baseContext) => {
        try {
          const context = createPolicyContext({
            baseContext,
            denySchema: PolicyConfig.commitDenyResultSchema,
            allowSchema: PolicyConfig.commitAllowResultSchema,
          });

          const { commit: commitFn } = PolicyConfig;

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

          const resultOrDeny = validateOrDeny(
            (result as PolicyResponse<any, any>).result,
            schemaToUse,
            'commit',
            'output',
          );

          if (isPolicyDenyResponse(resultOrDeny)) {
            return resultOrDeny;
          }

          // We parsed the result -- it may be a success or a failure; return appropriately.
          if (isPolicyDenyResponse(result)) {
            return createDenyResult({
              message: result.error,
              result: resultOrDeny,
            });
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
    ...PolicyConfig,
    evaluate,
    precheck,
    commit,
  };

  return vincentPolicy;
}

/**
 * `createVincentToolPolicy()` is used to bind a policy to a specific tool. You must provide a `toolParameterMappings` argument
 * which instructs the tool which of its toolParams should be passed to the Vincent Policy during evaluation, and
 * defines what the argument passed to the tool should be.
 *
 * For example, a Tool might receive an argument called `tokenInAmount`, but it may need to pass that as `buyAmount` to a
 * policy that uses the `tokenInAmount` for its own purposes.
 *
 * ```typescript
 * import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';
 *
 * const SpendingLimitPolicy = createVincentToolPolicy({
 *   toolParamsSchema,
 *   bundledVincentPolicy,
 *   toolParameterMappings: {
 *     rpcUrlForUniswap: 'rpcUrlForUniswap',
 *     chainIdForUniswap: 'chainIdForUniswap',
 *     ethRpcUrl: 'ethRpcUrl',
 *     tokenInAddress: 'tokenAddress',
 *     tokenInDecimals: 'tokenDecimals',
 *     tokenInAmount: 'buyAmount',
 *   },
 * });
 * ```
 *
 * @typeParam PackageName {@removeTypeParameterCompletely}
 * @typeParam IpfsCid {@removeTypeParameterCompletely}
 * @typeParam ToolParamsSchema {@removeTypeParameterCompletely}
 * @typeParam PolicyToolParams {@removeTypeParameterCompletely}
 * @typeParam UserParams {@removeTypeParameterCompletely}
 * @typeParam PrecheckAllowResult {@removeTypeParameterCompletely}
 * @typeParam PrecheckDenyResult {@removeTypeParameterCompletely}
 * @typeParam EvalAllowResult {@removeTypeParameterCompletely}
 * @typeParam EvalDenyResult {@removeTypeParameterCompletely}
 * @typeParam CommitParams {@removeTypeParameterCompletely}
 * @typeParam CommitAllowResult {@removeTypeParameterCompletely}
 * @typeParam CommitDenyResult {@removeTypeParameterCompletely}
 *
 * @returns A Vincent Policy that is configured to work with the provided tool
 * {@displayType A Vincent Policy that is configured to work with the provided tool }
 * @category API Methods
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
    /** @hidden */
    __schemaTypes: {
      policyToolParamsSchema: vincentPolicy.toolParamsSchema,
      userParamsSchema: vincentPolicy.userParamsSchema,
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
    /** @hidden */
    __schemaTypes: {
      policyToolParamsSchema: PolicyToolParams;
      userParamsSchema: UserParams;
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
