// src/lib/toolCore/helpers/validatePolicies.ts

import { TypeOf, z } from 'zod';

import { VincentPolicyDef } from '../../types';
import { LIT_DATIL_VINCENT_ADDRESS } from '../../handlers/constants';
import { getAllUserPoliciesRegisteredForTool } from '../../policyCore/policyParameters/getOnchainPolicyParams';
import { mapPolicyIpfsCidToPackageNames } from './mapPolicyIpfsCidToPackageNames';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const validatePolicies = async <
  ToolParams extends z.ZodType<any, any, any>,
  Policies extends Record<
    string,
    {
      policyDef: VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>;
      toolParameterMappings: Partial<{ [K in keyof TypeOf<ToolParams>]: string }>;
    }
  >,
>({
  delegationRpcUrl,
  appDelegateeAddress,
  toolSupportedPolicies,
  parsedToolParams,
  toolIpfsCid,
  pkpTokenId,
}: {
  delegationRpcUrl: string;
  appDelegateeAddress: string;
  toolSupportedPolicies: Policies;
  parsedToolParams: TypeOf<ToolParams>;
  toolIpfsCid: string;
  pkpTokenId: string;
}) => {
  const { registeredUserPolicyIpfsCids, appId, appVersion } =
    await getAllUserPoliciesRegisteredForTool({
      delegationRpcUrl,
      vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
      appDelegateeAddress,
      agentWalletPkpTokenId: pkpTokenId,
      toolIpfsCid,
    });

  const policyIpfsCidToPackageName = mapPolicyIpfsCidToPackageNames({
    policies: toolSupportedPolicies,
  });

  // First we want to validate registeredUserPolicyIpfsCid is supported by this Tool,
  // then we want to validate we can map all the required policyParams to the provided parsedToolParams.
  // We do this before executing any policies to avoid having an error after some policies have already been executed.
  const validatedPolicies: Array<{
    policyPackageName: keyof Policies;
    policyParams: Record<string, unknown>;
  }> = [];

  for (const registeredUserPolicyIpfsCid of registeredUserPolicyIpfsCids) {
    const policyPackageName = policyIpfsCidToPackageName[registeredUserPolicyIpfsCid];

    if (!policyPackageName) {
      throw new Error(
        `Policy with IPFS CID ${registeredUserPolicyIpfsCid} is registered on-chain but not supported by this tool. Vincent Tool: ${toolIpfsCid}, App ID: ${appId.toString()}, App Version: ${appVersion.toString()}, Agent Wallet PKP Token ID: ${pkpTokenId} (vincentToolHandler)`,
      );
    }

    const policy = toolSupportedPolicies[policyPackageName];
    const policyParams: Record<string, unknown> = {};

    for (const [toolParamKey, policyParamKey] of Object.entries(policy.toolParameterMappings)) {
      if (!(toolParamKey in parsedToolParams)) {
        throw new Error(
          `Tool param "${toolParamKey}" expected in toolParams but was not provided (vincentToolHandler)`,
        );
      }

      // This shouldn't happen, if it does it means toolParameterMappings is malformed
      if (!policyParamKey) {
        throw new Error(
          `Policy "${policyPackageName as string}" is missing a corresponding policy parameter key for tool parameter: ${toolParamKey} (vincentToolHandler)`,
        );
      }

      policyParams[policyParamKey] = parsedToolParams[toolParamKey];
    }

    validatedPolicies.push({ policyPackageName, policyParams });
  }

  return validatedPolicies;
};
