// src/lib/toolClient/vincentToolClient.ts

import { z } from 'zod';

import { ethers } from 'ethers';

import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
  LitPKPResource,
} from '@lit-protocol/auth-helpers';

import { LIT_ABILITY, LIT_NETWORK } from '@lit-protocol/constants';

import type { LitNodeClient } from '@lit-protocol/lit-node-client';

import {
  getPkpInfo,
  type ToolPolicyMap,
} from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers';
import type {
  VincentTool,
  PolicyEvaluationResultContext,
  ToolConsumerContext,
} from '@lit-protocol/vincent-tool-sdk';

import { getPoliciesAndAppVersion } from '@lit-protocol/vincent-tool-sdk/src/lib/policyCore/policyParameters/getOnchainPolicyParams';
import { validatePolicies } from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers/validatePolicies';
import type { DecodedValues } from '@lit-protocol/vincent-tool-sdk/src/lib/policyCore/policyParameters/types';
import { decodePolicyParams } from '@lit-protocol/vincent-tool-sdk/src/lib/policyCore/policyParameters/decodePolicyParams';
import { YELLOWSTONE_PUBLIC_RPC } from '@lit-protocol/vincent-tool-sdk/src/lib/constants';
import {
  LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
  LIT_DATIL_VINCENT_ADDRESS,
} from '@lit-protocol/vincent-tool-sdk/src/lib/handlers/constants';

import {
  createDenyResult,
  getSchemaForPolicyResponseResult,
  isPolicyAllowResponse,
  isPolicyDenyResponse,
  validateOrDeny,
} from '@lit-protocol/vincent-tool-sdk/src/lib/policyCore/helpers';

import { createToolSuccessResult } from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers/resultCreators';

import {
  getSchemaForToolResult,
  validateOrFail,
} from '@lit-protocol/vincent-tool-sdk/src/lib/toolCore/helpers/zod';

import { getLitNodeClientInstance } from '../internal/LitNodeClient/getLitNodeClient';

import {
  createAllowEvaluationResult,
  createDenyEvaluationResult,
  createToolResponseFailureNoResult,
} from './resultCreators';
import { type RemoteVincentToolExecutionResult, ToolResponse } from './types';
import { isToolResponseFailure } from './typeGuards';
import type { BaseToolContext } from '@lit-protocol/vincent-tool-sdk/dist/lib/toolCore/toolDef/context/types';

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
      { resource: new LitPKPResource('*'), ability: LIT_ABILITY.PKPSigning },
      { resource: new LitActionResource('*'), ability: LIT_ABILITY.LitActionExecution },
    ],
    authNeededCallback: async ({ resourceAbilityRequests, uri }) => {
      const [walletAddress, nonce] = await Promise.all([
        ethersSigner.getAddress(),
        litNodeClient.getLatestBlockhash(),
      ]);

      const toSign = await createSiweMessageWithRecaps({
        uri: uri || 'http://localhost:3000',
        expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
        resources: resourceAbilityRequests || [],
        walletAddress,
        nonce,
        litNodeClient,
      });

      return await generateAuthSig({ signer: ethersSigner, toSign });
    },
  });
};

async function runToolPolicyPrechecks<
  ToolParamsSchema extends z.ZodType,
  const PkgNames extends string,
  PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
