// src/lib/toolCore/vincentTool.ts

import { z } from 'zod';
import {
  PolicyEvaluationResultContext,
  ToolExecutionPolicyContext,
  ToolExecutionPolicyEvaluationResult,
  ToolLifecycleFunction,
  VincentTool,
} from '../types';
import {
  createExecutionToolContext,
  createPrecheckToolContext,
} from './toolDef/context/toolContext';
import { wrapFailure, wrapNoResultFailure, wrapSuccess } from './helpers/resultCreators';
import { getSchemaForToolResult, validateOrFail } from './helpers/zod';
import { isToolFailureResult } from './helpers/typeGuards';
import { ToolPolicyMap } from './helpers';
import { ToolDefLifecycleFunction, VincentToolDef } from './toolDef/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

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
  const { policyByPackageName } = toolDef.supportedPolicies;

  const executeSuccessSchema = (toolDef.executeSuccessSchema ??
    z.undefined()) as ExecuteSuccessSchema;
  const executeFailSchema = (toolDef.executeFailSchema ?? z.undefined()) as ExecuteFailSchema;
  const execute: ToolLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyEvaluationResult<PolicyMapByPackageName>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  > = async ({ toolParams }, baseToolContext) => {
    try {
      const context = createExecutionToolContext({
        baseContext: baseToolContext,
        successSchema: executeSuccessSchema,
        failSchema: executeFailSchema,
        policiesByPackageName: policyByPackageName as PolicyMapByPackageName,
      });

      const parsedToolParams = validateOrFail(
        toolParams,
        toolDef.toolParamsSchema,
        'execute',
        'input',
      );

      if (isToolFailureResult(parsedToolParams)) {
        return wrapFailure(parsedToolParams);
      }

      const result = await toolDef.execute(
        { toolParams: parsedToolParams },
        {
          ...context,
          policiesContext: { ...context.policiesContext, allow: true },
        },
      );

      console.log('toolDef execute result', result);

      const { schemaToUse } = getSchemaForToolResult({
        value: result,
        successResultSchema: executeSuccessSchema,
        failureResultSchema: executeFailSchema,
      });

      const resultOrFailure = validateOrFail(result.result, schemaToUse, 'execute', 'output');

      if (isToolFailureResult(resultOrFailure)) {
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
  const { precheck: precheckFn } = toolDef;

  const precheck = precheckFn
    ? ((async ({ toolParams }, baseToolContext) => {
        try {
          const context = createPrecheckToolContext({
            baseContext: baseToolContext,
            successSchema: precheckSuccessSchema,
            failSchema: precheckFailSchema,
          });

          const parsedToolParams = validateOrFail(
            toolParams,
            toolDef.toolParamsSchema,
            'precheck',
            'input',
          );

          if (isToolFailureResult(parsedToolParams)) {
            return wrapFailure(parsedToolParams);
          }

          const result = await precheckFn({ toolParams }, context);

          console.log('toolDef precheck result', JSON.stringify(result));
          const { schemaToUse } = getSchemaForToolResult({
            value: result.result,
            successResultSchema: precheckSuccessSchema,
            failureResultSchema: precheckFailSchema,
          });

          const resultOrFailure = validateOrFail(result.result, schemaToUse, 'precheck', 'output');

          if (isToolFailureResult(resultOrFailure)) {
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
    packageName: toolDef.packageName,
    execute,
    precheck,
    supportedPolicies: toolDef.supportedPolicies,
    policyByPackageName,
    toolParamsSchema: toolDef.toolParamsSchema,
    __schemaTypes: {
      precheckSuccessSchema: toolDef.precheckSuccessSchema,
      precheckFailSchema: toolDef.precheckFailSchema,
      executeSuccessSchema: toolDef.executeSuccessSchema,
      executeFailSchema: toolDef.executeFailSchema,
    },
  } as VincentTool<
    ToolParamsSchema,
    PkgNames,
    PolicyMap,
    PolicyMapByPackageName,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    PrecheckSuccessSchema,
    PrecheckFailSchema
  >;
}
