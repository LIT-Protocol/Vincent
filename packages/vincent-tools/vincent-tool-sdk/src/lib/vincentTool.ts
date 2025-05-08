import { z } from 'zod';
import {
  BaseToolContext,
  ToolContext,
  VincentToolPolicy,
  VincentPolicyDef,
  VincentToolDef,
  PolicyEvaluationResultContext,
  ToolExecutionPolicyContext,
  YouMustCallContextSucceedOrFail,
  ToolExecutionPolicyEvaluationResult,
} from './types';

export interface CreateToolContextParams<
  SuccessSchema extends z.ZodType | undefined = undefined,
  FailSchema extends z.ZodType | undefined = undefined,
  Policies = Record<string, Record<string, unknown>>,
> {
  successSchema?: SuccessSchema;
  failSchema?: FailSchema;
  baseToolContext: BaseToolContext<Policies>;
}
export function createExecutionToolContext<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  PolicyArray extends readonly VincentToolPolicy<any, any, any>[],
  PolicyMapType extends Record<string, any>,
>(params: {
  baseContext: BaseToolContext<
    ToolExecutionPolicyEvaluationResult<PolicyMapType>
  >;
  successSchema?: SuccessSchema;
  failSchema?: FailSchema;
  supportedPolicies: unknown;
}): ToolContext<
  SuccessSchema,
  FailSchema,
  ToolExecutionPolicyContext<PolicyMapType>
> {
  const { baseContext, successSchema, failSchema, supportedPolicies } = params;

  const succeed = successSchema
    ? (((result) => ({
        success: true,
        result,
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['succeed'])
    : ((() => ({
        success: true,
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['succeed']);

  const fail = failSchema
    ? (((result, error) => ({
        success: false,
        result,
        ...(error ? { error } : {}),
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['fail'])
    : (((error?: string) => ({
        success: false,
        ...(error ? { error } : {}),
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['fail']);

  const map = supportedPolicies as PolicyMapType;

  const upgradedPoliciesContext: ToolExecutionPolicyContext<PolicyMapType> = {
    evaluatedPolicies: baseContext.policiesContext.evaluatedPolicies,
    allow: true,
    deniedPolicy: undefined as never,
    allowedPolicies: (Object.keys(map) as (keyof PolicyMapType)[]).reduce(
      (acc, key) => {
        const entry = baseContext.policiesContext.allowedPolicies[key] as
          | ToolExecutionPolicyContext<PolicyMapType>['allowedPolicies'][typeof key]
          | undefined;

        const policyDef = map[key]?.policyDef;

        if (entry && policyDef?.commit) {
          acc[key] = {
            ...entry,
            commit: policyDef.commit,
          };
        } else if (entry) {
          acc[key] = entry;
        }

        return acc;
      },
      {} as ToolExecutionPolicyContext<PolicyMapType>['allowedPolicies'],
    ),
  };

  return {
    ...baseContext,
    policiesContext: upgradedPoliciesContext,
    succeed,
    fail,
  };
}

export function createPrecheckToolContext<
  SuccessSchema extends z.ZodType | undefined,
  FailSchema extends z.ZodType | undefined,
  PolicyMap extends Record<
    string,
    {
      policyDef: VincentPolicyDef<
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any
      >;
    }
  >,
>(params: {
  baseContext: BaseToolContext<PolicyEvaluationResultContext<PolicyMap>>;
  successSchema?: SuccessSchema;
  failSchema?: FailSchema;
}): ToolContext<
  SuccessSchema,
  FailSchema,
  PolicyEvaluationResultContext<PolicyMap>
> {
  const { baseContext, successSchema, failSchema } = params;

  const succeed = successSchema
    ? (((result) => ({
        success: true,
        result,
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['succeed'])
    : ((() => ({
        success: true,
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['succeed']);

  const fail = failSchema
    ? (((result, error) => ({
        success: false,
        result,
        ...(error ? { error } : {}),
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['fail'])
    : (((error?: string) => ({
        success: false,
        ...(error ? { error } : {}),
        [YouMustCallContextSucceedOrFail]: 'ToolResponse',
      })) as ToolContext<SuccessSchema, FailSchema, any>['fail']);

  return {
    ...baseContext,
    succeed,
    fail,
  };
}

export function createPolicyMap<
  T extends readonly VincentToolPolicy<any, any, any>[],
  Pkgs extends
    T[number]['policyDef']['packageName'] = T[number]['policyDef']['packageName'],
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

export function createVincentTool<
  ToolParamsSchema extends z.ZodType,
  PolicyArray extends readonly VincentToolPolicy<
    ToolParamsSchema,
    VincentPolicyDef<
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any,
      any
    >
  >[],
  PkgNames extends
    PolicyArray[number]['policyDef']['packageName'] = PolicyArray[number]['policyDef']['packageName'],
  PolicyMapType extends Record<
    string,
    {
      policyDef: VincentPolicyDef<
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any,
        any
      >;
      __schemaTypes?: {
        evalAllowResultSchema?: z.ZodType;
        evalDenyResultSchema?: z.ZodType;
        commitParamsSchema?: z.ZodType;
        commitAllowResultSchema?: z.ZodType;
        commitDenyResultSchema?: z.ZodType;
      };
    }
  > = {
    [K in PkgNames]: Extract<
      PolicyArray[number],
      { policyDef: { packageName: K } }
    >;
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
            baseToolContext: BaseToolContext<
              PolicyEvaluationResultContext<PolicyMapType>
            >,
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

            return originalToolDef.precheck!(params, context);
          },
        }
      : { precheck: undefined }),

    execute: async (
      params: z.infer<ToolParamsSchema>,
      baseToolContext: BaseToolContext<
        ToolExecutionPolicyEvaluationResult<PolicyMapType>
      >,
    ) => {
      const context = createExecutionToolContext<
        ExecuteSuccessSchema,
        ExecuteFailSchema,
        PolicyArray,
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
    __schemaTypes: {
      precheckSuccessSchema: toolDef.precheckSuccessSchema,
      precheckFailSchema: toolDef.precheckFailSchema,
      executeSuccessSchema: toolDef.executeSuccessSchema,
      executeFailSchema: toolDef.executeFailSchema,
    },
  } as typeof wrappedToolDef & {
    __schemaTypes: {
      precheckSuccessSchema: PrecheckSuccessSchema;
      precheckFailSchema: PrecheckFailSchema;
      executeSuccessSchema: ExecuteSuccessSchema;
      executeFailSchema: ExecuteFailSchema;
    };
  };
}
