// src/toolClient/vincentToolClient.ts

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

import type {
  VincentTool,
  PolicyEvaluationResultContext,
  BaseToolContext,
  BundledVincentTool,
  BaseContext,
} from '@lit-protocol/vincent-tool-sdk';

import {
  type DecodedValues,
  type Policy,
  type ToolPolicyMap,
} from '@lit-protocol/vincent-tool-sdk/internal';

import {
  getPkpInfo,
  getPoliciesAndAppVersion,
  validatePolicies,
  decodePolicyParams,
  YELLOWSTONE_PUBLIC_RPC,
  LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
  LIT_DATIL_VINCENT_ADDRESS,
  createDenyResult,
  getSchemaForPolicyResponseResult,
  isPolicyAllowResponse,
  isPolicyDenyResponse,
  validateOrDeny,
  getSchemaForToolResult,
  validateOrFail,
} from '@lit-protocol/vincent-tool-sdk/internal';

import { getLitNodeClientInstance } from '../internal/LitNodeClient/getLitNodeClient';

import {
  createAllowEvaluationResult,
  createDenyEvaluationResult,
  createToolResponseFailure,
  createToolResponseFailureNoResult,
  createToolResponseSuccess,
  createToolResponseSuccessNoResult,
} from './resultCreators';

import {
  type ToolClientContext,
  type ToolResponse,
  type RemoteVincentToolExecutionResult,
  type VincentToolClient,
} from './types';

import { isRemoteVincentToolExecutionResult, isToolResponseFailure } from './typeGuards';
import * as util from 'node:util';

