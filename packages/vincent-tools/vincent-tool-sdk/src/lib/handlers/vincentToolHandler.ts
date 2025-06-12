import { ethers } from 'ethers';

import {
  PolicyEvaluationResultContext,
  ToolConsumerContext,
  ToolExecutionPolicyContext,
  VincentTool,
} from '../types';
import type { BaseContext } from '../types';
import { getPkpInfo } from '../toolCore/helpers';
import { evaluatePolicies } from './evaluatePolicies';
import { validateOrFail } from '../toolCore/helpers/zod';
import { isToolFailureResult } from '../toolCore/helpers/typeGuards';
import { LIT_DATIL_PUBKEY_ROUTER_ADDRESS, LIT_DATIL_VINCENT_ADDRESS } from './constants';
import { validatePolicies } from '../toolCore/helpers/validatePolicies';
import { ToolPolicyMap } from '../toolCore/helpers';
import { z } from 'zod';
import { getPoliciesAndAppVersion } from '../policyCore/policyParameters/getOnchainPolicyParams';
import type { BaseToolContext } from '../toolCore/toolDef/context/types';

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

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createToolExecutionContext<
  ToolParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
>({
  vincentTool,
  policyEvaluationResults,
  baseContext,
}: {
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
  policyEvaluationResults: PolicyEvaluationResultContext<PoliciesByPackageName>;
  baseContext: BaseContext;
}): ToolExecutionPolicyContext<PoliciesByPackageName> {
  if (!policyEvaluationResults.allow) {
    throw new Error('Received denied policies to createToolExecutionContext()');
  }

  const newContext: ToolExecutionPolicyContext<PoliciesByPackageName> = {
    allow: true,
    evaluatedPolicies: policyEvaluationResults.evaluatedPolicies,
    allowedPolicies: {} as ToolExecutionPolicyContext<PoliciesByPackageName>['allowedPolicies'],
  };

  const policyByPackageName = vincentTool.supportedPolicies.policyByPackageName;
  const allowedKeys = Object.keys(policyEvaluationResults.allowedPolicies) as Array<
    keyof typeof policyByPackageName
  >;

  for (const packageName of allowedKeys) {
    const entry = policyEvaluationResults.allowedPolicies[packageName];
    const policy = policyByPackageName[packageName];
    const vincentPolicy = policy.vincentPolicy;

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
    if (vincentPolicy.commit) {
      const commitFn = vincentPolicy.commit;
      resultWrapper.commit = (commitParams) => {
        return commitFn(commitParams, baseContext);
      };
    }

    newContext.allowedPolicies[packageName] =
      resultWrapper as ToolExecutionPolicyContext<PoliciesByPackageName>['allowedPolicies'][typeof packageName];
  }

  return newContext;
}

export const vincentToolHandler = <
  ToolParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends ToolPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
>({
  vincentTool,
  toolParams,
  context,
}: {
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
  context: ToolConsumerContext;
  toolParams: Record<string, unknown>;
}) => {
  return async () => {
    let policyEvalResults: PolicyEvaluationResultContext<PoliciesByPackageName> | undefined =
      undefined;
    const toolIpfsCid = LitAuth.actionIpfsIds[0];
    const appDelegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);

    const baseContext = {
      delegation: {
        delegateeAddress: appDelegateeAddress,
        // delegatorPkpInfo: null,
      },
      toolIpfsCid,
      // appId: undefined,
      // appVersion: undefined,
    } as any;

    try {
      const delegationRpcUrl = await Lit.Actions.getRpcUrl({ chain: 'yellowstone' });

      const parsedOrFail = validateOrFail(
        toolParams,
        vincentTool.toolParamsSchema,
        'execute',
        'input',
      );

      if (isToolFailureResult(parsedOrFail)) {
        Lit.Actions.setResponse({
          response: JSON.stringify({
            toolExecutionResult: parsedOrFail,
          }),
        });
        return;
      }

      const userPkpInfo = await getPkpInfo({
        litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
        yellowstoneRpcUrl: 'https://yellowstone-rpc.litprotocol.com/',
        pkpEthAddress: context.delegatorPkpEthAddress,
      });
      baseContext.delegation.delegatorPkpInfo = userPkpInfo;

      const { policies, appId, appVersion } = await getPoliciesAndAppVersion({
        delegationRpcUrl,
        vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
        appDelegateeAddress,
        agentWalletPkpTokenId: userPkpInfo.tokenId,
        toolIpfsCid,
      });
      baseContext.appId = appId.toNumber();
      baseContext.appVersion = appVersion.toNumber();

      const validatedPolicies = await validatePolicies({
        policies,
        vincentTool,
        parsedToolParams: parsedOrFail,
        toolIpfsCid,
      });

      console.log('validatedPolicies', JSON.stringify(validatedPolicies));

      const policyEvaluationResults = await evaluatePolicies({
        validatedPolicies,
        vincentTool,
        context: baseContext,
      });

      console.log('policyEvaluationResults', JSON.stringify(policyEvaluationResults));

      policyEvalResults = policyEvaluationResults;

      if (!policyEvalResults.allow) {
        Lit.Actions.setResponse({
          response: JSON.stringify({
            toolContext: {
              ...baseContext,
              policiesContext: policyEvaluationResults,
            } as BaseToolContext<typeof policyEvaluationResults>,
            toolExecutionResult: {
              success: false,
            },
          }),
        });
        return;
      }

      const executeContext = createToolExecutionContext({
        vincentTool,
        policyEvaluationResults,
        baseContext,
      });

      const toolExecutionResult = await vincentTool.execute(
        {
          toolParams: parsedOrFail,
        },
        {
          ...baseContext,
          policiesContext: executeContext,
        },
      );

      console.log('toolExecutionResult', toolExecutionResult);

      Lit.Actions.setResponse({
        response: JSON.stringify({
          toolExecutionResult,
          toolContext: {
            ...baseContext,
            policiesContext: policyEvaluationResults,
          } as BaseToolContext<typeof policyEvaluationResults>,
        }),
      });
    } catch (err) {
      Lit.Actions.setResponse({
        response: JSON.stringify({
          toolContext: {
            ...baseContext,
            policiesContext: policyEvalResults,
          } as BaseToolContext<typeof policyEvalResults>,
          toolExecutionResult: {
            success: false,
            error: err instanceof Error ? err.message : String(err),
          },
        }),
      });
    }
  };
};
