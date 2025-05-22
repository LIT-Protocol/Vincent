// src/lib/toolCore/vincentTool.ts

import { z } from 'zod';
import {
  PolicyEvaluationResultContext,
  ToolExecutionPolicyContext,
  ToolExecutionPolicyEvaluationResult,
  ToolLifecycleFunction,
  ToolResponse,
  VincentToolPolicy,
} from '../types';
import {
  createExecutionToolContext,
  createPrecheckToolContext,
} from './toolDef/context/toolContext';
import { wrapFailure, wrapNoResultFailure, wrapSuccess } from './helpers/resultCreators';
import { getSchemaForToolResponseResult, validateOrFail } from './helpers/zod';
import { isToolFailureResponse } from './helpers/typeGuards';
import { ToolPolicyMap } from './helpers';
import { ToolDefLifecycleFunction, VincentToolDef } from './toolDef/types';

/* eslint-disable @typescript-eslint/no-explicit-any */
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
 * based on schemas and supported policies.
 */
export function createVincentTool<
  ToolParamsSchema extends z.ZodType,
  const PkgNames extends string,
  const PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PolicyMapByPackageName extends PolicyMap['policyByPackageName'],
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
>(
  toolDef: VincentToolDef<
    ToolParamsSchema,
    PkgNames,
    PolicyMap,
    PolicyMapByPackageName,
    PrecheckSuccessSchema,
    PrecheckFailSchema,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    ToolDefLifecycleFunction<
      ToolParamsSchema,
      PolicyEvaluationResultContext<PolicyMapByPackageName>,
      PrecheckSuccessSchema,
      PrecheckFailSchema
    >,
    ToolDefLifecycleFunction<
      ToolParamsSchema,
      ToolExecutionPolicyContext<PolicyMapByPackageName>,
      ExecuteSuccessSchema,
      ExecuteFailSchema
    >
  >,
) {
  const { policyByPackageName } = toolDef.policyMap;

  const executeSuccessSchema = (toolDef.executeSuccessSchema ??
    z.undefined()) as ExecuteSuccessSchema;
  const executeFailSchema = (toolDef.executeFailSchema ?? z.undefined()) as ExecuteFailSchema;
  const execute: ToolLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyEvaluationResult<PolicyMapByPackageName>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  > = async (params, baseToolContext) => {
    try {
      const context = createExecutionToolContext({
        baseContext: baseToolContext,
        successSchema: executeSuccessSchema,
        failSchema: executeFailSchema,
        supportedPolicies: policyByPackageName as PolicyMapByPackageName,
      });

      const parsedToolParams = validateOrFail(
        params.toolParams,
        toolDef.toolParamsSchema,
        'execute',
        'input',
      );

      if (isToolFailureResponse(parsedToolParams)) {
        return wrapFailure(parsedToolParams);
      }

      const result = await toolDef.execute(parsedToolParams, {
        ...context,
        policiesContext: { ...context.policiesContext, allow: true },
      });

      const { schemaToUse } = getSchemaForToolResponseResult({
        value: result,
        successResultSchema: executeSuccessSchema,
        failureResultSchema: executeFailSchema,
      });

      const resultOrFailure = validateOrFail(result, schemaToUse, 'execute', 'output');

      if (isToolFailureResponse(resultOrFailure)) {
        return wrapFailure(resultOrFailure);
      }

      return wrapSuccess(resultOrFailure);
    } catch (err) {
      return wrapNoResultFailure(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const precheckSuccessSchema = (toolDef.precheckSuccessSchema ??
    z.undefined()) as PrecheckSuccessSchema;
  const precheckFailSchema = (toolDef.precheckFailSchema ?? z.undefined()) as PrecheckFailSchema;
  const precheck = toolDef.precheck
    ? ((async (params, baseToolContext) => {
        try {
          const context = createPrecheckToolContext({
            baseContext: baseToolContext,
            successSchema: precheckSuccessSchema,
            failSchema: precheckFailSchema,
          });

          const parsedToolParams = validateOrFail(
            params.toolParams,
            toolDef.toolParamsSchema,
            'precheck',
            'input',
          );

          if (isToolFailureResponse(parsedToolParams)) {
            return wrapFailure(parsedToolParams);
          }

          const { precheck: precheckFn } = toolDef;

          if (!precheckFn) {
            throw new Error('precheck function unexpectedly missing');
          }

          const result = await precheckFn(parsedToolParams, context);

          const { schemaToUse } = getSchemaForToolResponseResult({
            value: result,
            successResultSchema: precheckSuccessSchema,
            failureResultSchema: precheckFailSchema,
          });

          const resultOrFailure = validateOrFail(
            result as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema>,
            schemaToUse,
            'precheck',
            'output',
          );

          if (isToolFailureResponse(resultOrFailure)) {
            return wrapFailure(resultOrFailure);
          }

          return wrapSuccess(resultOrFailure);
        } catch (err) {
          return wrapNoResultFailure(err instanceof Error ? err.message : 'Unknown error');
        }
      }) as ToolLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PolicyMapByPackageName>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >)
    : undefined;

  return {
    execute,
    precheck,
    policyByPackageName,
    __schemaTypes: {
      precheckSuccessSchema: toolDef.precheckSuccessSchema,
      precheckFailSchema: toolDef.precheckFailSchema,
      executeSuccessSchema: toolDef.executeSuccessSchema,
      executeFailSchema: toolDef.executeFailSchema,
    },
  } as {
    policyByPackageName: typeof policyByPackageName;
    precheck: typeof precheck;
    execute: typeof execute;
    __schemaTypes: {
      precheckSuccessSchema: PrecheckSuccessSchema;
      precheckFailSchema: PrecheckFailSchema;
      executeSuccessSchema: ExecuteSuccessSchema;
      executeFailSchema: ExecuteFailSchema;
    };
  };
}
