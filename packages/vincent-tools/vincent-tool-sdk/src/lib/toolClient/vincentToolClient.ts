// src/lib/toolClient/vincentToolClient.ts

import { PolicyEvaluationResultContext, VincentTool, BaseContext } from '../types';
import { z } from 'zod';
import {
  validateOrDeny,
  getSchemaForPolicyResponseResult,
  isPolicyDenyResponse,
  createDenyResult,
  isPolicyAllowResponse,
} from '../policyCore/helpers';
import { ToolPolicyMap } from '../toolCore/helpers';
import { getSchemaForToolResult, validateOrFail } from '../toolCore/helpers/zod';
import { createToolSuccessResult } from '../toolCore/helpers/resultCreators';
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
import { validatePolicies } from '../toolCore/helpers/validatePolicies';
import {
  createAllowEvaluationResult,
  createDenyEvaluationResult,
  createToolResponseFailureNoResult,
} from './resultCreators';
import { ToolResponse } from './types';
import { isToolResponseFailure } from './typeGuards';

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
  context: BaseContext & { rpcUrl?: string; toolIpfsCid: string };
}): Promise<PolicyEvaluationResultContext<PoliciesByPackageName>> {
  type Key = PkgNames & keyof PoliciesByPackageName;

  const { vincentTool, toolParams, context } = args;

  const parsedToolParams = vincentTool.toolParamsSchema.parse(toolParams);

  const validatedPolicies = await validatePolicies({
    delegationRpcUrl: context.rpcUrl ?? YELLOWSTONE_PUBLIC_RPC,
    appDelegateeAddress: context.delegation.delegatee,
    vincentTool,
    parsedToolParams,
    toolIpfsCid: context.toolIpfsCid,
    pkpTokenId: context.delegation.delegator,
  });

  const decodedPoliciesByPackageName: Record<string, Record<string, EthersAbiDecodedValue>> = {};

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

  const policyByName = vincentTool.policyMap.policyByPackageName as Record<
    keyof PoliciesByPackageName,
    (typeof vincentTool.policyMap.policyByPackageName)[keyof typeof vincentTool.policyMap.policyByPackageName]
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
        {
          delegation: {
            delegatee: context.delegation.delegatee,
            delegator: context.delegation.delegator,
          },
        },
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

  return deniedPolicy
    ? createDenyEvaluationResult(
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
        deniedPolicy,
      )
    : createAllowEvaluationResult(
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
      );
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
      rawToolParams: unknown,
      {
        rpcUrl,
        delegator,
        toolIpfsCid,
      }: { rpcUrl?: string; delegator: string; toolIpfsCid: string },
    ): Promise<ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>> {
      const delegatee = ethers.utils.getAddress(await ethersSigner.getAddress());

      const policiesContext: PolicyEvaluationResultContext<PoliciesByPackageName> =
        await runToolPolicyPrechecks({
          vincentTool,
          toolParams: rawToolParams,
          context: {
            rpcUrl,
            toolIpfsCid,
            delegation: { delegator, delegatee },
          },
        });

      if (!vincentTool.precheck) {
        return {
          ...createToolSuccessResult(),
          policiesContext,
        } as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>;
      }

      const precheckResult = await vincentTool.precheck(
        { toolParams: rawToolParams },
        {
          policiesContext,
          delegation: { delegator, delegatee },
        },
      );

      return {
        ...precheckResult,
        policiesContext,
      } as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>;
    },

    async execute(
      rawToolParams: unknown,
      context: BaseContext,
    ): Promise<ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>> {
      const parsedParams = validateOrFail(
        rawToolParams,
        vincentTool.toolParamsSchema,
        'execute',
        'input',
      );

      if (isToolResponseFailure(parsedParams)) {
        return {
          ...parsedParams,
          policiesContext: undefined,
        } as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      const litNodeClient = await getLitNodeClientInstance({ network });
      const sessionSigs = await generateSessionSigs({ ethersSigner, litNodeClient });

      const result = await litNodeClient.executeJs({
        ipfsId: '09180ijflkshdjf',
        // ipfsId: context.toolIpfsCid,
        sessionSigs,
        jsParams: {
          toolParams: { ...parsedParams },
          context: {
            ...context,
            delegatee: await ethersSigner.getAddress(),
          },
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

      const resp = response as ToolResponse<
        ExecuteSuccessSchema,
        ExecuteFailSchema,
        PoliciesByPackageName
      >;

      if (resp.result) {
        const { schemaToUse } = getSchemaForToolResult({
          value: resp.result,
          successResultSchema: executeSuccessSchema,
          failureResultSchema: executeFailSchema,
        });

        const executeResult = validateOrFail(response, schemaToUse, 'execute', 'output');

        return {
          ...executeResult,
          policiesContext: resp.policiesContext,
        } as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      return {
        ...resp,
        policiesContext: resp.policiesContext,
      };
    },
  };
}
