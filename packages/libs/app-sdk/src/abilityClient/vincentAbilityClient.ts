// src/abilityClient/vincentAbilityClient.ts

import { ethers } from 'ethers';
import { z } from 'zod';

import type { BundledVincentAbility, VincentAbility } from '@lit-protocol/vincent-ability-sdk';
import type { AbilityPolicyMap } from '@lit-protocol/vincent-ability-sdk/internal';

import { LIT_NETWORK } from '@lit-protocol/constants';
import {
  assertSupportedAbilityVersion,
  getPkpInfo,
  getPoliciesAndAppVersion,
  getSchemaForAbilityResult,
  LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
  validateOrFail,
} from '@lit-protocol/vincent-ability-sdk/internal';

import type { RemoteVincentAbilityExecutionResult, AbilityExecuteResponse } from './execute/types';
import type { AbilityPrecheckResponse } from './precheck/types';
import type { AbilityClientContext, VincentAbilityClient } from './types';

import { getLitNodeClientInstance } from '../internal/LitNodeClient/getLitNodeClient';
import { generateVincentAbilitySessionSigs } from './execute/generateVincentAbilitySessionSigs';
import {
  createAbilityExecuteResponseFailure,
  createAbilityExecuteResponseFailureNoResult,
  createAbilityExecuteResponseSuccess,
} from './execute/resultCreators';
import {
  createAbilityPrecheckResponseFailureNoResult,
  createAbilityPrecheckResponseSuccessNoResult,
} from './precheck/resultCreators';
import { runAbilityPolicyPrechecks } from './precheck/runPolicyPrechecks';
import {
  isRemoteVincentAbilityExecutionResult,
  isAbilityResponseFailure,
  isAbilityResponseRuntimeFailure,
  isAbilityResponseSchemaValidationFailure,
} from './typeGuards';

const YELLOWSTONE_RPC_URL = 'https://yellowstone-rpc.litprotocol.com/';

const bigintReplacer = (key: any, value: any) => {
  return typeof value === 'bigint' ? value.toString() : value;
};

/** A VincentAbilityClient provides a type-safe interface for executing abilities, for both `precheck()`
 * and `execute()` functionality.
 *
 * ```typescript
 * import { disconnectVincentAbilityClients, getVincentAbilityClient, isAbilityResponseFailure } from '@lit-protocol/vincent-app-sdk/abilityClient';
 * import { bundledVincentAbility as uniswapBundledAbility } from '@lit-protocol/vincent-ability-uniswap-swap';
 * import { delegateeEthersSigner } = from './ethersSigner';
 * import { ETH_RPC_URL, BASE_RPC_URL } from './rpcConfigs';
 *
 * const uniswapAbilityClient = getVincentAbilityClient({
 *     bundledVincentAbility: uniswapBundledAbility,
 *     ethersSigner: delegateeEthersSigner,
 *   });
 *
 * // First, call `precheck()` to get a best-estimate result indicating that the ability execution in the LIT action runtime will not fail
 * const precheckResult = await uniswapSwapAbilityClient.precheck({
 *     ethRpcUrl: ETH_RPC_URL,
 *     rpcUrlForUniswap: BASE_RPC_URL,
 *     chainIdForUniswap: 8453, // Base
 *     tokenInAddress: '0x4200000000000000000000000000000000000006', // WETH
 *     tokenInDecimals: 18,
 *     tokenInAmount: 0.0000077,
 *     tokenOutAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
 *     tokenOutDecimals: 8,
 *   },
 *   {
 *     delegatorPkpEthAddress: '0x123456789123456789123456789...',
 *   });
 *
 * const uniswapSwapExecutionResult = await uniswapSwapAbilityClient.execute({
 *   ethRpcUrl: ETH_RPC_URL,
 *   rpcUrlForUniswap: BASE_RPC_URL,
 *   chainIdForUniswap: 8453,
 *   tokenInAddress: '0x4200000000000000000000000000000000000006', // WETH
 *   tokenInDecimals: 18,
 *   tokenInAmount: 0.0000077,
 *   tokenOutAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
 *   tokenOutDecimals: 8,
 * },
 * {
 *   delegatorPkpEthAddress: '0x123456789123456789123456789...',
 * });
 *
 * if(isAbilityResponseFailure(uniswapSwapExecutionResult)) {
 *   ...handle failure
 * } else {
 *  ...handle result
 * }
 * ```
 *
 * @typeParam IpfsCid {@removeTypeParameterCompletely}
 * @typeParam AbilityParamsSchema {@removeTypeParameterCompletely}
 * @typeParam PkgNames {@removeTypeParameterCompletely}
 * @typeParam PolicyMap {@removeTypeParameterCompletely}
 * @typeParam PoliciesByPackageName {@removeTypeParameterCompletely}
 * @typeParam ExecuteSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam ExecuteFailSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckSuccessSchema {@removeTypeParameterCompletely}
 * @typeParam PrecheckFailSchema {@removeTypeParameterCompletely}
 *
 * @param params
 * @param params.ethersSigner  - An ethers signer that has been configured with your delegatee key
 * @param params.bundledVincentAbility  - The bundled vincent ability that you want to interact with
 *
 * @category API
 * */
