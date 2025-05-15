// src/lib/toolCore/helpers/evaluatePolicies.ts

import { z } from 'zod';
import { ValidatedPolicyMap } from '../toolCore/helpers/validatePolicies';
import { getPkpInfo } from '../toolCore/helpers/getPkpInfo';
import { LIT_DATIL_PUBKEY_ROUTER_ADDRESS } from './constants';
import {
  PolicyEvaluationResultContext,
  PolicyResponse,
  PolicyResponseDeny,
  VincentPolicyDef,
  VincentToolDef,
  VincentToolPolicy,
} from '../types';
import { createVincentTool, EnrichedVincentToolPolicy } from '../toolCore/vincentTool';
import {
  createDenyResult,
  getSchemaForPolicyResponseResult,
  isPolicyDenyResponse,
  validateOrDeny,
} from '../policyCore/helpers';
import {
  createAllowEvaluationResult,
  createDenyEvaluationResult,
} from '../policyCore/helpers/resultCreators';

declare const Lit: {
  Actions: {
    setResponse: (response: { response: string }) => void;
    call: (params: { ipfsId: string; params: Record<string, unknown> }) => Promise<string>;
    getRpcUrl: (args: { chain: string }) => Promise<string>;
  };
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function evaluatePolicies<
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
  vincentToolDef,
  parsedToolParams,
  validatedPolicies,
}: {
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
  parsedToolParams: z.infer<ToolParamsSchema>;
  validatedPolicies: ValidatedPolicyMap<z.infer<ToolParamsSchema>, PolicyMapType>;
}): Promise<PolicyEvaluationResultContext<PolicyMapType>> {
  const vincentTool = createVincentTool(vincentToolDef);

  const userPkpInfo = await getPkpInfo({
    litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
    yellowstoneRpcUrl: 'https://yellowstone-rpc.litprotocol.com/',
    pkpEthAddress: parsedToolParams.pkpEthAddress,
  });

  const evaluatedPolicies: PolicyEvaluationResultContext<PolicyMapType>['evaluatedPolicies'] = [];
  const policyEvaluationResults: PolicyEvaluationResultContext<PolicyMapType>['allowedPolicies'] =
    {};
  let policyDeniedResult: PolicyEvaluationResultContext<PolicyMapType>['deniedPolicy'] = undefined;
  const rawAllowedPolicies: Partial<{
    [K in keyof PolicyMapType]: { result: unknown };
  }> = {};

  for (const { policyPackageName, toolPolicyParams } of validatedPolicies) {
    evaluatedPolicies.push(policyPackageName);

    const policy = vincentTool.supportedPolicies[policyPackageName];
    try {
      const litActionResponse = await Lit.Actions.call({
        ipfsId: policy.policyDef.ipfsCid,
        params: {
          toolParams: toolPolicyParams,
          context: {
            userPkpTokenId: userPkpInfo.tokenId,
          },
        },
      });

      const result = parseAndValidateEvaluateResult({
        litActionResponse,
        policyDef: policy.policyDef,
      });

      if (isPolicyDenyResponse(result)) {
        policyDeniedResult = {
          ...(result as PolicyResponseDeny<typeof policy.policyDef.evalDenyResultSchema>),
          packageName: policyPackageName,
        };
      } else {
        rawAllowedPolicies[policyPackageName] = {
          result: result.result,
        };
      }
    } catch (err) {
      const denyResult = createDenyResult({
        ipfsCid: policy.policyDef.ipfsCid,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      policyDeniedResult = { ...denyResult, packageName: policyPackageName };
    }
  }

  if (policyDeniedResult) {
    return createDenyEvaluationResult({
      allowedPolicies: policyEvaluationResults,
      evaluatedPolicies,
      deniedPolicy: policyDeniedResult,
    });
  }

  return createAllowEvaluationResult({
    evaluatedPolicies,
    allowedPolicies:
      rawAllowedPolicies as PolicyEvaluationResultContext<PolicyMapType>['allowedPolicies'],
  });
}

function parseAndValidateEvaluateResult<
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
>({
  litActionResponse,
  policyDef,
}: {
  litActionResponse: string;
  policyDef: VincentPolicyDef<
    string,
    z.ZodType,
    any,
    any,
    any,
    EvalAllowResult,
    EvalDenyResult,
    any,
    any,
    any,
    any,
    any,
    any
  >;
}): PolicyResponse<EvalAllowResult, EvalDenyResult> {
  let parsedLitActionResponse: unknown;
  try {
    parsedLitActionResponse = JSON.parse(litActionResponse);
  } catch (error) {
    console.log('rawLitActionResponse (parsePolicyExecutionResult)', litActionResponse);
    throw new Error(
      `Failed to JSON parse Lit Action Response: ${error instanceof Error ? error.message : String(error)}. rawLitActionResponse in request logs (parsePolicyExecutionResult)`,
    );
  }

  try {
    const { schemaToUse } = getSchemaForPolicyResponseResult({
      value: parsedLitActionResponse,
      denyResultSchema: policyDef.evalDenyResultSchema,
      allowResultSchema: policyDef.evalAllowResultSchema,
    });

    return validateOrDeny(
      parsedLitActionResponse,
      schemaToUse,
      policyDef.ipfsCid,
      'evaluate',
      'output',
    ) as PolicyResponse<EvalAllowResult, EvalDenyResult>;
  } catch (err) {
    return createDenyResult({
      ipfsCid: policyDef.ipfsCid,
      message: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
