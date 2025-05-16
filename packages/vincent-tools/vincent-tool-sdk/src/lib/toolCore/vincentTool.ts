// src/lib/toolCore/vincentTool.ts

import { z } from 'zod';
import {
  PolicyEvaluationResultContext,
  ToolExecutionPolicyContext,
  ToolExecutionPolicyEvaluationResult,
  ToolLifecycleFunction,
  ToolResponse,
  VincentPolicy,
  VincentToolDef,
  VincentToolPolicy,
} from '../types';
import { createExecutionToolContext, createPrecheckToolContext } from './toolContext/toolContext';
import { BaseToolContext } from './toolContext/types';
import { createToolFailureResult } from './helpers/resultCreators';
import { getSchemaForToolResponseResult, validateOrFail } from './helpers/zod';
import { isToolFailureResponse, isToolResponse } from './helpers/typeGuards';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Converts a `supportedPolicies` array into a keyed map of policies,
 * where each key is the `packageName` of the corresponding policyDef.
 *
 * This enables tools to perform fast lookups by package name,
 * enforce key-precise access to `allowedPolicies`, and inject `commit`
 * logic into evaluated policy contexts.
 *
 * ⚠️ Requires all `packageName` values in the input array to be `as const`
 * string literals in order to preserve exact key inference.
 */
function createPolicyMap<
  T extends readonly VincentToolPolicy<any, any, any>[],
  Pkgs extends
    T[number]['vincentPolicy']['packageName'] = T[number]['vincentPolicy']['packageName'],
>(
  policies: T,
): string extends Pkgs
  ? [
      '❌ Each policyDef.packageName must be a string literal. Use `as const` when passing the array.',
    ]
  : {
      [K in Pkgs]: Extract<T[number], { vincentPolicy: { packageName: K } }>;
    } {
  const result = {} as any;
  for (const policy of policies) {
    const name = policy.vincentPolicy.packageName;
    if (result[name]) {
      throw new Error('Duplicate policy packageName: ' + name + '');
    }
    result[name] = policy;
  }
  return result;
}

export type EnrichedVincentToolPolicy = VincentToolPolicy<any, any, any> & {
  __schemaTypes?: {
    evalAllowResultSchema?: z.ZodType;
    evalDenyResultSchema?: z.ZodType;
    commitParamsSchema?: z.ZodType;
    commitAllowResultSchema?: z.ZodType;
    commitDenyResultSchema?: z.ZodType;
  };
};

/**
 * Wraps a VincentToolDef object and returns a fully typed tool with
 * standard lifecycle entrypoints (`precheck`, `execute`) and strong inference
 * based on schemas and supported policies. The original definition is available
 * via `__vincentToolDef`, and `__supportedPolicies` exposes the exact policy array.
 */
export function createVincentTool<
  ToolParamsSchema extends z.ZodType,
  PolicyArray extends readonly VincentToolPolicy<
    ToolParamsSchema,
    VincentPolicy<any, any, any, any, any, any, any, any, any, any>
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
  PrecheckFn extends
    | ToolLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PolicyMapType>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >
    | undefined =
    | undefined
    | ToolLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PolicyMapType>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >,
  ExecuteFn extends ToolLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyContext<PolicyMapType>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  > = ToolLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyContext<PolicyMapType>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  >,
