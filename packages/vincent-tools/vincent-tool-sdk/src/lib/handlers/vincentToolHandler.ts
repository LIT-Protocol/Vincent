// src/lib/handlers/vincentToolHandler.ts

import { ethers } from 'ethers';

import {
  PolicyEvaluationResultContext,
  ToolExecutionPolicyContext,
  VincentToolDef,
} from '../types';
import type { BaseContext } from '../types';
import { createVincentTool } from '../toolCore/vincentTool';
import { validatePolicies } from '../toolCore/helpers';
import { evaluatePolicies } from './evaluatePolicies';
import { validateOrFail } from '../toolCore/helpers/zod';
import { isToolFailureResponse } from '../toolCore/helpers/typeGuards';
import { createVincentPolicy } from '../policyCore';

/* eslint-disable @typescript-eslint/no-explicit-any */

declare const LitAuth: {
  authSigAddress: string;
  actionIpfsIds: string[];
};
declare const Lit: {
  Actions: {
    setResponse: (response: { response: string }) => void;
    call: (params: { ipfsId: string; params: Record<string, unknown> }) => Promise<string>;
    getRpcUrl: (args: { chain: string }) => Promise<string>;
  };
};

type ExtractPolicyMapType<T> =
  T extends VincentToolDef<any, any, any, infer PolicyMap, any, any, any, any, any, any>
    ? PolicyMap
    : never;

export function createToolExecutionContext<
  Def extends VincentToolDef<any, any, any, any, any, any, any, any, any, any>,
>({
  vincentToolDef,
  policyEvaluationResults,
  userPkpTokenId,
}: {
  vincentToolDef: Def;
  policyEvaluationResults: PolicyEvaluationResultContext<ExtractPolicyMapType<Def>>;
  userPkpTokenId: string;
}): ToolExecutionPolicyContext<ExtractPolicyMapType<Def>> {
  const policyMap = createVincentTool(vincentToolDef)
    .supportedPolicies as ExtractPolicyMapType<Def>;

  if (!policyEvaluationResults.allow) {
    throw new Error('Received denied policies to createToolExecutionContext()');
  }

  const context: ToolExecutionPolicyContext<ExtractPolicyMapType<Def>> = {
    allow: true,
    evaluatedPolicies: policyEvaluationResults.evaluatedPolicies,
    allowedPolicies: {} as ToolExecutionPolicyContext<ExtractPolicyMapType<Def>>['allowedPolicies'],
  };

  const allowedKeys = Object.keys(policyEvaluationResults.allowedPolicies) as Array<
    keyof ExtractPolicyMapType<Def>
  >;
  for (const packageName of allowedKeys) {
    const entry = policyEvaluationResults.allowedPolicies[packageName];
    const policy = createVincentPolicy(policyMap[packageName].policyDef);

    if (!entry) {
      throw new Error(`Missing entry on allowedPolicies for policy: ${packageName as string}`);
    }

    const resultWrapper: {
      result: typeof entry.result;
      commit?: (params: any) => Promise<any>;
    } = {
      result: entry.result,
    };

    // TODO: Collect results of commit calls and add to the execution context result
    if (policy.commit) {
      resultWrapper.commit = (commitParams) => {
        const executionContext = {
          delegation: {
            delegatee: ethers.utils.getAddress(LitAuth.authSigAddress),
            delegator: userPkpTokenId,
          },
        };
        return policy.commit(commitParams, executionContext);
      };
    }

    context.allowedPolicies[packageName] = resultWrapper as ToolExecutionPolicyContext<
      ExtractPolicyMapType<Def>
    >['allowedPolicies'][typeof packageName];
  }

  return context;
}

export const vincentToolHandler = <
  Def extends VincentToolDef<any, any, any, any, any, any, any, any, any, any>,
>({
  vincentToolDef,
  toolParams,
  context,
}: {
  vincentToolDef: Def;
  context: BaseContext & { pkpTokenId: string };
  toolParams: Record<string, unknown>;
}) => {
  return async () => {
    let policyEvalResults: PolicyEvaluationResultContext<ExtractPolicyMapType<Def>> | undefined =
      undefined;

    try {
      const vincentTool = createVincentTool(vincentToolDef);

      const toolIpfsCid = LitAuth.actionIpfsIds[0];
      const delegationRpcUrl = await Lit.Actions.getRpcUrl({ chain: 'yellowstone' });
      const appDelegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);

      const parsedOrFail = validateOrFail(
        toolParams,
        vincentToolDef.toolParamsSchema,
        'execute',
        'input',
      );

      if (isToolFailureResponse(parsedOrFail)) {
        Lit.Actions.setResponse({
          response: JSON.stringify({
            toolExecutionResult: parsedOrFail,
          }),
        });
        return;
      }

      const validatedPolicies = await validatePolicies({
        delegationRpcUrl,
        appDelegateeAddress,
        vincentToolDef,
        parsedToolParams: parsedOrFail,
        toolIpfsCid,
        pkpTokenId: context.pkpTokenId,
      });

      const policyEvaluationResults = await evaluatePolicies({
        validatedPolicies,
        vincentToolDef,
        parsedToolParams: parsedOrFail,
      });

      policyEvalResults = policyEvaluationResults;

      if (policyEvalResults.allow === false) {
        Lit.Actions.setResponse({
          response: JSON.stringify({
            policyEvaluationResults: policyEvalResults,
            toolExecutionResult: {
              success: false,
            },
          }),
        });
        return;
      }

      const executeContext = createToolExecutionContext({
        vincentToolDef,
        policyEvaluationResults,
        userPkpTokenId: context.pkpTokenId,
      });

      const toolExecutionResult = await vincentTool.execute(parsedOrFail, {
        ...context,
        policiesContext: executeContext,
      });

      Lit.Actions.setResponse({
        response: JSON.stringify({
          policyEvaluationResults,
          toolExecutionResult,
        }),
      });
    } catch (err) {
      Lit.Actions.setResponse({
        response: JSON.stringify({
          policyEvaluationResults: policyEvalResults,
          toolExecutionResult: {
            success: false,
            error: err instanceof Error ? err.message : String(err),
          },
        }),
      });
    }
  };
};
