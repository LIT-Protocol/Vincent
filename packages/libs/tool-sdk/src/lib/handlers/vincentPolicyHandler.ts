// src/lib/handlers/vincentPolicyHandler.ts

import type { z } from 'zod';

import { ethers } from 'ethers';

import type { InferOrUndefined, PolicyConsumerContext, VincentPolicy } from '../types';

import { assertSupportedToolVersion } from '../assertSupportedToolVersion';
import { createDenyResult } from '../policyCore/helpers';
import {
  getDecodedPolicyParams,
  getPoliciesAndAppVersion,
} from '../policyCore/policyParameters/getOnchainPolicyParams';
import { getPkpInfo } from '../toolCore/helpers';
import { bigintReplacer } from '../utils';
import { LIT_DATIL_PUBKEY_ROUTER_ADDRESS } from './constants';

declare const Lit: {
  Actions: {
    getRpcUrl: (args: { chain: string }) => Promise<string>;
    setResponse: (response: { response: string }) => void;
  };
};
declare const LitAuth: {
  authSigAddress: string;
  actionIpfsIds: string[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */

declare const vincentToolApiVersion: string;

/** @hidden */
export async function vincentPolicyHandler<
  PackageName extends string,
  PolicyToolParams extends z.ZodType,
  UserParams extends z.ZodType | undefined = undefined,
  EvalAllowResult extends z.ZodType | undefined = undefined,
  EvalDenyResult extends z.ZodType | undefined = undefined,
>({
  vincentPolicy,
  context,
  toolParams,
}: {
  vincentPolicy: VincentPolicy<
    PackageName,
    PolicyToolParams,
    UserParams,
    any, // PrecheckAllowResult
    any, // PrecheckDenyResult
    EvalAllowResult,
    EvalDenyResult,
    any, // CommitParams
    any, // CommitAllowResult
    any // CommitDenyResult
  >;
  toolParams: unknown;
  context: PolicyConsumerContext;
}) {
  assertSupportedToolVersion(vincentToolApiVersion);

  const { delegatorPkpEthAddress, toolIpfsCid } = context; // FIXME: Set from ipfsCidsStack when it's shipped

  console.log('actionIpfsIds:', LitAuth.actionIpfsIds.join(','));
  const policyIpfsCid = LitAuth.actionIpfsIds[0];

  console.log('context:', JSON.stringify(context, bigintReplacer));
  try {
    const delegationRpcUrl = await Lit.Actions.getRpcUrl({
      chain: 'yellowstone',
    });

    const userPkpInfo = await getPkpInfo({
      litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
      yellowstoneRpcUrl: delegationRpcUrl,
      pkpEthAddress: delegatorPkpEthAddress,
    });
    const appDelegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    console.log('appDelegateeAddress', appDelegateeAddress);

    const { decodedPolicies, appId, appVersion } = await getPoliciesAndAppVersion({
      delegationRpcUrl,
      appDelegateeAddress,
      agentWalletPkpEthAddress: delegatorPkpEthAddress,
      toolIpfsCid,
    });

    const baseContext = {
      delegation: {
        delegateeAddress: appDelegateeAddress,
        delegatorPkpInfo: userPkpInfo,
      },
      toolIpfsCid: toolIpfsCid,
      appId: appId.toNumber(),
      appVersion: appVersion.toNumber(),
    };

    const onChainPolicyParams = await getDecodedPolicyParams({
      decodedPolicies,
      policyIpfsCid,
    });

    console.log('onChainPolicyParams:', JSON.stringify(onChainPolicyParams, bigintReplacer));
    const evaluateResult = await vincentPolicy.evaluate(
      {
        toolParams,
        userParams: onChainPolicyParams as InferOrUndefined<UserParams>,
      },
      baseContext,
    );

    console.log('evaluateResult:', JSON.stringify(evaluateResult, bigintReplacer));
    Lit.Actions.setResponse({
      response: JSON.stringify({
        ...evaluateResult,
      }),
    });
  } catch (error) {
    console.log('Policy evaluation failed:', (error as Error).message, (error as Error).stack);
    Lit.Actions.setResponse({
      response: JSON.stringify(
        createDenyResult({
          runtimeError: error instanceof Error ? error.message : String(error),
        }),
      ),
    });
  }
}
