// src/lib/toolCore/helpers/validatePolicies.ts

import { z } from 'zod';

import { VincentPolicyDef, VincentToolDef, VincentToolPolicy } from '../../types';
import { LIT_DATIL_VINCENT_ADDRESS } from '../../handlers/constants';
import { getPoliciesAndAppVersion } from '../../policyCore/policyParameters/getOnchainPolicyParams';
import { mapPolicyIpfsCidToPackageNames } from './mapPolicyIpfsCidToPackageNames';
import { getMappedToolPolicyParams } from './getMappedToolPolicyParams';
import { createVincentTool, EnrichedVincentToolPolicy } from '../vincentTool';
import { Policy, PolicyParameter } from '../../policyCore/policyParameters/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ValidatedPolicyMap<
  ParsedToolParams extends Record<string, any>,
  PolicyMapType extends Record<string, EnrichedVincentToolPolicy>,
  Parameters extends PolicyParameter[] = Policy['parameters'],
> = Array<
  {
    [PkgName in keyof PolicyMapType]: {
      parameters: Parameters;
      policyPackageName: PkgName;
      toolPolicyParams: {
        [PolicyParamKey in PolicyMapType[PkgName]['toolParameterMappings'][keyof PolicyMapType[PkgName]['toolParameterMappings']] &
          string]: ParsedToolParams[{
          [ToolParamKey in keyof PolicyMapType[PkgName]['toolParameterMappings']]: PolicyMapType[PkgName]['toolParameterMappings'][ToolParamKey] extends PolicyParamKey
            ? ToolParamKey
            : never;
        }[keyof PolicyMapType[PkgName]['toolParameterMappings']] &
          keyof ParsedToolParams];
      };
    };
  }[keyof PolicyMapType]
>;

export async function validatePolicies<
  ToolParamsSchema extends z.ZodType,
  PolicyArray extends readonly VincentToolPolicy<
    ToolParamsSchema,
    VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>
  >[],
  PolicyMapType extends Record<string, EnrichedVincentToolPolicy> = {
    [K in PolicyArray[number]['policyDef']['packageName']]: Extract<
      PolicyArray[number],
      { policyDef: { packageName: K } }
    >;
  },
>({
  delegationRpcUrl,
  appDelegateeAddress,
  vincentToolDef,
  toolIpfsCid,
  pkpTokenId,
  parsedToolParams,
}: {
  delegationRpcUrl: string;
  appDelegateeAddress: string;
  vincentToolDef: VincentToolDef<
    ToolParamsSchema,
    PolicyArray,
    PolicyArray[number]['policyDef']['packageName'],
    PolicyMapType,
    any,
    any,
    any,
    any,
    any,
    any
  >;
  toolIpfsCid: string;
  pkpTokenId: string;
  parsedToolParams: z.infer<ToolParamsSchema>;
}): Promise<ValidatedPolicyMap<z.infer<ToolParamsSchema>, PolicyMapType>> {
  const { policies, appId, appVersion } = await getPoliciesAndAppVersion({
    delegationRpcUrl,
    vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
    appDelegateeAddress,
    agentWalletPkpTokenId: pkpTokenId,
    toolIpfsCid,
  });

  const policyIpfsCidToPackageName: Record<string, keyof PolicyMapType> =
    mapPolicyIpfsCidToPackageNames({
      vincentToolDef,
    });

  // First we want to validate registeredUserPolicyIpfsCid is supported by this Tool,
  // then we want to validate we can map all the required policyParams to the provided parsedToolParams.
  // We do this before executing any policies to avoid having an error after some policies have already been executed.
  const validatedPolicies: Array<{
    policyPackageName: keyof PolicyMapType;
    toolPolicyParams: Record<string, unknown>;
    parameters: PolicyParameter[];
  }> = [];

  for (const policy of policies) {
    const { policyIpfsCid, parameters } = policy;

    const policyPackageName = policyIpfsCidToPackageName[policyIpfsCid as string];

    if (!policyPackageName) {
      throw new Error(
        `Policy with IPFS CID ${policyIpfsCid} is registered on-chain but not supported by this tool. Vincent Tool: ${toolIpfsCid}, App ID: ${appId.toString()}, App Version: ${appVersion.toString()}, Agent Wallet PKP Token ID: ${pkpTokenId} (vincentToolHandler)`,
      );
    }

    const vincentTool = createVincentTool(vincentToolDef);
    const toolPolicy = vincentTool.supportedPolicies[policyPackageName];

    type MappedPolicyParams<
      ParsedParams extends Record<string, any>,
      Mapping extends Partial<Record<keyof ParsedParams, string>>,
    > = {
      [PolicyParamKey in Mapping[keyof Mapping] & string]: ParsedParams[{
        [ToolParamKey in keyof Mapping]: Mapping[ToolParamKey] extends PolicyParamKey
          ? ToolParamKey
          : never;
      }[keyof Mapping] &
        keyof ParsedParams];
    };

    if (!toolPolicy.toolParameterMappings) {
      throw new Error('toolParameterMappings missing on policy');
    }

    const toolPolicyParams = getMappedToolPolicyParams({
      toolParameterMappings: toolPolicy.toolParameterMappings as Record<
        keyof typeof parsedToolParams,
        string
      >,
      parsedToolParams,
    }) as MappedPolicyParams<
      typeof parsedToolParams,
      Record<keyof typeof parsedToolParams, string>
    >;

    validatedPolicies.push({ parameters, policyPackageName, toolPolicyParams });
  }

  return validatedPolicies as ValidatedPolicyMap<z.infer<ToolParamsSchema>, PolicyMapType>;
}
