// src/lib/toolCore/helpers/validatePolicies.ts

import type { z } from 'zod';

import type { ToolPolicyParameterData } from '@lit-protocol/vincent-contracts-sdk';

import type { VincentTool, VincentToolPolicy } from '../../types';
import type { ToolPolicyMap } from './supportedPoliciesForTool';

import { getMappedToolPolicyParams } from './getMappedToolPolicyParams';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ValidatedPolicyMap<
  ParsedToolParams extends Record<string, any>,
  PoliciesByPackageName extends Record<string, VincentToolPolicy<any, any, any>>,
> = Array<
  {
    [PkgName in keyof PoliciesByPackageName]: {
      parameters:
        | {
            [paramName: string]: any;
          }
        | undefined;
      policyPackageName: PkgName;
      toolPolicyParams: {
        [PolicyParamKey in PoliciesByPackageName[PkgName]['toolParameterMappings'][keyof PoliciesByPackageName[PkgName]['toolParameterMappings']] &
          string]: ParsedToolParams[{
          [ToolParamKey in keyof PoliciesByPackageName[PkgName]['toolParameterMappings']]: PoliciesByPackageName[PkgName]['toolParameterMappings'][ToolParamKey] extends PolicyParamKey
            ? ToolParamKey
            : never;
        }[keyof PoliciesByPackageName[PkgName]['toolParameterMappings']] &
          keyof ParsedToolParams];
      };
    };
  }[keyof PoliciesByPackageName]
>;

export async function validatePolicies<
  ToolParamsSchema extends z.ZodType,
  PolicyMap extends ToolPolicyMap<any, any>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
>({
  decodedPolicies,
  vincentTool,
  toolIpfsCid,
  parsedToolParams,
}: {
  decodedPolicies: ToolPolicyParameterData;
  vincentTool: VincentTool<
    ToolParamsSchema,
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
  toolIpfsCid: string;
  parsedToolParams: z.infer<ToolParamsSchema>;
}): Promise<ValidatedPolicyMap<z.infer<ToolParamsSchema>, PoliciesByPackageName>> {
  const validatedPolicies: Array<{
    policyPackageName: keyof PoliciesByPackageName;
    toolPolicyParams: Record<string, unknown>;
    parameters:
      | {
          [paramName: string]: any;
        }
      | undefined;
  }> = [];

  for (const policyIpfsCid of Object.keys(decodedPolicies)) {
    const toolPolicy = vincentTool.supportedPolicies.policyByIpfsCid[policyIpfsCid];

    console.log(
      'vincentTool.supportedPolicies',
      Object.keys(vincentTool.supportedPolicies.policyByIpfsCid),
    );
    if (!toolPolicy) {
      throw new Error(
        `Policy with IPFS CID ${policyIpfsCid} is registered on-chain but not supported by this tool. Vincent Tool: ${toolIpfsCid}`,
      );
    }

    const policyPackageName = toolPolicy.vincentPolicy.packageName;

    if (!toolPolicy.toolParameterMappings) {
      throw new Error('toolParameterMappings missing on policy');
    }

    console.log(
      'toolPolicy.toolParameterMappings',
      JSON.stringify(toolPolicy.toolParameterMappings),
    );
    const toolPolicyParams = getMappedToolPolicyParams({
      toolParameterMappings: toolPolicy.toolParameterMappings as Record<
        keyof typeof parsedToolParams,
        string
      >,
      parsedToolParams,
    }) as {
      [key: string]: unknown;
    };

    validatedPolicies.push({
      parameters: decodedPolicies[policyIpfsCid] || {},
      policyPackageName,
      toolPolicyParams,
    });
  }

  return validatedPolicies as ValidatedPolicyMap<z.infer<ToolParamsSchema>, PoliciesByPackageName>;
}
