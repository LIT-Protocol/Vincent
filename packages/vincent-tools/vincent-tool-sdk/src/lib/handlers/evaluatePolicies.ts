// src/lib/handlers/evaluatePolicies.ts

import { z } from 'zod';
import { ValidatedPolicyMap } from '../toolCore/helpers/validatePolicies';
import {
  BaseContext,
  PolicyEvaluationResultContext,
  PolicyResponse,
  PolicyResponseDeny,
  PolicyResponseDenyNoResult,
  VincentPolicy,
  VincentTool,
  ZodValidationDenyResult,
} from '../types';
import {
  createDenyResult,
  getSchemaForPolicyResponseResult,
  isPolicyDenyResponse,
  validateOrDeny,
} from '../policyCore/helpers';
import {
  createAllowEvaluationResult,
  createDenyEvaluationResult,
  returnNoResultDeny,
} from '../policyCore/helpers/resultCreators';
import { ToolPolicyMap } from '../toolCore/helpers';

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
  PolicyMap extends ToolPolicyMap<any, any>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
>({
  vincentTool,
  context,
  validatedPolicies,
}: {
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
  context: BaseContext;
  validatedPolicies: ValidatedPolicyMap<z.infer<ToolParamsSchema>, PoliciesByPackageName>;
}): Promise<PolicyEvaluationResultContext<PoliciesByPackageName>> {
  const evaluatedPolicies: PolicyEvaluationResultContext<PoliciesByPackageName>['evaluatedPolicies'] =
    [];
  const policyEvaluationResults: PolicyEvaluationResultContext<PoliciesByPackageName>['allowedPolicies'] =
    {};
  let policyDeniedResult: PolicyEvaluationResultContext<PoliciesByPackageName>['deniedPolicy'] =
    undefined;
  const rawAllowedPolicies: Partial<{
    [K in keyof PoliciesByPackageName]: { result: unknown };
  }> = {};

  for (const { policyPackageName, toolPolicyParams } of validatedPolicies) {
    evaluatedPolicies.push(policyPackageName);

    const policy = vincentTool.policyMap.policyByPackageName[policyPackageName];
    try {
      const litActionResponse = await Lit.Actions.call({
        ipfsId: policy.vincentPolicy.ipfsCid,
        params: {
          toolParams: toolPolicyParams,
          context,
        },
      });

      const result = parseAndValidateEvaluateResult({
        litActionResponse,
        vincentPolicy: policy.vincentPolicy,
      });

      if (isPolicyDenyResponse(result)) {
        policyDeniedResult = {
          ...(result as PolicyResponseDeny<typeof policy.vincentPolicy.evalDenyResultSchema>),
          packageName: policyPackageName,
        };
      } else {
        rawAllowedPolicies[policyPackageName] = {
          result: result.result,
        };
      }
    } catch (err) {
      const denyResult = createDenyResult({
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
      rawAllowedPolicies as PolicyEvaluationResultContext<PoliciesByPackageName>['allowedPolicies'],
  });
}

function parseAndValidateEvaluateResult<
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
>({
  litActionResponse,
  vincentPolicy,
}: {
  litActionResponse: string;
  vincentPolicy: VincentPolicy<
    string,
    z.ZodType,
    any,
    any,
    any,
    EvalAllowResult,
    EvalDenyResult,
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
      denyResultSchema: vincentPolicy.evalDenyResultSchema || z.undefined(),
      allowResultSchema: vincentPolicy.evalAllowResultSchema || z.undefined(),
    });

    return validateOrDeny(
      parsedLitActionResponse,
      schemaToUse,
      'evaluate',
      'output',
    ) as PolicyResponse<EvalAllowResult, EvalDenyResult>;
  } catch (err) {
    return returnNoResultDeny<EvalDenyResult>(
      err instanceof Error ? err.message : 'Unknown error',
    ) as unknown as EvalDenyResult extends z.ZodType
      ? PolicyResponseDeny<z.infer<EvalDenyResult> | ZodValidationDenyResult>
      : PolicyResponseDenyNoResult;
  }
}
