// src/lib/abilityCore/vincentAbility.ts

import { z } from 'zod';

import type {
  PolicyEvaluationResultContext,
  AbilityExecutionPolicyContext,
  AbilityExecutionPolicyEvaluationResult,
  AbilityLifecycleFunction,
  VincentAbility,
} from '../types';
import type { AbilityContext } from './abilityConfig/context/types';
import type { AbilityConfigLifecycleFunction, VincentAbilityConfig } from './abilityConfig/types';
import type { AbilityPolicyMap } from './helpers';

import { assertSupportedAbilityVersion } from '../assertSupportedAbilityVersion';
import { VINCENT_TOOL_API_VERSION } from '../constants';
import { bigintReplacer } from '../utils';
import {
  createExecutionAbilityContext,
  createPrecheckAbilityContext,
} from './abilityConfig/context/abilityContext';
import { wrapFailure, wrapNoResultFailure, wrapSuccess } from './helpers/resultCreators';
import { isAbilityFailureResult } from './helpers/typeGuards';
import { getSchemaForAbilityResult, validateOrFail } from './helpers/zod';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * The `createVincentAbility()` method is used to define an ability's lifecycle methods and ensure that arguments provided to the ability's
 * lifecycle methods, as well as their return values, are validated and fully type-safe by defining ZOD schemas for them.
 *
 *```typescript
 * const exampleSimpleAbility = createVincentAbility({
 *     packageName: '@lit-protocol/yesability@1.0.0',
 *     abilityDescription: 'Yes Ability description',
 *     abilityParamsSchema: testSchema,
 *     supportedPolicies: supportedPoliciesForAbility([testPolicy]),
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
 * @typeParam AbilityParamsSchema {@removeTypeParameterCompletely}
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
export function createVincentAbility<
  AbilityParamsSchema extends z.ZodType,
  const PkgNames extends string,
  const PolicyMap extends AbilityPolicyMap<any, PkgNames>,
  PolicyMapByPackageName extends PolicyMap['policyByPackageName'],
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
>(
  AbilityConfig: VincentAbilityConfig<
    AbilityParamsSchema,
    PkgNames,
    PolicyMap,
    PolicyMapByPackageName,
    PrecheckSuccessSchema,
    PrecheckFailSchema,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    AbilityConfigLifecycleFunction<
      AbilityParamsSchema,
      PolicyEvaluationResultContext<PolicyMapByPackageName>,
      PrecheckSuccessSchema,
      PrecheckFailSchema
    >,
    AbilityConfigLifecycleFunction<
      AbilityParamsSchema,
      AbilityExecutionPolicyContext<PolicyMapByPackageName>,
      ExecuteSuccessSchema,
      ExecuteFailSchema
    >
  >,
) {
  const { policyByPackageName, policyByIpfsCid } = AbilityConfig.supportedPolicies;

  for (const policyId in policyByIpfsCid) {
    const policy = policyByIpfsCid[policyId];
    const { vincentAbilityApiVersion } = policy;
    assertSupportedAbilityVersion(vincentAbilityApiVersion);
  }

  const executeSuccessSchema = (AbilityConfig.executeSuccessSchema ??
    z.undefined()) as ExecuteSuccessSchema;
  const executeFailSchema = (AbilityConfig.executeFailSchema ?? z.undefined()) as ExecuteFailSchema;
  const execute: AbilityLifecycleFunction<
    AbilityParamsSchema,
    AbilityExecutionPolicyEvaluationResult<PolicyMapByPackageName>,
    ExecuteSuccessSchema,
    ExecuteFailSchema
  > = async ({ abilityParams }, baseAbilityContext) => {
    try {
      const context: AbilityContext<
        ExecuteSuccessSchema,
        ExecuteFailSchema,
        AbilityExecutionPolicyContext<PolicyMapByPackageName>
      > = createExecutionAbilityContext({
        baseContext: baseAbilityContext,
        policiesByPackageName: policyByPackageName as PolicyMapByPackageName,
      });

      const parsedAbilityParams = validateOrFail(
        abilityParams,
        AbilityConfig.abilityParamsSchema,
        'execute',
        'input',
      );

      if (isAbilityFailureResult(parsedAbilityParams)) {
        // In this case, we have an invalid input to the ability -- return { success: fail, runtimeError, schemaValidationError }
        return parsedAbilityParams;
      }

      const result = await AbilityConfig.execute(
        { abilityParams: parsedAbilityParams },
        {
          ...context,
          policiesContext: { ...context.policiesContext, allow: true },
        },
      );

      console.log('AbilityConfig execute result', JSON.stringify(result, bigintReplacer));

      const { schemaToUse } = getSchemaForAbilityResult({
        value: result,
        successResultSchema: executeSuccessSchema,
        failureResultSchema: executeFailSchema,
      });

      const resultOrFailure = validateOrFail(result.result, schemaToUse, 'execute', 'output');

      if (isAbilityFailureResult(resultOrFailure)) {
        return resultOrFailure;
      }

      // We parsed the result -- it may be a success or a failure; return appropriately.
      if (isAbilityFailureResult(result)) {
        return wrapFailure(resultOrFailure);
      }

      return wrapSuccess(resultOrFailure);
    } catch (err) {
      return wrapNoResultFailure(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const precheckSuccessSchema = (AbilityConfig.precheckSuccessSchema ??
    z.undefined()) as PrecheckSuccessSchema;
  const precheckFailSchema = (AbilityConfig.precheckFailSchema ??
    z.undefined()) as PrecheckFailSchema;
  const { precheck: precheckFn } = AbilityConfig;

  const precheck = precheckFn
    ? ((async ({ abilityParams }, baseAbilityContext) => {
        try {
          const context: AbilityContext<
            PrecheckSuccessSchema,
            PrecheckFailSchema,
            PolicyEvaluationResultContext<PolicyMapByPackageName>
          > = createPrecheckAbilityContext({
            baseContext: baseAbilityContext,
          });

          const parsedAbilityParams = validateOrFail(
            abilityParams,
            AbilityConfig.abilityParamsSchema,
            'precheck',
            'input',
          );

          if (isAbilityFailureResult(parsedAbilityParams)) {
            return parsedAbilityParams;
          }

          const result = await precheckFn({ abilityParams }, context);

          console.log('AbilityConfig precheck result', JSON.stringify(result, bigintReplacer));
          const { schemaToUse } = getSchemaForAbilityResult({
            value: result,
            successResultSchema: precheckSuccessSchema,
            failureResultSchema: precheckFailSchema,
          });

          const resultOrFailure = validateOrFail(result.result, schemaToUse, 'precheck', 'output');

          if (isAbilityFailureResult(resultOrFailure)) {
            return resultOrFailure;
          }

          // We parsed the result successfully -- it may be a success or a failure, return appropriately
          if (isAbilityFailureResult(result)) {
            return wrapFailure(resultOrFailure, result.runtimeError);
          }

          return wrapSuccess(resultOrFailure);
        } catch (err) {
          return wrapNoResultFailure(err instanceof Error ? err.message : 'Unknown error');
        }
      }) as AbilityLifecycleFunction<
        AbilityParamsSchema,
        PolicyEvaluationResultContext<PolicyMapByPackageName>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >)
    : undefined;

  return {
    packageName: AbilityConfig.packageName,
    vincentAbilityApiVersion: VINCENT_TOOL_API_VERSION,
    abilityDescription: AbilityConfig.abilityDescription,
    execute,
    precheck,
    supportedPolicies: AbilityConfig.supportedPolicies,
    policyByPackageName,
    abilityParamsSchema: AbilityConfig.abilityParamsSchema,
    /** @hidden */
    __schemaTypes: {
      precheckSuccessSchema: AbilityConfig.precheckSuccessSchema,
      precheckFailSchema: AbilityConfig.precheckFailSchema,
      executeSuccessSchema: AbilityConfig.executeSuccessSchema,
      executeFailSchema: AbilityConfig.executeFailSchema,
    },
  } as VincentAbility<
    AbilityParamsSchema,
    PkgNames,
    PolicyMap,
    PolicyMapByPackageName,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    PrecheckSuccessSchema,
    PrecheckFailSchema
  >;
}