>(
  toolDef: VincentToolDef<
    ToolParamsSchema,
    PolicyArray,
    PkgNames,
    PolicyMapType,
    PrecheckSuccessSchema,
    PrecheckFailSchema,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    PrecheckFn,
    ExecuteFn
  >,
) {
  const policyMap = createPolicyMap(toolDef.supportedPolicies);

  const originalToolDef = {
    ...toolDef,
    supportedPolicies: policyMap,
  };

  const wrappedToolDef = {
    ...originalToolDef,

    ...(originalToolDef.precheck !== undefined
      ? {
          precheck: async (
            params: z.infer<ToolParamsSchema>,
            baseToolContext: BaseToolContext<PolicyEvaluationResultContext<PolicyMapType>>,
          ) => {
            try {
              const { toolParamsSchema, precheckSuccessSchema, precheckFailSchema } = toolDef;

              const context = createPrecheckToolContext<
                PrecheckSuccessSchema,
                PrecheckFailSchema,
                PolicyMapType
              >({
                baseContext: baseToolContext,
                successSchema: originalToolDef.precheckSuccessSchema,
                failSchema: originalToolDef.precheckFailSchema,
              });

              const parsedToolParams = validateOrFail(
                params.toolParams,
                toolParamsSchema,
                'precheck',
                'input',
              );

              if (isToolFailureResponse(parsedToolParams)) {
                return parsedToolParams;
              }

              const { precheck: precheckFn } = originalToolDef;

              if (!precheckFn) {
                throw new Error('precheck function unexpectedly missing');
              }

              const result = await precheckFn(params, context);

              const { schemaToUse } = getSchemaForToolResponseResult({
                value: result,
                successResultSchema: precheckSuccessSchema,
                failureResultSchema: precheckFailSchema,
              });

              const parsed = validateOrFail(
                result as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema>,
                schemaToUse,
                'precheck',
                'output',
              );

              if (isToolResponse(parsed)) {
                return parsed;
              }

              return createToolFailureResult({
                message: 'Tool returned invalid result shape from precheck()',
              });
            } catch (err) {
              return createToolFailureResult({
                message: err instanceof Error ? err.message : 'Unknown error',
              });
            }
          },
        }
      : { precheck: undefined }),

    execute: async (
      params: z.infer<ToolParamsSchema>,
      baseToolContext: BaseToolContext<ToolExecutionPolicyEvaluationResult<PolicyMapType>>,
    ) => {
      try {
        const context = createExecutionToolContext<
          ExecuteSuccessSchema,
          ExecuteFailSchema,
          PolicyMapType
        >({
          baseContext: baseToolContext,
          successSchema: originalToolDef.executeSuccessSchema,
          failSchema: originalToolDef.executeFailSchema,
          supportedPolicies: policyMap,
        });

        const { toolParamsSchema, executeSuccessSchema, executeFailSchema } = toolDef;

        const parsedToolParams = validateOrFail(
          params.toolParams,
          toolParamsSchema,
          'execute',
          'input',
        );

        if (isToolFailureResponse(parsedToolParams)) {
          return parsedToolParams;
        }

        const result = await originalToolDef.execute(params, context);

        const { schemaToUse } = getSchemaForToolResponseResult({
          value: result,
          successResultSchema: executeSuccessSchema,
          failureResultSchema: executeFailSchema,
        });

        const parsed = validateOrFail(
          result as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema>,
          schemaToUse,
          'execute',
          'output',
        );

        if (isToolResponse(parsed)) {
          return parsed;
        }

        return createToolFailureResult({
          message: 'Tool returned invalid result shape from execute()',
        });
      } catch (err) {
        return createToolFailureResult({
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
  };

  return {
    ...wrappedToolDef,
    __vincentToolDef: originalToolDef,
    __schemaTypes: {
      precheckSuccessSchema: toolDef.precheckSuccessSchema,
      precheckFailSchema: toolDef.precheckFailSchema,
      executeSuccessSchema: toolDef.executeSuccessSchema,
      executeFailSchema: toolDef.executeFailSchema,
    },
  } as unknown as VincentToolDef<
    ToolParamsSchema,
    PolicyArray,
    PkgNames,
    PolicyMapType,
    PrecheckSuccessSchema,
    PrecheckFailSchema,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    PrecheckFn,
    ExecuteFn
  > & {
    supportedPolicies: PolicyMapType;
    precheck: (typeof wrappedToolDef)['precheck'];
    execute: (typeof wrappedToolDef)['execute'];
    __vincentToolDef: typeof originalToolDef;
    __schemaTypes: {
      precheckSuccessSchema: PrecheckSuccessSchema;
      precheckFailSchema: PrecheckFailSchema;
      executeSuccessSchema: ExecuteSuccessSchema;
      executeFailSchema: ExecuteFailSchema;
    };
  };
}
