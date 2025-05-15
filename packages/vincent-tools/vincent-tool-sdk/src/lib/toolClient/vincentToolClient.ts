// src/lib/toolClient/vincentToolClient.ts

import {
  PolicyEvaluationResultContext,
  ToolLifecycleFunction,
  VincentToolDef,
  VincentToolPolicy,
  VincentPolicyDef,
  ToolExecutionPolicyEvaluationResult,
  PolicyResponseDeny,
  BaseContext,
} from '../types';
import { z } from 'zod';
import { createVincentTool, EnrichedVincentToolPolicy } from '../toolCore/vincentTool';
import { createVincentPolicy } from '../policyCore';
import {
  validateOrDeny,
  getSchemaForPolicyResponseResult,
  isPolicyDenyResponse,
  createDenyResult,
  isPolicyAllowResponse,
} from '../policyCore/helpers';
import { validatePolicies } from '../toolCore/helpers';
import { BaseToolContext } from '../toolCore/toolContext/types';
import { getSchemaForToolResponseResult, validateOrFail } from '../toolCore/helpers/zod';
import { isToolFailureResponse } from '../toolCore/helpers/typeGuards';
import {
  createToolFailureResult,
  createToolSuccessResult,
} from '../toolCore/helpers/resultCreators';
import { ethers } from 'ethers';
import { decodePolicyParams } from '../policyCore/policyParameters/decodePolicyParams';
import type { EthersAbiDecodedValue } from '../policyCore/policyParameters/types';
import { YELLOWSTONE_PUBLIC_RPC } from '../constants';
import { getLitNodeClientInstance } from '../LitNodeClient/getLitNodeClient';
import type { LitNodeClient } from '@lit-protocol/lit-node-client';
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
  LitPKPResource,
} from '@lit-protocol/auth-helpers';
import { LIT_ABILITY, LIT_NETWORK } from '@lit-protocol/constants';

/* eslint-disable @typescript-eslint/no-explicit-any */

const generateSessionSigs = async ({
  litNodeClient,
  ethersSigner,
}: {
  litNodeClient: LitNodeClient;
  ethersSigner: ethers.Signer;
}) => {
  return litNodeClient.getSessionSigs({
    chain: 'ethereum',
    resourceAbilityRequests: [
      {
        resource: new LitPKPResource('*'),
        ability: LIT_ABILITY.PKPSigning,
      },
      {
        resource: new LitActionResource('*'),
        ability: LIT_ABILITY.LitActionExecution,
      },
    ],
    authNeededCallback: async ({ resourceAbilityRequests, uri }) => {
      const [walletAddress, nonce] = await Promise.all([
        ethersSigner.getAddress(),
        litNodeClient.getLatestBlockhash(),
      ]);

      const toSign = await createSiweMessageWithRecaps({
        uri: uri || 'http://localhost:3000',
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes,
        resources: resourceAbilityRequests || [],
        walletAddress,
        nonce,
        litNodeClient,
      });

      return await generateAuthSig({
        signer: ethersSigner,
        toSign,
      });
    },
  });
};

async function runToolPolicyPrechecks<
  ToolParamsSchema extends z.ZodType,
  PolicyArray extends readonly VincentToolPolicy<
    ToolParamsSchema,
    VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>
  >[],
>(args: {
  vincentToolDef: VincentToolDef<
    ToolParamsSchema,
    PolicyArray,
    string,
    Record<string, any>,
    z.ZodType | undefined,
    z.ZodType | undefined,
    z.ZodType | undefined,
    z.ZodType | undefined,
    ToolLifecycleFunction<any, any, any, any> | undefined,
    ToolLifecycleFunction<any, any, any, any>
  >;
  toolParams: unknown;
  context: BaseContext & {
    rpcUrl?: string;
    toolIpfsCid: string;
  };
}): Promise<{
  allow: boolean;
  evaluatedPolicies: string[];
  allowedPolicies: Record<string, unknown>;
  deniedPolicy?: PolicyResponseDeny<any> & { packageName: string };
}> {
  const { vincentToolDef, toolParams, context } = args;
  const vincentTool = createVincentTool(vincentToolDef);

  const parsedToolParams = vincentToolDef.toolParamsSchema.parse(toolParams);

  const validatedPolicies = await validatePolicies({
    delegationRpcUrl: context.rpcUrl ?? YELLOWSTONE_PUBLIC_RPC,
    appDelegateeAddress: context.delegation.delegatee,
    vincentToolDef,
    parsedToolParams,
    toolIpfsCid: context.toolIpfsCid,
    pkpTokenId: context.delegation.delegator,
  });

  const decodedPoliciesByPackageName: Record<string, Record<string, EthersAbiDecodedValue>> = {};

  for (const { policyPackageName, parameters } of validatedPolicies) {
    decodedPoliciesByPackageName[policyPackageName] = decodePolicyParams({ params: parameters });
  }

  const evaluatedPolicies: string[] = [];
  const allowedPolicies: Record<string, unknown> = {};
  let deniedPolicy: ({ packageName: string } & PolicyResponseDeny<any>) | undefined = undefined;

  for (const { policyPackageName, toolPolicyParams } of validatedPolicies) {
    evaluatedPolicies.push(policyPackageName);
    const toolPolicy = vincentTool.supportedPolicies[policyPackageName];
    const policy = createVincentPolicy(toolPolicy.policyDef);

    if (!policy.precheck) continue;

    try {
      const result = await policy.precheck(
        {
          toolParams: toolPolicyParams,
          userParams: decodedPoliciesByPackageName[policyPackageName] as any,
        },
        {
          delegation: {
            delegatee: context.delegation.delegatee,
            delegator: context.delegation.delegator,
          },
        },
      );

      const { schemaToUse } = getSchemaForPolicyResponseResult({
        value: result,
        allowResultSchema: toolPolicy.policyDef.precheckAllowResultSchema,
        denyResultSchema: toolPolicy.policyDef.precheckDenyResultSchema,
      });

      const validated = validateOrDeny(
        result,
        schemaToUse,
        toolPolicy.policyDef.ipfsCid,
        'precheck',
        'output',
      );

      if (isPolicyDenyResponse(validated)) {
        deniedPolicy = {
          ...validated,
          packageName: policyPackageName,
        };
        break;
      } else if (isPolicyAllowResponse(validated)) {
        allowedPolicies[policyPackageName] = { result: validated.result };
      }
    } catch (err) {
      deniedPolicy = {
        packageName: policyPackageName,
        ...createDenyResult({
          ipfsCid: toolPolicy.policyDef.ipfsCid,
          message: err instanceof Error ? err.message : 'Unknown error in precheck()',
        }),
      };
      break;
    }
  }

  if (deniedPolicy) {
    return {
      allow: false,
      evaluatedPolicies,
      allowedPolicies,
      deniedPolicy,
    };
  }

  return {
    allow: true,
    evaluatedPolicies,
    allowedPolicies,
  };
}

