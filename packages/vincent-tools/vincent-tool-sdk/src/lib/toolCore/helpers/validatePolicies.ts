// src/lib/toolCore/helpers/validatePolicies.ts

import { z } from 'zod';

import { VincentTool, VincentToolPolicy } from '../../types';
import { LIT_DATIL_VINCENT_ADDRESS } from '../../handlers/constants';
import { getPoliciesAndAppVersion } from '../../policyCore/policyParameters/getOnchainPolicyParams';
import { getMappedToolPolicyParams } from './getMappedToolPolicyParams';
import { Policy, PolicyParameter } from '../../policyCore/policyParameters/types';
import { ToolPolicyMap } from './createPolicyMapFromToolPolicies';

/* eslint-disable @typescript-eslint/no-explicit-any */

export type ValidatedPolicyMap<
  ParsedToolParams extends Record<string, any>,
  PoliciesByPackageName extends Record<string, VincentToolPolicy<any, any, any>>,
  Parameters extends PolicyParameter[] = Policy['parameters'],
> = Array<
  {
    [PkgName in keyof PoliciesByPackageName]: {
      parameters: Parameters;
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
  delegationRpcUrl,
  appDelegateeAddress,
  vincentTool,
  toolIpfsCid,
  pkpTokenId,
  parsedToolParams,
}: {
  delegationRpcUrl: string;
  appDelegateeAddress: string;
  vincentTool: VincentTool<
    ToolParamsSchema,
    keyof PoliciesByPackageName & string,
    PolicyMap,
    PoliciesByPackageName,
    any,
    any,
    any,
    any
  >;
  toolIpfsCid: string;
  pkpTokenId: string;
  parsedToolParams: z.infer<ToolParamsSchema>;
}): Promise<ValidatedPolicyMap<z.infer<ToolParamsSchema>, PoliciesByPackageName>> {
  const { policies, appId, appVersion } = await getPoliciesAndAppVersion({
    delegationRpcUrl,
    vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
    appDelegateeAddress,
    agentWalletPkpTokenId: pkpTokenId,
    toolIpfsCid,
  });

  const validatedPolicies: Array<{
    policyPackageName: keyof PoliciesByPackageName;
    toolPolicyParams: Record<string, unknown>;
    parameters: PolicyParameter[];
  }> = [];

  for (const policy of policies) {
    const { policyIpfsCid, parameters } = policy;
    const toolPolicy = vincentTool.policyMap.policyByIpfsCid[policyIpfsCid as string];

    if (!toolPolicy) {
      throw new Error(
        `Policy with IPFS CID ${policyIpfsCid} is registered on-chain but not supported by this tool. Vincent Tool: ${toolIpfsCid}, App ID: ${appId.toString()}, App Version: ${appVersion.toString()}, Agent Wallet PKP Token ID: ${pkpTokenId} (vincentToolHandler)`,
      );
    }

    const policyPackageName = toolPolicy.vincentPolicy.packageName;

    if (!toolPolicy.toolParameterMappings) {
      throw new Error('toolParameterMappings missing on policy');
    }

    const toolPolicyParams = getMappedToolPolicyParams({
      toolParameterMappings: toolPolicy.toolParameterMappings as Record<
        keyof typeof parsedToolParams,
        string
      >,
      parsedToolParams,
    }) as {
      [key: string]: unknown;
    };

    validatedPolicies.push({ parameters, policyPackageName, toolPolicyParams });
  }

  return validatedPolicies as ValidatedPolicyMap<z.infer<ToolParamsSchema>, PoliciesByPackageName>;
}
