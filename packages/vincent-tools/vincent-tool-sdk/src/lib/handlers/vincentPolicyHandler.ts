// src/lib/handlers/vincentPolicyHandler.ts

import { ethers } from 'ethers';

import { InferOrUndefined, VincentPolicy } from '../types';
import { getOnePolicysOnChainParams } from '../policyCore/policyParameters/getOnchainPolicyParams';
import { LIT_DATIL_VINCENT_ADDRESS } from './constants';
import { createDenyResult } from '../policyCore/helpers';
import { z } from 'zod';

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
  toolParams: PolicyToolParams;
  context: {
    userPkpTokenId: string;
  };
}) {
  const { userPkpTokenId } = context;
  const policyIpfsCid = LitAuth.actionIpfsIds[0];
  const toolIpfsCid = LitAuth.actionIpfsIds[1];

  try {
    const delegationRpcUrl = await Lit.Actions.getRpcUrl({
      chain: 'yellowstone',
    });

    const onChainPolicyParams = await getOnePolicysOnChainParams({
      delegationRpcUrl,
      vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
      appDelegateeAddress: ethers.utils.getAddress(LitAuth.authSigAddress),
      agentWalletPkpTokenId: userPkpTokenId,
      toolIpfsCid,
      policyIpfsCid,
    });

    const evaluateResult = await vincentPolicy.evaluate(
      {
        toolParams,
        userParams: onChainPolicyParams as InferOrUndefined<UserParams>,
      },
      {
        delegation: {
          delegatee: ethers.utils.getAddress(LitAuth.authSigAddress),
          delegator: userPkpTokenId,
        },
      },
    );

    Lit.Actions.setResponse({
      response: JSON.stringify({
        ...evaluateResult,
      }),
    });
  } catch (error) {
    Lit.Actions.setResponse({
      response: JSON.stringify(
        createDenyResult({
          message: error instanceof Error ? error.message : String(error),
        }),
      ),
    });
  }
}