export function getVincentAbilityClient<
  const IpfsCid extends string,
  AbilityParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends AbilityPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
  ExecuteSuccessSchema extends z.ZodType = z.ZodUndefined,
  ExecuteFailSchema extends z.ZodType = z.ZodUndefined,
  PrecheckSuccessSchema extends z.ZodType = z.ZodUndefined,
  PrecheckFailSchema extends z.ZodType = z.ZodUndefined,
>(params: {
  bundledVincentAbility: BundledVincentAbility<
    VincentAbility<
      AbilityParamsSchema,
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
}): VincentAbilityClient<
  AbilityParamsSchema,
  PoliciesByPackageName,
  ExecuteSuccessSchema,
  ExecuteFailSchema,
  PrecheckSuccessSchema,
  PrecheckFailSchema
> {
  const { bundledVincentAbility, ethersSigner } = params;
  const { ipfsCid, vincentAbility, vincentAbilityApiVersion } = bundledVincentAbility;

  assertSupportedAbilityVersion(vincentAbilityApiVersion);

  const network = LIT_NETWORK.Datil;

  const executeSuccessSchema = (vincentAbility.__schemaTypes.executeSuccessSchema ??
    z.undefined()) as ExecuteSuccessSchema;
  const executeFailSchema = (vincentAbility.__schemaTypes.executeFailSchema ??
    z.undefined()) as ExecuteFailSchema;

  return {
    async precheck(
      rawAbilityParams: z.infer<AbilityParamsSchema>,
      {
        rpcUrl,
        delegatorPkpEthAddress,
      }: AbilityClientContext & {
        rpcUrl?: string;
      }
    ): Promise<
      AbilityPrecheckResponse<PrecheckSuccessSchema, PrecheckFailSchema, PoliciesByPackageName>
    > {
      console.log('precheck', { rawAbilityParams, delegatorPkpEthAddress, rpcUrl });
      const delegateePkpEthAddress = ethers.utils.getAddress(await ethersSigner.getAddress());

      // This will be populated further during execution; if an error is encountered, it'll include as much data as we can give the caller.
      const baseContext = {
        delegation: {
          delegateeAddress: delegateePkpEthAddress,
          // delegatorPkpInfo: null,
        },
        abilityIpfsCid: ipfsCid,
        // appId: undefined,
        // appVersion: undefined,
      } as any;

      const parsedParams = validateOrFail(
        rawAbilityParams,
        vincentAbility.abilityParamsSchema,
        'precheck',
        'input'
      );

      if (isAbilityResponseFailure(parsedParams)) {
        return createAbilityPrecheckResponseFailureNoResult({
          ...parsedParams,
          context: baseContext,
        }) as AbilityPrecheckResponse<
          PrecheckSuccessSchema,
          PrecheckFailSchema,
          PoliciesByPackageName
        >;
      }

      const userPkpInfo = await getPkpInfo({
        litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
        yellowstoneRpcUrl: rpcUrl ?? YELLOWSTONE_RPC_URL,
        pkpEthAddress: delegatorPkpEthAddress,
      });
      baseContext.delegation.delegatorPkpInfo = userPkpInfo;

      console.log('userPkpInfo', userPkpInfo);

      const { decodedPolicies, appId, appVersion } = await getPoliciesAndAppVersion({
        delegationRpcUrl: rpcUrl ?? YELLOWSTONE_RPC_URL,
        appDelegateeAddress: delegateePkpEthAddress,
        agentWalletPkpEthAddress: delegatorPkpEthAddress,
        abilityIpfsCid: ipfsCid,
      });
      baseContext.appId = appId.toNumber();
      baseContext.appVersion = appVersion.toNumber();

      console.log('Fetched policies and app info', { decodedPolicies, appId, appVersion });

      const baseAbilityContext = await runAbilityPolicyPrechecks({
        bundledVincentAbility,
        abilityParams: parsedParams as z.infer<AbilityParamsSchema>,
        decodedPolicies,
        context: {
          ...baseContext,
          rpcUrl,
        },
      });

      if (!vincentAbility.precheck) {
        console.log(
          'No ability precheck defined - returning baseContext policy evaluation results',
          {
            rawAbilityParams,
            delegatorPkpEthAddress,
            rpcUrl,
          }
        );
        if (!baseAbilityContext.policiesContext.allow) {
          return createAbilityPrecheckResponseFailureNoResult({
            context: baseAbilityContext,
          }) as AbilityPrecheckResponse<
            PrecheckSuccessSchema,
            PrecheckFailSchema,
            PoliciesByPackageName
          >;
        }

        return createAbilityPrecheckResponseSuccessNoResult({
          context: baseAbilityContext,
        }) as AbilityPrecheckResponse<
          PrecheckSuccessSchema,
          PrecheckFailSchema,
          PoliciesByPackageName
        >;
      }

      console.log('Executing ability precheck');

      const precheckResult = await vincentAbility.precheck(
        { abilityParams: parsedParams },
        baseAbilityContext
      );

      if (
        isAbilityResponseSchemaValidationFailure(precheckResult) ||
        isAbilityResponseRuntimeFailure(precheckResult)
      ) {
        console.log(
          'Detected runtime or schema validation error in abilityPrecheckResult - returning as-is:',
          JSON.stringify(
            {
              isAbilityResponseRuntimeFailure: isAbilityResponseRuntimeFailure(precheckResult),
              isAbilityResponseSchemaValidationFailure:
                isAbilityResponseSchemaValidationFailure(precheckResult),
              precheckResult,
            },
            bigintReplacer
          )
        );
        // Runtime errors and schema validation errors will not have results; return them as-is.
        return precheckResult as AbilityPrecheckResponse<
          PrecheckSuccessSchema,
          PrecheckFailSchema,
          PoliciesByPackageName
        >;
      }

      console.log('precheckResult()', JSON.stringify(precheckResult, bigintReplacer));
      return {
        ...precheckResult,
        context: baseAbilityContext,
      } as AbilityPrecheckResponse<
        PrecheckSuccessSchema,
        PrecheckFailSchema,
        PoliciesByPackageName
      >;
    },

    async execute(
      rawAbilityParams: z.infer<AbilityParamsSchema>,
      context: AbilityClientContext
    ): Promise<
      AbilityExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>
    > {
      const parsedParams = validateOrFail(
        rawAbilityParams,
        vincentAbility.abilityParamsSchema,
        'execute',
        'input'
      );

      if (isAbilityResponseFailure(parsedParams)) {
        return {
          ...parsedParams,
          context,
        } as AbilityExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
      }

      const litNodeClient = await getLitNodeClientInstance({ network });
      const sessionSigs = await generateVincentAbilitySessionSigs({ ethersSigner, litNodeClient });

      const result = await litNodeClient.executeJs({
        ipfsId: ipfsCid,
        sessionSigs,
        jsParams: {
          abilityParams: parsedParams,
          context,
          vincentAbilityApiVersion,
        },
      });

      const { success, response } = result;
      console.log('executeResult - raw result from `litNodeClient.executeJs()', {
        response,
        success,
      });

      if (success !== true) {
        return createAbilityExecuteResponseFailureNoResult({
          runtimeError: `Remote ability failed with unknown error: ${JSON.stringify(response, bigintReplacer, 2)}`,
        }) as AbilityExecuteResponse<
          ExecuteSuccessSchema,
          ExecuteFailSchema,
          PoliciesByPackageName
        >;
      }

      let parsedResult = response;

      if (typeof response === 'string') {
        // lit-node-client returns a string if no signed data, even if the result could be JSON.parse'd :(
        try {
          parsedResult = JSON.parse(response);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          return createAbilityExecuteResponseFailureNoResult({
            runtimeError: `Remote ability failed with unknown error: ${JSON.stringify(response, bigintReplacer)}`,
          }) as AbilityExecuteResponse<
            ExecuteSuccessSchema,
            ExecuteFailSchema,
            PoliciesByPackageName
          >;
        }
      }

      if (!isRemoteVincentAbilityExecutionResult(parsedResult)) {
        console.log(
          'Result from `executeJs` was valid JSON, but not a vincentAbilityExecutionResult',
          { parsedResult, success }
        );

        return createAbilityExecuteResponseFailureNoResult({
          runtimeError: `Remote ability failed with unknown error: ${JSON.stringify(parsedResult, bigintReplacer)}`,
        }) as AbilityExecuteResponse<
          ExecuteSuccessSchema,
          ExecuteFailSchema,
          PoliciesByPackageName
        >;
      }

      const remoteVincentAbilityResult: RemoteVincentAbilityExecutionResult<
        ExecuteSuccessSchema,
        ExecuteFailSchema,
        PoliciesByPackageName
      > = parsedResult;

      console.log(
        'Parsed executeJs vincentAbilityExecutionResult:',
        JSON.stringify(parsedResult, bigintReplacer)
      );

      const { abilityContext, abilityExecutionResult } = remoteVincentAbilityResult;

      if (
        isAbilityResponseSchemaValidationFailure(abilityExecutionResult) ||
        isAbilityResponseRuntimeFailure(abilityExecutionResult)
      ) {
        console.log(
          'Detected runtime or schema validation error in abilityExecutionResult - returning as-is:',
          JSON.stringify(
            {
              isAbilityResponseRuntimeFailure:
                isAbilityResponseRuntimeFailure(abilityExecutionResult),
              isAbilityResponseSchemaValidationFailure:
                isAbilityResponseSchemaValidationFailure(abilityExecutionResult),
              abilityExecutionResult,
            },
            bigintReplacer
          )
        );
        // Runtime errors and schema validation errors will not have results; return them as-is.
        return createAbilityExecuteResponseFailureNoResult({
          ...(abilityExecutionResult.runtimeError
            ? { runtimeError: abilityExecutionResult.runtimeError }
            : {}),
          ...(abilityExecutionResult.schemaValidationError
            ? { schemaValidationError: abilityExecutionResult.schemaValidationError }
            : {}),
          context: remoteVincentAbilityResult.abilityContext,
        }) as AbilityExecuteResponse<
          ExecuteSuccessSchema,
          ExecuteFailSchema,
          PoliciesByPackageName
        >;
      }

      // Policy eval happens before `execute()` is ever called
      // As a result, when policies return a `deny` result, there will be no ability result
      // so we need to skip trying to run result through the success/fail schema logic
      if (!abilityContext.policiesContext.allow) {
        return createAbilityExecuteResponseFailureNoResult({
          context: abilityContext,
        }) as AbilityExecuteResponse<
          ExecuteSuccessSchema,
          ExecuteFailSchema,
          PoliciesByPackageName
        >;
      }

      const resultSchemaDetails = getSchemaForAbilityResult({
        value: abilityExecutionResult,
        successResultSchema: executeSuccessSchema,
        failureResultSchema: executeFailSchema,
      });

      const { schemaToUse, parsedType } = resultSchemaDetails;

      console.log(`Parsing ability result using the ${parsedType} Zod schema`);

      // Parse returned result using appropriate execute zod schema
      const executeResult = validateOrFail(
        abilityExecutionResult.result,
        schemaToUse,
        'execute',
        'output'
      );

      console.log('Zod parse result:', executeResult);

      if (isAbilityResponseFailure(executeResult)) {
        // Parsing the result threw a zodError
        return executeResult as AbilityExecuteResponse<
          ExecuteSuccessSchema,
          ExecuteFailSchema,
          PoliciesByPackageName
        >;
      }

      console.log('Raw abilityExecutionResult was:', abilityExecutionResult);

      // We parsed the result -- it may be a success or a failure; return appropriately.
      if (isAbilityResponseFailure(abilityExecutionResult)) {
        return createAbilityExecuteResponseFailure({
          ...(abilityExecutionResult.runtimeError
            ? { runtimeError: abilityExecutionResult.runtimeError }
            : {}),
          ...(abilityExecutionResult.schemaValidationError
            ? { schemaValidationError: abilityExecutionResult.schemaValidationError }
            : {}),
          result: executeResult,
          context: remoteVincentAbilityResult.abilityContext,
        }) as AbilityExecuteResponse<
          ExecuteSuccessSchema,
          ExecuteFailSchema,
          PoliciesByPackageName
        >;
      }

      const res: ExecuteFailSchema | ExecuteSuccessSchema = executeResult;

      return createAbilityExecuteResponseSuccess({
        result: res,
        context: remoteVincentAbilityResult.abilityContext,
      }) as AbilityExecuteResponse<ExecuteSuccessSchema, ExecuteFailSchema, PoliciesByPackageName>;
    },
  };
}
