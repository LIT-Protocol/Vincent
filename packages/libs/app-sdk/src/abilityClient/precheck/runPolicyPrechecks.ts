// src/lib/abilityClient/precheck/runPolicyPrechecks.ts

import { z } from 'zod';

import type {
  BaseContext,
  BaseAbilityContext,
  BundledVincentAbility,
  VincentAbility,
  SchemaValidationError,
} from '@lit-protocol/vincent-ability-sdk';
import type { AbilityPolicyMap } from '@lit-protocol/vincent-ability-sdk/internal';
import type { AbilityPolicyParameterData } from '@lit-protocol/vincent-contracts-sdk';

import {
  createDenyResult,
  getSchemaForPolicyResponseResult,
  isPolicyDenyResponse,
  validateOrDeny,
  validatePolicies,
} from '@lit-protocol/vincent-ability-sdk/internal';

import type { PolicyPrecheckResultContext } from './types';

import { createAllowPrecheckResult, createDenyPrecheckResult } from './resultCreators';

const bigintReplacer = (key: any, value: any) => {
  return typeof value === 'bigint' ? value.toString() : value;
};

export async function runAbilityPolicyPrechecks<
  const IpfsCid extends string,
  AbilityParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends AbilityPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
>(params: {
  bundledVincentAbility: BundledVincentAbility<
    VincentAbility<
      AbilityParamsSchema,
      PkgNames,
      PolicyMap,
      PoliciesByPackageName,
      ExecuteSuccessSchema,
      ExecuteFailSchema,
      PrecheckSuccessSchema,
      PrecheckFailSchema,
      any,
      any
    >,
    IpfsCid
  >;
  abilityParams: z.infer<AbilityParamsSchema>;
  context: BaseContext & { rpcUrl?: string };
  decodedPolicies: AbilityPolicyParameterData;
}): Promise<BaseAbilityContext<PolicyPrecheckResultContext<PoliciesByPackageName>>> {
  type Key = PkgNames & keyof PoliciesByPackageName;

  const {
    bundledVincentAbility: { vincentAbility, ipfsCid },
    abilityParams,
    context,
    decodedPolicies,
  } = params;

  console.log(
    'Executing runAbilityPolicyPrechecks()',
    Object.keys(params.bundledVincentAbility.vincentAbility.supportedPolicies.policyByPackageName)
  );

  const validatedPolicies = await validatePolicies({
    decodedPolicies,
    vincentAbility,
    abilityIpfsCid: ipfsCid,
    parsedAbilityParams: abilityParams,
  });

  const decodedPoliciesByPackageName: Record<string, Record<string, any> | undefined> = {};

  for (const { policyPackageName, parameters } of validatedPolicies) {
    decodedPoliciesByPackageName[policyPackageName as string] = parameters;
  }

  const evaluatedPolicies = [] as Key[];
  const allowedPolicies: {
    [K in Key]?: {
      result: PoliciesByPackageName[K]['__schemaTypes'] extends {
        precheckAllowResultSchema: infer Schema;
      }
        ? Schema extends z.ZodType
          ? z.infer<Schema>
          : never
        : never;
    };
  } = {};

  let deniedPolicy:
    | {
        packageName: Key;
        runtimeError?: string;
        schemaValidationError?: SchemaValidationError;
        result:
          | (PoliciesByPackageName[Key]['__schemaTypes'] extends {
              precheckDenyResultSchema: infer Schema;
            }
              ? Schema extends z.ZodType
                ? z.infer<Schema>
                : undefined
              : undefined)
          | undefined;
      }
    | undefined = undefined;

  const policyByName = vincentAbility.supportedPolicies.policyByPackageName as Record<
    keyof PoliciesByPackageName,
    (typeof vincentAbility.supportedPolicies.policyByPackageName)[keyof typeof vincentAbility.supportedPolicies.policyByPackageName]
  >;

  for (const { policyPackageName, abilityPolicyParams } of validatedPolicies) {
    const key = policyPackageName as keyof PoliciesByPackageName;
    const abilityPolicy = policyByName[key];

    evaluatedPolicies.push(key as Key);
    const vincentPolicy = abilityPolicy.vincentPolicy;

    if (!vincentPolicy.precheck) {
      console.log('No precheck() defined policy', key, 'skipping...');
      continue;
    }

    try {
      console.log('Executing precheck() for policy', key);
      const result = await vincentPolicy.precheck(
        {
          abilityParams: abilityPolicyParams,
          userParams: decodedPoliciesByPackageName[key as string] as unknown,
        },
        context
      );

      console.log('vincentPolicy.precheck() result', JSON.stringify(result, bigintReplacer, 2));

      // precheck() might have thrown a runtimeError or failed to parse the input
      if ((isPolicyDenyResponse(result) && result.runtimeError) || result.schemaValidationError) {
        deniedPolicy = {
          result: undefined,
          runtimeError: result.runtimeError,
          schemaValidationError: result.schemaValidationError,
          packageName: key as Key,
        };
        break;
      }

      const { schemaToUse } = getSchemaForPolicyResponseResult({
        value: result,
        allowResultSchema: vincentPolicy.precheckAllowResultSchema ?? z.undefined(),
        denyResultSchema: vincentPolicy.precheckDenyResultSchema ?? z.undefined(),
      });

      const validated = validateOrDeny(result.result, schemaToUse, 'precheck', 'output');

      if (isPolicyDenyResponse(result)) {
        // Return value from precheck was invalid in this case
        deniedPolicy = {
          runtimeError: result.runtimeError,
          schemaValidationError: result.schemaValidationError,
          result: validated,
          packageName: key as Key,
        };
        break;
      }

      allowedPolicies[key as Key] = {
        result: validated as PoliciesByPackageName[Key]['__schemaTypes'] extends {
          precheckAllowResultSchema: infer Schema;
        }
          ? Schema extends z.ZodType
            ? z.infer<Schema>
            : never
          : never,
      };
    } catch (err) {
      deniedPolicy = {
        packageName: key as Key,
        ...createDenyResult({
          runtimeError: err instanceof Error ? err.message : 'Unknown error in precheck()',
        }),
      };
      break;
    }
  }

  if (deniedPolicy) {
    const policiesContext = createDenyPrecheckResult(
      evaluatedPolicies,
      allowedPolicies as {
        [K in keyof PoliciesByPackageName]?: {
          result: PoliciesByPackageName[K]['__schemaTypes'] extends {
            precheckAllowResultSchema: infer Schema;
          }
            ? Schema extends z.ZodType
              ? z.infer<Schema>
              : never
            : never;
        };
      },
      deniedPolicy
    );

    return {
      ...context,
      policiesContext,
    };
  }

  const policiesContext = createAllowPrecheckResult(
    evaluatedPolicies,
    allowedPolicies as {
      [K in keyof PoliciesByPackageName]?: {
        result: PoliciesByPackageName[K]['__schemaTypes'] extends {
          precheckAllowResultSchema: infer Schema;
        }
          ? Schema extends z.ZodType
            ? z.infer<Schema>
            : never
          : never;
      };
    }
  );

  return {
    ...context,
    policiesContext,
  };
}
