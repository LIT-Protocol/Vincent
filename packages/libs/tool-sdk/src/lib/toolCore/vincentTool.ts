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
} from './toolConfig/context/toolContext';
import { wrapFailure, wrapNoResultFailure, wrapSuccess } from './helpers/resultCreators';
import { getSchemaForToolResult, validateOrFail } from './helpers/zod';
import { isToolFailureResult } from './helpers/typeGuards';
import { ToolPolicyMap } from './helpers';
import { ToolConfigLifecycleFunction, VincentToolConfig } from './toolConfig/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The `createVincentTool()` method is used to define a tool's lifecycle methods and ensure that arguments provided to the tool's
 * lifecycle methods, as well as their return values, are validated and fully type-safe by defining ZOD schemas for them.
 *
 *```typescript
 * const exampleSimpleTool = createVincentTool({
 *     packageName: '@lit-protocol/yestool@1.0.0',
 *     toolDescription: 'Yes Tool description',
 *     toolParamsSchema: testSchema,
 *     supportedPolicies: supportedPoliciesForTool([testPolicy]),
 *
 *     precheck: async (params, { succeed, fail }) => {
 *       // Should allow succeed() with no arguments
 *       succeed();
 *
 *       // Should allow fail() with string error
 *       fail('Error message');
 *
 *       // @ts-expect-error - Should not allow succeed() with arguments when no schema
 *       succeed({ message: 'test' });
 *
 *       // @ts-expect-error - Should not allow fail() with object when no schema
 *       fail({ error: 'test' });
 *
 *       return succeed();
 *     },
 *
 *     execute: async (params, { succeed }) => {
 *       // Should allow succeed() with no arguments
 *       succeed();
 *
 *       // @ts-expect-error - Should not allow succeed() with arguments when no schema
 *       return succeed({ data: 'test' });
 *     },
 *   });
 * ```
 *
 * @typeParam ToolParamsSchema {@removeTypeParameterCompletely}
 * @typeParam PkgNames {@removeTypeParameterCompletely}
 * @typeParam PolicyMap {@removeTypeParameterCompletely}
 * @typeParam PolicyMapByPackageName {@removeTypeParameterCompletely}
 * @typeParam PrecheckSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckFailSchema {@removeTypeParameterCompletely}
 * @typeParam ExecuteSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam ExecuteFailSchema {@removeTypeParameterCompletely}
 *
 * @category API Methods
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
  ToolConfig: VincentToolConfig<
    ToolParamsSchema,
    PkgNames,
    PolicyMap,
    PolicyMapByPackageName,
    PrecheckSuccessSchema,
    PrecheckFailSchema,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    ToolConfigLifecycleFunction<
      ToolParamsSchema,
      PolicyEvaluationResultContext<PolicyMapByPackageName>,
      PrecheckSuccessSchema,
      PrecheckFailSchema
    >,
    ToolConfigLifecycleFunction<
      ToolParamsSchema,
      ToolExecutionPolicyContext<PolicyMapByPackageName>,
      ExecuteSuccessSchema,
      ExecuteFailSchema
    >
  >,
) {
  const { policyByPackageName } = ToolConfig.supportedPolicies;

  const executeSuccessSchema = (ToolConfig.executeSuccessSchema ??
    z.undefined()) as ExecuteSuccessSchema;
  const executeFailSchema = (ToolConfig.executeFailSchema ?? z.undefined()) as ExecuteFailSchema;
  const execute: ToolLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyEvaluationResult<PolicyMapByPackageName>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  > = async ({ toolParams }, baseToolContext) => {
    try {
      const context = createExecutionToolContext({
        baseContext: baseToolContext,
        successSchema: ToolConfig.executeSuccessSchema,
        failSchema: ToolConfig.executeFailSchema,
        policiesByPackageName: policyByPackageName as PolicyMapByPackageName,
      });

      const parsedToolParams = validateOrFail(
        toolParams,
        ToolConfig.toolParamsSchema,
        'execute',
        'input',
      );

      if (isToolFailureResult(parsedToolParams)) {
        return parsedToolParams;
      }

      const result = await ToolConfig.execute(
        { toolParams: parsedToolParams },
        {
          ...context,
          policiesContext: { ...context.policiesContext, allow: true },
        },
      );

      console.log('ToolConfig execute result', result);

      const { schemaToUse } = getSchemaForToolResult({
        value: result,
        successResultSchema: executeSuccessSchema,
        failureResultSchema: executeFailSchema,
      });

      const resultOrFailure = validateOrFail(result.result, schemaToUse, 'execute', 'output');

      if (isToolFailureResult(resultOrFailure)) {
        return resultOrFailure;
      }

      // We parsed the result -- it may be a success or a failure; return appropriately.
      if (isToolFailureResult(result)) {
        return wrapFailure(resultOrFailure, result.error);
      }

      return wrapSuccess(resultOrFailure);
    } catch (err) {
      return wrapNoResultFailure(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const precheckSuccessSchema = (ToolConfig.precheckSuccessSchema ??
    z.undefined()) as PrecheckSuccessSchema;
  const precheckFailSchema = (ToolConfig.precheckFailSchema ?? z.undefined()) as PrecheckFailSchema;
  const { precheck: precheckFn } = ToolConfig;

  const precheck = precheckFn
    ? ((async ({ toolParams }, baseToolContext) => {
        try {
          const context = createPrecheckToolContext({
            baseContext: baseToolContext,
            successSchema: ToolConfig.precheckSuccessSchema,
            failSchema: ToolConfig.precheckFailSchema,
          });

          const parsedToolParams = validateOrFail(
            toolParams,
            ToolConfig.toolParamsSchema,
            'precheck',
            'input',
          );

          if (isToolFailureResult(parsedToolParams)) {
            return parsedToolParams;
          }

          const result = await precheckFn({ toolParams }, context);

          console.log('ToolConfig precheck result', JSON.stringify(result));
          const { schemaToUse } = getSchemaForToolResult({
            value: result,
            successResultSchema: precheckSuccessSchema,
            failureResultSchema: precheckFailSchema,
          });

          const resultOrFailure = validateOrFail(result.result, schemaToUse, 'precheck', 'output');

          if (isToolFailureResult(resultOrFailure)) {
            return resultOrFailure;
          }

          // We parsed the result successfully -- it may be a success or a failure, return appropriately
          if (isToolFailureResult(result)) {
            return wrapFailure(resultOrFailure, result.error);
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
    packageName: ToolConfig.packageName,
    toolDescription: ToolConfig.toolDescription,
    execute,
    precheck,
    supportedPolicies: ToolConfig.supportedPolicies,
    policyByPackageName,
    toolParamsSchema: ToolConfig.toolParamsSchema,
    /** @hidden */
    __schemaTypes: {
      precheckSuccessSchema: ToolConfig.precheckSuccessSchema,
      precheckFailSchema: ToolConfig.precheckFailSchema,
      executeSuccessSchema: ToolConfig.executeSuccessSchema,
      executeFailSchema: ToolConfig.executeFailSchema,
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