/** @hidden */
export const generateVincentToolSessionSigs = async ({
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
  const IpfsCid extends string,
  ToolParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
>(params: {
  bundledVincentTool: BundledVincentTool<
    VincentTool<
      ToolParamsSchema,
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
  toolParams: z.infer<ToolParamsSchema>;
  context: BaseContext & { rpcUrl?: string };
  policies: Policy[];
}): Promise<BaseToolContext<PolicyEvaluationResultContext<PoliciesByPackageName>>> {
  type Key = PkgNames & keyof PoliciesByPackageName;

  const {
    bundledVincentTool: { vincentTool, ipfsCid },
    toolParams,
    context,
    policies,
  } = params;

  console.log(
    'Executing runToolPolicyPrechecks()',
    Object.keys(params.bundledVincentTool.vincentTool.supportedPolicies.policyByPackageName)
  );

  const validatedPolicies = await validatePolicies({
    policies,
    vincentTool,
    toolIpfsCid: ipfsCid,
    parsedToolParams: toolParams,
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

    if (!vincentPolicy.precheck) {
      console.log('No precheck() defined policy', key, 'skipping...');
      continue;
    }

    try {
      console.log('Executing precheck() for policy', key);
      const result = await vincentPolicy.precheck(
        {
          toolParams: toolPolicyParams,
          userParams: decodedPoliciesByPackageName[key as string] as unknown,
        },
        context
      );

      console.log('vincentPolicy.precheck() result', util.inspect(result, { depth: 10 }));
      const { schemaToUse } = getSchemaForPolicyResponseResult({
        value: result,
        allowResultSchema: vincentPolicy.precheckAllowResultSchema ?? z.undefined(),
        denyResultSchema: vincentPolicy.precheckDenyResultSchema ?? z.undefined(),
      });

      const validated = validateOrDeny(result.result, schemaToUse, 'precheck', 'output');

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
      ...context,
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
    ...context,
    policiesContext,
  };
}

/** A VincentToolClient provides a type-safe interface for executing tools, for both `precheck()`
 * and `execute()` functionality.
 *
 * @typeParam IpfsCid {@removeTypeParameterCompletely}
 * @typeParam ToolParamsSchema {@removeTypeParameterCompletely}
 * @typeParam PkgNames {@removeTypeParameterCompletely}
 * @typeParam PolicyMap {@removeTypeParameterCompletely}
 * @typeParam PoliciesByPackageName {@removeTypeParameterCompletely}
 * @typeParam ExecuteSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam ExecuteFailSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckFailSchema {@removeTypeParameterCompletely}
 *
 * @param params
 * @param {ethers.Signer} params.ethersSigner  - An ethers signer that has been configured with your delegatee key
 *
 * @category API Methods
 * */
export function getVincentToolClient<
  const IpfsCid extends string,
  ToolParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
>(params: {
  bundledVincentTool: BundledVincentTool<
    VincentTool<
      ToolParamsSchema,
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
  ethersSigner: ethers.Signer;
}): VincentToolClient<
  ToolParamsSchema,
  PoliciesByPackageName,
  ExecuteSuccessSchema,
  ExecuteFailSchema,
  PrecheckSuccessSchema,
  PrecheckFailSchema
> {
  const { bundledVincentTool, ethersSigner } = params;
  const { ipfsCid, vincentTool } = bundledVincentTool;

  const network = LIT_NETWORK.Datil;

  const executeSuccessSchema = (vincentTool.__schemaTypes.executeSuccessSchema ??
    z.undefined()) as ExecuteSuccessSchema;
  const executeFailSchema = (vincentTool.__schemaTypes.executeFailSchema ??
    z.undefined()) as ExecuteFailSchema;

  return {
    async precheck(
      rawToolParams: z.infer<ToolParamsSchema>,
      {
        rpcUrl,
        delegatorPkpEthAddress,
      }: ToolClientContext & {
        rpcUrl?: string;
      }
    ): Promise<ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>> {
      console.log('precheck', { rawToolParams, delegatorPkpEthAddress, rpcUrl });
      const delegateePkpEthAddress = ethers.utils.getAddress(await ethersSigner.getAddress());

      // This will be populated further during execution; if an error is encountered, it'll include as much data as we can give the caller.
      const baseContext = {
        delegation: {
          delegateeAddress: delegateePkpEthAddress,
          // delegatorPkpInfo: null,
        },
        toolIpfsCid: ipfsCid,
        // appId: undefined,
        // appVersion: undefined,
      } as any;

      const parsedParams = validateOrFail(
        rawToolParams,
        vincentTool.toolParamsSchema,
        'execute',
        'input'
      );

      if (isToolResponseFailure(parsedParams)) {
        return createToolResponseFailureNoResult({
          ...parsedParams,
          context: baseContext,
        }) as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>;
      }

      const userPkpInfo = await getPkpInfo({
        litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
        yellowstoneRpcUrl: rpcUrl ?? YELLOWSTONE_PUBLIC_RPC,
        pkpEthAddress: delegatorPkpEthAddress,
      });
      baseContext.delegation.delegatorPkpInfo = userPkpInfo;

      console.log('userPkpInfo', userPkpInfo);

      const { policies, appId, appVersion } = await getPoliciesAndAppVersion({
        delegationRpcUrl: rpcUrl ?? YELLOWSTONE_PUBLIC_RPC,
        vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
        appDelegateeAddress: delegateePkpEthAddress,
        agentWalletPkpTokenId: userPkpInfo.tokenId,
        toolIpfsCid: ipfsCid,
      });
      baseContext.appId = appId.toNumber();
      baseContext.appVersion = appVersion.toNumber();

      console.log('Fetched policies and app info', { policies, appId, appVersion });

      const baseToolContext = await runToolPolicyPrechecks({
        bundledVincentTool,
        toolParams: parsedParams as z.infer<ToolParamsSchema>,
        policies,
        context: {
          ...baseContext,
          rpcUrl,
        },
      });

      if (!vincentTool.precheck) {
        console.log('No tool precheck defined - returning baseContext and success result', {
          rawToolParams,
          delegatorPkpEthAddress,
          rpcUrl,
        });
        if (!baseToolContext.policiesContext.allow) {
          return createToolResponseFailureNoResult({
            context: baseToolContext,
          }) as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>;
        }

        return createToolResponseSuccessNoResult({
          context: baseToolContext,
        }) as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>;
      }

      console.log('Executing tool precheck');

      const precheckResult = await vincentTool.precheck(
        { toolParams: parsedParams },
        baseToolContext
      );

      console.log('precheckResult()', JSON.stringify(precheckResult));
      return {
        ...precheckResult,
        context: baseToolContext,
      } as ToolResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>;
    },

    async execute(
      rawToolParams: z.infer<ToolParamsSchema>,
      context: ToolClientContext
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
      const sessionSigs = await generateVincentToolSessionSigs({ ethersSigner, litNodeClient });

      const result = await litNodeClient.executeJs({
        ipfsId: ipfsCid,
        sessionSigs,
        jsParams: {
          toolParams: parsedParams,
          context,
        },
      });

      const { success, response } = result;
      console.log('executeResult - raw result from `litNodeClient.executeJs()', {
        response,
        success,
      });

      if (success !== true) {
        return createToolResponseFailureNoResult({
          message: `Remote tool failed with unknown error: ${JSON.stringify(response)}`,
        }) as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      let parsedResult = response;

      if (typeof response === 'string') {
        // lit-node-client returns a string if no signed data, even if the result could be JSON.parse'd :(
        try {
          parsedResult = JSON.parse(response);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          return createToolResponseFailureNoResult({
            message: `Remote tool failed with unknown error: ${JSON.stringify(response)}`,
          }) as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
        }
      }

      if (!isRemoteVincentToolExecutionResult(parsedResult)) {
        console.log(
          'Result from `executeJs` was valid JSON, but not a vincentToolExecutionResult',
          { parsedResult, success }
        );

        return createToolResponseFailureNoResult({
          message: `Remote tool failed with unknown error: ${JSON.stringify(parsedResult)}`,
        }) as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      const resp: RemoteVincentToolExecutionResult<
        ExecuteSuccessSchema,
        ExecuteFailSchema,
        PoliciesByPackageName
      > = parsedResult;

      console.log('Parsed executeJs vincentToolExecutionResult:', { parsedResult });
      const executionResult = resp.toolExecutionResult;
      const resultSchemaDetails = getSchemaForToolResult({
        value: executionResult,
        successResultSchema: executeSuccessSchema,
        failureResultSchema: executeFailSchema,
      });

      const { schemaToUse, parsedType } = resultSchemaDetails;

      console.log(`Parsing tool result using the ${parsedType} Zod schema`);

      // Parse returned result using appropriate execute zod schema
      const executeResult = validateOrFail(
        executionResult.result,
        schemaToUse,
        'execute',
        'output'
      );

      console.log('Zod parse result:', executeResult);

      if (isToolResponseFailure(executeResult)) {
        // Parsing the result threw a zodError
        return executeResult as ToolResponse<
          ExecuteSuccessSchema,
          ExecuteFailSchema,
          PoliciesByPackageName
        >;
      }

      console.log('Raw toolExecutionResult was:', executionResult);

      // We parsed the result -- it may be a success or a failure; return appropriately.
      if (isToolResponseFailure(executionResult)) {
        return createToolResponseFailure({
          ...(executionResult.error ? { message: executionResult.error } : {}),
          result: executeResult,
          context: resp.toolContext,
        }) as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      const res: ExecuteFailSchema | ExecuteSuccessSchema = executeResult;

      return createToolResponseSuccess({
        result: res,
        context: resp.toolContext,
      }) as ToolResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
    },
  };
}
