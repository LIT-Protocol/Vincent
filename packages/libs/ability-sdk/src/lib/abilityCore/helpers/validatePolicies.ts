// src/lib/abilityCore/helpers/validatePolicies.ts

import type { z } from 'zod';

import type { AbilityPolicyParameterData } from '@lit-protocol/vincent-contracts-sdk';

import type { VincentAbility, VincentAbilityPolicy } from '../../types';
import type { AbilityPolicyMap } from './supportedPoliciesForAbility';

import { getMappedAbilityPolicyParams } from './getMappedAbilityPolicyParams';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ValidatedPolicyMap<
  ParsedAbilityParams extends Record<string, any>,
  PoliciesByPackageName extends Record<string, VincentAbilityPolicy<any, any, any>>,
> = Array<
  {
    [PkgName in keyof PoliciesByPackageName]: {
      parameters:
        | {
            [paramName: string]: any;
          }
        | undefined;
      policyPackageName: PkgName;
      abilityPolicyParams: {
        [PolicyParamKey in PoliciesByPackageName[PkgName]['abilityParameterMappings'][keyof PoliciesByPackageName[PkgName]['abilityParameterMappings']] &
          string]: ParsedAbilityParams[{
          [AbilityParamKey in keyof PoliciesByPackageName[PkgName]['abilityParameterMappings']]: PoliciesByPackageName[PkgName]['abilityParameterMappings'][AbilityParamKey] extends PolicyParamKey
            ? AbilityParamKey
            : never;
        }[keyof PoliciesByPackageName[PkgName]['abilityParameterMappings']] &
          keyof ParsedAbilityParams];
      };
    };
  }[keyof PoliciesByPackageName]
>;

export async function validatePolicies<
  AbilityParamsSchema extends z.ZodType,
  PolicyMap extends AbilityPolicyMap<any, any>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
>({
  decodedPolicies,
  vincentAbility,
  abilityIpfsCid,
  parsedAbilityParams,
}: {
  decodedPolicies: AbilityPolicyParameterData;
  vincentAbility: VincentAbility<
    AbilityParamsSchema,
    keyof PoliciesByPackageName & string,
    PolicyMap,
    PoliciesByPackageName,
    any,
    any,
    any,
    any,
    any,
    any
  >;
  abilityIpfsCid: string;
  parsedAbilityParams: z.infer<AbilityParamsSchema>;
}): Promise<ValidatedPolicyMap<z.infer<AbilityParamsSchema>, PoliciesByPackageName>> {
  const validatedPolicies: Array<{
    policyPackageName: keyof PoliciesByPackageName;
    abilityPolicyParams: Record<string, unknown>;
    parameters:
      | {
          [paramName: string]: any;
        }
      | undefined;
  }> = [];

  for (const policyIpfsCid of Object.keys(decodedPolicies)) {
    const abilityPolicy = vincentAbility.supportedPolicies.policyByIpfsCid[policyIpfsCid];

    console.log(
      'vincentAbility.supportedPolicies',
      Object.keys(vincentAbility.supportedPolicies.policyByIpfsCid),
    );
    if (!abilityPolicy) {
      throw new Error(
        `Policy with IPFS CID ${policyIpfsCid} is registered on-chain but not supported by this ability. Vincent Ability: ${abilityIpfsCid}`,
      );
    }

    const policyPackageName = abilityPolicy.vincentPolicy.packageName;

    if (!abilityPolicy.abilityParameterMappings) {
      throw new Error('abilityParameterMappings missing on policy');
    }

    console.log(
      'abilityPolicy.abilityParameterMappings',
      JSON.stringify(abilityPolicy.abilityParameterMappings),
    );
    const abilityPolicyParams = getMappedAbilityPolicyParams({
      abilityParameterMappings: abilityPolicy.abilityParameterMappings as Record<
        keyof typeof parsedAbilityParams,
        string
      >,
      parsedAbilityParams,
    }) as {
      [key: string]: unknown;
    };

    validatedPolicies.push({
      parameters: decodedPolicies[policyIpfsCid] || {},
      policyPackageName,
      abilityPolicyParams,
    });
  }

  return validatedPolicies as ValidatedPolicyMap<
    z.infer<AbilityParamsSchema>,
    PoliciesByPackageName
  >;
}