export function createVincentToolClient<
  ToolParamsSchema extends z.ZodType,
  PolicyArray extends readonly VincentToolPolicy<
    ToolParamsSchema,
    VincentPolicyDef<any, any, any, any, any, any, any, any, any, any, any, any, any>
  >[],
  PkgNames extends
    PolicyArray[number]['policyDef']['packageName'] = PolicyArray[number]['policyDef']['packageName'],
  PolicyMapType extends Record<string, EnrichedVincentToolPolicy> = {
    [K in PkgNames]: Extract<PolicyArray[number], { policyDef: { packageName: K } }>;
  },
  PrecheckSuccessSchema extends z.ZodType | undefined = undefined,
  PrecheckFailSchema extends z.ZodType | undefined = undefined,
  ExecuteSuccessSchema extends z.ZodType | undefined = undefined,
  ExecuteFailSchema extends z.ZodType | undefined = undefined,
  PrecheckFn extends
    | ToolLifecycleFunction<
        ToolParamsSchema,
        PolicyEvaluationResultContext<PolicyMapType>,
        PrecheckSuccessSchema,
        PrecheckFailSchema
      >
    | undefined = undefined,
  ExecuteFn extends ToolLifecycleFunction<
    ToolParamsSchema,
    ToolExecutionPolicyEvaluationResult<PolicyMapType>, // no ToolExecutionPolicyContext needed here
    ExecuteSuccessSchema,
    ExecuteFailSchema
  > = ToolLifecycleFunction<ToolParamsSchema, any, ExecuteSuccessSchema, ExecuteFailSchema>,
>({
  vincentToolDef,
  ethersSigner,
}: {
  vincentToolDef: VincentToolDef<
    ToolParamsSchema,
    PolicyArray,
    PkgNames,
    PolicyMapType,
    PrecheckSuccessSchema,
    PrecheckFailSchema,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    PrecheckFn,
    ExecuteFn
  >;
  ethersSigner: ethers.Signer;
}) {
  const vincentTool = createVincentTool(vincentToolDef);
  const network = LIT_NETWORK.Datil;

  return {
    async precheck(
      rawToolParams: unknown,
      { rpcUrl, delegator }: { rpcUrl?: string; toolIpfsCid: string; delegator: string },
    ) {
      const delegatee = ethers.utils.getAddress(await ethersSigner.getAddress());
      const toolIpfsCid = vincentToolDef.ipfsCid;

      const policiesContext: PolicyEvaluationResultContext<PolicyMapType> =
        (await runToolPolicyPrechecks({
          vincentToolDef,
          toolParams: rawToolParams,
          context: {
            rpcUrl,
            toolIpfsCid,
            delegation: {
              delegator,
              delegatee,
            },
          },
        })) as PolicyEvaluationResultContext<PolicyMapType>;

      if (!vincentTool.precheck) {
        return createToolSuccessResult();
      }

      return vincentTool.precheck(rawToolParams, {
        policiesContext,
        delegation: { delegator, delegatee },
      });
    },

    async execute(rawToolParams: unknown, context: BaseToolContext<any>) {
      const parsedParams = validateOrFail(
        rawToolParams,
        vincentToolDef.toolParamsSchema,
        'execute',
        'input',
      );

      if (isToolFailureResponse(parsedParams)) return parsedParams;

      const ipfsCid = vincentToolDef.ipfsCid;
      const delegatee = ethers.utils.getAddress(await ethersSigner.getAddress());

      const litNodeClient = await getLitNodeClientInstance({ network });
      const sessionSigs = await generateSessionSigs({ ethersSigner, litNodeClient });

      const result = await litNodeClient.executeJs({
        ipfsId: ipfsCid,
        sessionSigs: sessionSigs,
        jsParams: { toolParams: { ...parsedParams }, context: { ...context, delegatee } },
      });

      const { success, response } = result;

      if (success !== true) {
        return createToolFailureResult({
          message: `Remote tool failed with unknown error: ${JSON.stringify(response)}`,
        });
      }

      if (typeof response === 'string') {
        return createToolFailureResult({
          message: `Remote tool returned invalid JSON:  ${response}`,
        });
      }

      const { schemaToUse } = getSchemaForToolResponseResult({
        value: response,
        successResultSchema: vincentToolDef.executeSuccessSchema,
        failureResultSchema: vincentToolDef.executeFailSchema,
      });

      return validateOrFail(response, schemaToUse, 'execute', 'output');
    },
  };
}
