import type { z } from 'zod';

import { ethers } from 'ethers';

import type { BaseAbilityContext } from '../abilityCore/abilityConfig/context/types';
import type { AbilityPolicyMap } from '../abilityCore/helpers';
import type {
  BaseContext,
  PolicyEvaluationResultContext,
  AbilityConsumerContext,
  AbilityExecutionPolicyContext,
  VincentAbility,
} from '../types';

import { getPkpInfo } from '../abilityCore/helpers';
import { isAbilityFailureResult } from '../abilityCore/helpers/typeGuards';
import { validatePolicies } from '../abilityCore/helpers/validatePolicies';
import { validateOrFail } from '../abilityCore/helpers/zod';
import { assertSupportedAbilityVersion } from '../assertSupportedAbilityVersion';
import { getPoliciesAndAppVersion } from '../policyCore/policyParameters/getOnchainPolicyParams';
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

declare const vincentAbilityApiVersion: string;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function createAbilityExecutionContext<
  AbilityParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends AbilityPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
>({
  vincentAbility,
  policyEvaluationResults,
  baseContext,
}: {
  vincentAbility: VincentAbility<
    AbilityParamsSchema,
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
}): AbilityExecutionPolicyContext<PoliciesByPackageName> {
  if (!policyEvaluationResults.allow) {
    throw new Error('Received denied policies to createAbilityExecutionContext()');
  }

  const newContext: AbilityExecutionPolicyContext<PoliciesByPackageName> = {
    allow: true,
    evaluatedPolicies: policyEvaluationResults.evaluatedPolicies,
    allowedPolicies: {} as AbilityExecutionPolicyContext<PoliciesByPackageName>['allowedPolicies'],
  };

  const policyByPackageName = vincentAbility.supportedPolicies.policyByPackageName;
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
      resultWrapper as AbilityExecutionPolicyContext<PoliciesByPackageName>['allowedPolicies'][typeof packageName];
  }

  return newContext;
}

/** @hidden */
export const vincentAbilityHandler = <
  AbilityParamsSchema extends z.ZodType,
  PkgNames extends string,
  PolicyMap extends AbilityPolicyMap<any, PkgNames>,
  PoliciesByPackageName extends PolicyMap['policyByPackageName'],
>({
  vincentAbility,
  abilityParams,
  context,
}: {
  vincentAbility: VincentAbility<
    AbilityParamsSchema,
    PkgNames,
    PolicyMap,
    PoliciesByPackageName,
    any,
    any,
    any,
    any
  >;
  context: AbilityConsumerContext;
  abilityParams: Record<string, unknown>;
}) => {
  return async () => {
    assertSupportedAbilityVersion(vincentAbilityApiVersion);

    let policyEvalResults: PolicyEvaluationResultContext<PoliciesByPackageName> | undefined =
      undefined;
    const abilityIpfsCid = LitAuth.actionIpfsIds[0];
    const appDelegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);

    // Build an initial baseContext -- we will add info as we execute, so if an error is encountered the consumer gets
    // all of the info we did find along the way
    const baseContext = {
      delegation: {
        delegateeAddress: appDelegateeAddress,
        // delegatorPkpInfo: null,
      },
      abilityIpfsCid,
      // appId: undefined,
      // appVersion: undefined,
    } as any;

    try {
      const delegationRpcUrl = await Lit.Actions.getRpcUrl({ chain: 'yellowstone' });

      const parsedOrFail = validateOrFail(
        abilityParams,
        vincentAbility.abilityParamsSchema,
        'execute',
        'input',
      );

      if (isAbilityFailureResult(parsedOrFail)) {
        Lit.Actions.setResponse({
          response: JSON.stringify({
            abilityExecutionResult: parsedOrFail,
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
        abilityIpfsCid,
      });
      baseContext.appId = appId.toNumber();
      baseContext.appVersion = appVersion.toNumber();

      const validatedPolicies = await validatePolicies({
        decodedPolicies,
        vincentAbility,
        parsedAbilityParams: parsedOrFail,
        abilityIpfsCid,
      });

      console.log('validatedPolicies', JSON.stringify(validatedPolicies, bigintReplacer));

      const policyEvaluationResults = await evaluatePolicies({
        validatedPolicies,
        vincentAbility,
        context: baseContext,
        vincentAbilityApiVersion,
      });

      console.log(
        'policyEvaluationResults',
        JSON.stringify(policyEvaluationResults, bigintReplacer),
      );

      policyEvalResults = policyEvaluationResults;

      if (!policyEvalResults.allow) {
        Lit.Actions.setResponse({
          response: JSON.stringify({
            abilityContext: {
              ...baseContext,
              policiesContext: policyEvaluationResults,
            } as BaseAbilityContext<typeof policyEvaluationResults>,
            abilityExecutionResult: {
              success: false,
            },
          }),
        });
        return;
      }

      const executeContext = createAbilityExecutionContext({
        vincentAbility,
        policyEvaluationResults,
        baseContext,
      });

      const abilityExecutionResult = await vincentAbility.execute(
        {
          abilityParams: parsedOrFail,
        },
        {
          ...baseContext,
          policiesContext: executeContext,
        },
      );

      console.log('abilityExecutionResult', JSON.stringify(abilityExecutionResult, bigintReplacer));

      Lit.Actions.setResponse({
        response: JSON.stringify({
          abilityExecutionResult,
          abilityContext: {
            ...baseContext,
            policiesContext: policyEvaluationResults,
          } as BaseAbilityContext<typeof policyEvaluationResults>,
        }),
      });
    } catch (err) {
      Lit.Actions.setResponse({
        response: JSON.stringify({
          abilityContext: {
            ...baseContext,
            policiesContext: policyEvalResults,
          } as BaseAbilityContext<typeof policyEvalResults>,
          abilityExecutionResult: {
            success: false,
            runtimeError: err instanceof Error ? err.message : String(err),
          },
        }),
      });
    }
  };
};
