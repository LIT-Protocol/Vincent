// src/lib/handlers/vincentPolicyHandler.ts

import { ethers } from 'ethers';

import { InferOrUndefined, VincentPolicyDef } from '../types';
import { getOnePolicysOnChainParams } from '../policyCore/policyParameters/getOnchainPolicyParams';
import { LIT_DATIL_VINCENT_ADDRESS } from './constants';
import { createDenyResult } from '../policyCore/helpers';
import { createVincentPolicy } from '../policyCore';
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
  vincentPolicyDef,
  context,
  toolParams,
}: {
  vincentPolicyDef: VincentPolicyDef<
    PackageName,
    PolicyToolParams,
    UserParams,
    any, // PrecheckAllowResult
    any, // PrecheckDenyResult
    EvalAllowResult,
    EvalDenyResult,
    any, // CommitParams
    any, // CommitAllowResult
    any, // CommitDenyResult
    any, // evaluate
    any, // precheck
    any // commit
  >;
  toolParams: PolicyToolParams;
  context: {
    userPkpTokenId: string;
    toolIpfsCid: string;
    rpcUrl: string;
  };
}) {
  const { userPkpTokenId, toolIpfsCid } = context;
  const policyIpfsCid = LitAuth.actionIpfsIds[0];

  try {
    const delegationRpcUrl = await Lit.Actions.getRpcUrl({
      chain: 'yellowstone',
    });

    const onChainPolicyParams = await getOnePolicysOnChainParams({
      delegationRpcUrl,
      vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
      appDelegateeAddress: ethers.utils.getAddress(LitAuth.authSigAddress),
      agentWalletPkpTokenId: userPkpTokenId,
      toolIpfsCid: toolIpfsCid,
      policyIpfsCid,
    });

    const vincentPolicy = createVincentPolicy(vincentPolicyDef);
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
        ipfsCid: policyIpfsCid,
      }),
    });
  } catch (error) {
    Lit.Actions.setResponse({
      response: JSON.stringify(
        createDenyResult({
          ipfsCid: policyIpfsCid,
          message: error instanceof Error ? error.message : String(error),
        }),
      ),
    });
  }
}
