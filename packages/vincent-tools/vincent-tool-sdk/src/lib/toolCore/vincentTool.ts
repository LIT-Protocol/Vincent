// src/lib/toolCore/vincentTool.ts

import { z } from 'zod';
import {
  PolicyEvaluationResultContext,
  ToolExecutionPolicyEvaluationResult,
  VincentPolicyDef,
  VincentToolDef,
  VincentToolPolicy,
} from '../types';
import { createExecutionToolContext, createPrecheckToolContext } from './toolContext/toolContext';
import { BaseToolContext } from './toolContext/types';

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
export function createPolicyMap<
  T extends readonly VincentToolPolicy<any, any, any>[],
  Pkgs extends T[number]['policyDef']['packageName'] = T[number]['policyDef']['packageName'],
>(
  policies: T,
): string extends Pkgs
  ? [
      '❌ Each policyDef.packageName must be a string literal. Use `as const` when passing the array.',
    ]
  : {
      [K in Pkgs]: Extract<T[number], { policyDef: { packageName: K } }>;
    } {
  const result = {} as any;
  for (const policy of policies) {
    const name = policy.policyDef.packageName;
    if (result[name]) {
      throw new Error('Duplicate policy packageName: ' + name + '');
    }
    result[name] = policy;
  }
  return result;
}

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
>(
  toolDef: VincentToolDef<
    ToolParamsSchema,
    PolicyArray,
    PkgNames,
    PolicyMapType,
    PrecheckSuccessSchema,
    PrecheckFailSchema,
    ExecuteSuccessSchema,
    ExecuteFailSchema
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
            const context = createPrecheckToolContext<
              PrecheckSuccessSchema,
              PrecheckFailSchema,
              PolicyMapType
            >({
              baseContext: baseToolContext,
              successSchema: originalToolDef.precheckSuccessSchema,
              failSchema: originalToolDef.precheckFailSchema,
            });

            const { precheck: precheckFn } = originalToolDef;

            if (!precheckFn) {
              throw new Error('precheck function unexpectedly missing');
            }

            return precheckFn(params, context);
          },
        }
      : { precheck: undefined }),

    execute: async (
      params: z.infer<ToolParamsSchema>,
      baseToolContext: BaseToolContext<ToolExecutionPolicyEvaluationResult<PolicyMapType>>,
    ) => {
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

      return originalToolDef.execute(params, context);
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
  } as typeof wrappedToolDef & {
    __vincentToolDef: typeof originalToolDef;
    __schemaTypes: {
      precheckSuccessSchema: PrecheckSuccessSchema;
      precheckFailSchema: PrecheckFailSchema;
      executeSuccessSchema: ExecuteSuccessSchema;
      executeFailSchema: ExecuteFailSchema;
    };
  };
}
