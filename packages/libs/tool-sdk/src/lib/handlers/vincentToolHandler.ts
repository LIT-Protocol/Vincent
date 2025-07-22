import type { z } from 'zod';

import { ethers } from 'ethers';

import type { ToolPolicyMap } from '../toolCore/helpers';
import type { BaseToolContext } from '../toolCore/toolConfig/context/types';
import type {
  BaseContext,
  PolicyEvaluationResultContext,
  ToolConsumerContext,
  ToolExecutionPolicyContext,
  VincentTool,
} from '../types';

import { assertSupportedToolVersion } from '../assertSupportedToolVersion';
import { getPoliciesAndAppVersion } from '../policyCore/policyParameters/getOnchainPolicyParams';
import { getPkpInfo } from '../toolCore/helpers';
import { isToolFailureResult } from '../toolCore/helpers/typeGuards';
import { validatePolicies } from '../toolCore/helpers/validatePolicies';
import { validateOrFail } from '../toolCore/helpers/zod';
import { bigintReplacer } from '../utils';
import { LIT_DATIL_PUBKEY_ROUTER_ADDRESS } from './constants';
import { evaluatePolicies } from './evaluatePolicies';

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

declare const vincentToolApiVersion: string;

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

/** @hidden */
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
    assertSupportedToolVersion(vincentToolApiVersion);

    let policyEvalResults: PolicyEvaluationResultContext<PoliciesByPackageName> | undefined =
      undefined;
    const toolIpfsCid = LitAuth.actionIpfsIds[0];
    const appDelegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);

    // Build an initial baseContext -- we will add info as we execute, so if an error is encountered the consumer gets
    // all of the info we did find along the way
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
        yellowstoneRpcUrl: delegationRpcUrl,
        pkpEthAddress: context.delegatorPkpEthAddress,
      });
      baseContext.delegation.delegatorPkpInfo = userPkpInfo;

      const { decodedPolicies, appId, appVersion } = await getPoliciesAndAppVersion({
        delegationRpcUrl,
        appDelegateeAddress,
        agentWalletPkpEthAddress: context.delegatorPkpEthAddress,
        toolIpfsCid,
      });
      baseContext.appId = appId.toNumber();
      baseContext.appVersion = appVersion.toNumber();

      const validatedPolicies = await validatePolicies({
        decodedPolicies,
        vincentTool,
        parsedToolParams: parsedOrFail,
        toolIpfsCid,
      });

      console.log('validatedPolicies', JSON.stringify(validatedPolicies, bigintReplacer));

      const policyEvaluationResults = await evaluatePolicies({
        validatedPolicies,
        vincentTool,
        context: baseContext,
        vincentToolApiVersion,
      });

      console.log(
        'policyEvaluationResults',
        JSON.stringify(policyEvaluationResults, bigintReplacer),
      );

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

      console.log('toolExecutionResult', JSON.stringify(toolExecutionResult, bigintReplacer));

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
            runtimeError: err instanceof Error ? err.message : String(err),
          },
        }),
      });
    }
  };
};