>(args: {
  vincentTool: VincentTool<
    ToolParamsSchema,
    PkgNames,
    PolicyMap,
    PoliciesByPackageName,
    any,
    any,
    any,
    any
  >;
  toolParams: unknown;
  context: ToolConsumerContext & { delegateePkpEthAddress: string; rpcUrl?: string };
}): Promise<BaseToolContext<PolicyEvaluationResultContext<PoliciesByPackageName>>> {
  type Key = PkgNames & keyof PoliciesByPackageName;

  const {
    vincentTool,
    toolParams,
    context: { delegateePkpEthAddress, delegatorPkpEthAddress, rpcUrl, toolIpfsCid },
  } = args;

  const parsedToolParams = vincentTool.toolParamsSchema.parse(toolParams);

  const userPkpInfo = await getPkpInfo({
    litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
    yellowstoneRpcUrl: 'https://yellowstone-rpc.litprotocol.com/',
    pkpEthAddress: delegatorPkpEthAddress,
  });

  const { policies, appId, appVersion } = await getPoliciesAndAppVersion({
    delegationRpcUrl: rpcUrl ?? YELLOWSTONE_PUBLIC_RPC,
    vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
    appDelegateeAddress: delegateePkpEthAddress,
    agentWalletPkpTokenId: userPkpInfo.tokenId,
    toolIpfsCid,
  });

  const baseContext = {
    toolIpfsCid,
    appId: appId.toNumber(),
    appVersion: appVersion.toNumber(),
    delegation: {
      delegateeAddress: delegateePkpEthAddress,
      delegatorPkpInfo: {
        ethAddress: delegatorPkpEthAddress,
        tokenId: userPkpInfo.tokenId,
        publicKey: userPkpInfo.publicKey,
      },
    },
  };

  const validatedPolicies = await validatePolicies({
    policies,
    vincentTool,
    toolIpfsCid,
    parsedToolParams,
  });

  const decodedPoliciesByPackageName: Record<string, Record<string, DecodedValues>> = {};

  for (const { policyPackageName, parameters } of validatedPolicies) {
    decodedPoliciesByPackageName[policyPackageName as string] = decodePolicyParams({
      params: parameters,
    });
  }

  const evaluatedPolicies = [] as Key[];
  const allowedPolicies: {
    [K in Key]?: {
      result: PoliciesByPackageName[K]['__schemaTypes'] extends {
        evalAllowResultSchema: infer Schema;
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
        result: {
          error?: string;
        } & (PoliciesByPackageName[Key]['__schemaTypes'] extends {
          evalDenyResultSchema: infer Schema;
        }
          ? Schema extends z.ZodType
            ? z.infer<Schema>
            : undefined
          : undefined);
      }
    | undefined = undefined;

  const policyByName = vincentTool.supportedPolicies.policyByPackageName as Record<
    keyof PoliciesByPackageName,
    (typeof vincentTool.supportedPolicies.policyByPackageName)[keyof typeof vincentTool.supportedPolicies.policyByPackageName]
  >;

  for (const { policyPackageName, toolPolicyParams } of validatedPolicies) {
    const key = policyPackageName as keyof PoliciesByPackageName;
    const toolPolicy = policyByName[key];

    evaluatedPolicies.push(key as Key);
    const vincentPolicy = toolPolicy.vincentPolicy;

    if (!vincentPolicy.precheck) continue;

    try {
      const result = await vincentPolicy.precheck(
        {
          toolParams: toolPolicyParams,
          userParams: decodedPoliciesByPackageName[key as string] as unknown,
        },
        baseContext
      );

      const { schemaToUse } = getSchemaForPolicyResponseResult({
        value: result,
        allowResultSchema: vincentPolicy.precheckAllowResultSchema ?? z.undefined(),
        denyResultSchema: vincentPolicy.precheckDenyResultSchema ?? z.undefined(),
      });

      const validated = validateOrDeny(result, schemaToUse, 'precheck', 'output');

      if (isPolicyDenyResponse(validated)) {
        // @ts-expect-error We know the shape of this is valid.
        deniedPolicy = { ...validated, packageName: key as Key };
        break;
      } else if (isPolicyAllowResponse(validated)) {
        allowedPolicies[key as Key] = {
          result: validated.result as PoliciesByPackageName[Key]['__schemaTypes'] extends {
            evalAllowResultSchema: infer Schema;
          }
            ? Schema extends z.ZodType
              ? z.infer<Schema>
              : never
            : never,
        };
      }
    } catch (err) {
      deniedPolicy = {
        packageName: key as Key,
        ...createDenyResult({
          message: err instanceof Error ? err.message : 'Unknown error in precheck()',
        }),
      };
      break;
    }
  }

  if (deniedPolicy) {
    const policiesContext = createDenyEvaluationResult(
      evaluatedPolicies,
      allowedPolicies as {
        [K in keyof PoliciesByPackageName]?: {
          result: PoliciesByPackageName[K]['__schemaTypes'] extends {
            evalAllowResultSchema: infer Schema;
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
      ...baseContext,
      policiesContext,
    };
  }

  const policiesContext = createAllowEvaluationResult(
    evaluatedPolicies,
    allowedPolicies as {
      [K in keyof PoliciesByPackageName]?: {
        result: PoliciesByPackageName[K]['__schemaTypes'] extends {
          evalAllowResultSchema: infer Schema;
        }
          ? Schema extends z.ZodType
            ? z.infer<Schema>
            : never
          : never;
      };
    }
  );

  return {
    ...baseContext,
    policiesContext,
  };
}

export function createVincentToolClient<
  ToolParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
>(args: {
  vincentTool: VincentTool<
    ToolParamsSchema,
    PkgNames,
    PolicyMap,
    PoliciesByPackageName,
    ExecuteSuccessSchema,
    ExecuteFailSchema,
    PrecheckSuccessSchema,
    PrecheckFailSchema
  >;
  ethersSigner: ethers.Signer;
}) {
  const { vincentTool, ethersSigner } = args;
  const network = LIT_NETWORK.Datil;

  const executeSuccessSchema = (vincentTool.__schemaTypes.executeSuccessSchema ??
    z.undefined()) as ExecuteSuccessSchema;
  const executeFailSchema = (vincentTool.__schemaTypes.executeFailSchema ??
    z.undefined()) as ExecuteFailSchema;

  return {
    async precheck(
      toolParams: z.infer<ToolParamsSchema>,
      {
        rpcUrl,
        delegatorPkpEthAddress,
        toolIpfsCid,
      }: {
        rpcUrl?: string;
        delegatorPkpEthAddress: string;
        toolIpfsCid: string;
      }
    ): Promise<ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>> {
      const delegateePkpEthAddress = ethers.utils.getAddress(await ethersSigner.getAddress());

      const baseToolContext = await runToolPolicyPrechecks({
        vincentTool,
        toolParams,
        context: {
          toolIpfsCid,
          delegateePkpEthAddress,
          delegatorPkpEthAddress: delegatorPkpEthAddress,
          rpcUrl,
        },
      });

      if (!vincentTool.precheck) {
        return {
          ...createToolSuccessResult(),
          context: baseToolContext,
        } as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>;
      }

      const precheckResult = await vincentTool.precheck({ toolParams }, baseToolContext);

      return {
        ...precheckResult,
        context: baseToolContext,
      } as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>;
    },

    async execute(
      rawToolParams: unknown,
      context: ToolConsumerContext
    ): Promise<ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>> {
      const parsedParams = validateOrFail(
        rawToolParams,
        vincentTool.toolParamsSchema,
        'execute',
        'input'
      );

      if (isToolResponseFailure(parsedParams)) {
        return {
          ...parsedParams,
          context,
        } as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      const litNodeClient = await getLitNodeClientInstance({ network });
      const sessionSigs = await generateSessionSigs({ ethersSigner, litNodeClient });

      const result = await litNodeClient.executeJs({
        ipfsId: context.toolIpfsCid, // FIXME: The toolIpfsCid should be on the bundledVincentTool
        sessionSigs,
        jsParams: {
          toolParams: parsedParams,
          context,
        },
      });

      const { success, response } = result;

      if (success !== true) {
        return createToolResponseFailureNoResult({
          message: `Remote tool failed with unknown error: ${JSON.stringify(response)}`,
        }) as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      if (typeof response === 'string') {
        return createToolResponseFailureNoResult({
          message: `Remote tool failed with unknown error: ${JSON.stringify(response)}`,
        }) as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      const resp = response as RemoteVincentToolExecutionResult<
        ExecuteSuccessSchema,
        ExecuteFailSchema,
        PoliciesByPackageName
      >;

      const executionResult = resp.toolExecutionResult;
      if (executionResult.result) {
        const { schemaToUse } = getSchemaForToolResult({
          value: executionResult,
          successResultSchema: executeSuccessSchema,
          failureResultSchema: executeFailSchema,
        });

        const executeResult = validateOrFail(
          executionResult.result,
          schemaToUse,
          'execute',
          'output'
        );

        if (isToolResponseFailure(executeResult)) {
          return { ...executeResult, context: resp.toolContext } as ToolResponse<
            ExecuteSuccessSchema,
            ExecuteFailSchema,
            PoliciesByPackageName
          >;
        }

        return {
          ...executeResult,
          context: resp.toolContext,
        };
      }

      return {
        ...executionResult,
        context: resp.toolContext,
      };
    },
  };
}
