// src/toolClient/vincentToolClient.ts

import { z } from 'zod';

import { ethers } from 'ethers';

import { LIT_NETWORK } from '@lit-protocol/constants';

import type { BundledVincentTool, VincentTool } from '@lit-protocol/vincent-tool-sdk';

import {
  getPkpInfo,
  getPoliciesAndAppVersion,
  getSchemaForToolResult,
  LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
  LIT_DATIL_VINCENT_ADDRESS,
  type ToolPolicyMap,
  validateOrFail,
  YELLOWSTONE_PUBLIC_RPC,
} from '@lit-protocol/vincent-tool-sdk/internal';

import { getLitNodeClientInstance } from '../internal/LitNodeClient/getLitNodeClient';

import {
  createToolExecuteResponseFailure,
  createToolExecuteResponseFailureNoResult,
  createToolExecuteResponseSuccess,
} from './execute/resultCreators';

import { type ToolClientContext, type VincentToolClient } from './types';

import { isRemoteVincentToolExecutionResult, isToolResponseFailure } from './typeGuards';
import { generateVincentToolSessionSigs } from './execute/generateVincentToolSessionSigs';
import { runToolPolicyPrechecks } from './precheck/runPolicyPrechecks';
import type { RemoteVincentToolExecutionResult, ToolExecuteResponse } from './execute/types';
import type { ToolPrecheckResponse } from './precheck/types';
import {
  createToolPrecheckResponseFailureNoResult,
  createToolPrecheckResponseSuccessNoResult,
} from './precheck/resultCreators';

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
    ): Promise<
      ToolPrecheckResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>
    > {
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
        return createToolPrecheckResponseFailureNoResult({
          ...parsedParams,
          context: baseContext,
        }) as ToolPrecheckResponse<
          PrecheckSuccessSchema,
          PrecheckFailSchema,
          PoliciesByPackageName
        >;
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
          return createToolPrecheckResponseFailureNoResult({
            context: baseToolContext,
          }) as ToolPrecheckResponse<
            PrecheckSuccessSchema,
            PrecheckFailSchema,
            PoliciesByPackageName
          >;
        }

        return createToolPrecheckResponseSuccessNoResult({
          context: baseToolContext,
        }) as ToolPrecheckResponse<
          PrecheckSuccessSchema,
          PrecheckFailSchema,
          PoliciesByPackageName
        >;
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
      } as ToolPrecheckResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>;
    },

    async execute(
      rawToolParams: z.infer<ToolParamsSchema>,
      context: ToolClientContext
    ): Promise<
      ToolExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>
    > {
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
        } as ToolExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
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
        return createToolExecuteResponseFailureNoResult({
          message: `Remote tool failed with unknown error: ${JSON.stringify(response)}`,
        }) as ToolExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      let parsedResult = response;

      if (typeof response === 'string') {
        // lit-node-client returns a string if no signed data, even if the result could be JSON.parse'd :(
        try {
          parsedResult = JSON.parse(response);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          return createToolExecuteResponseFailureNoResult({
            message: `Remote tool failed with unknown error: ${JSON.stringify(response)}`,
          }) as ToolExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
        }
      }

      if (!isRemoteVincentToolExecutionResult(parsedResult)) {
        console.log(
          'Result from `executeJs` was valid JSON, but not a vincentToolExecutionResult',
          { parsedResult, success }
        );

        return createToolExecuteResponseFailureNoResult({
          message: `Remote tool failed with unknown error: ${JSON.stringify(parsedResult)}`,
        }) as ToolExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
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
        return executeResult as ToolExecuteResponse<
          ExecuteSuccessSchema,
          ExecuteFailSchema,
          PoliciesByPackageName
        >;
      }

      console.log('Raw toolExecutionResult was:', executionResult);

      // We parsed the result -- it may be a success or a failure; return appropriately.
      if (isToolResponseFailure(executionResult)) {
        return createToolExecuteResponseFailure({
          ...(executionResult.error ? { message: executionResult.error } : {}),
          result: executeResult,
          context: resp.toolContext,
        }) as ToolExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      const res: ExecuteFailSchema | ExecuteSuccessSchema = executeResult;

      return createToolExecuteResponseSuccess({
        result: res,
        context: resp.toolContext,
      }) as ToolExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
    },
  };
}
