// src/lib/handlers/vincentPolicyHandler.ts

import { ethers } from 'ethers';

import { InferOrUndefined, PolicyConsumerContext, VincentPolicy } from '../types';
import {
  getDecodedPolicyParams,
  getPoliciesAndAppVersion,
} from '../policyCore/policyParameters/getOnchainPolicyParams';
import { LIT_DATIL_PUBKEY_ROUTER_ADDRESS, LIT_DATIL_VINCENT_ADDRESS } from './constants';
import { createDenyResult } from '../policyCore/helpers';
import { z } from 'zod';
import { getPkpInfo } from '../toolCore/helpers';

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

const bigintReplacer = (key: any, value: any) => {
  return typeof value === 'bigint' ? value.toString() : value;
};

/** @hidden */
export async function vincentPolicyHandler<
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
  const { delegatorPkpEthAddress, toolIpfsCid } = context; // FIXME: Set from ipfsCidsStack when it's shipped

  console.log('actionIpfsIds:', LitAuth.actionIpfsIds.join(','));
  const policyIpfsCid = LitAuth.actionIpfsIds[0];

  console.log('context:', JSON.stringify(context));
  try {
    const delegationRpcUrl = await Lit.Actions.getRpcUrl({
      chain: 'yellowstone',
    });

    const userPkpInfo = await getPkpInfo({
      litPubkeyRouterAddress: LIT_DATIL_PUBKEY_ROUTER_ADDRESS,
      yellowstoneRpcUrl: 'https://yellowstone-rpc.litprotocol.com/',
      pkpEthAddress: delegatorPkpEthAddress,
    });
    const appDelegateeAddress = ethers.utils.getAddress(LitAuth.authSigAddress);
    console.log('appDelegateeAddress', appDelegateeAddress);

    const { policies, appId, appVersion } = await getPoliciesAndAppVersion({
      delegationRpcUrl,
      vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
      appDelegateeAddress,
      agentWalletPkpTokenId: userPkpInfo.tokenId,
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
      policies,
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
          message: error instanceof Error ? error.message : String(error),
        }),
      ),
    });
  }
}
