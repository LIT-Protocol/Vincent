// src/lib/handlers/vincentPolicyHandler.ts

import { ethers } from 'ethers';

import { evaluate } from '../policyCore';

import type { VincentPolicyDef } from '../types';
import { getOnchainPolicyParams } from '../policyCore/policyParameters/getOnchainPolicyParams';
import { LIT_DATIL_VINCENT_ADDRESS } from './constants';
import { createDenyResult } from '../policyCore/helpers';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

export const vincentPolicyHandler = async ({
  vincentPolicyDef,
  context,
  toolParams,
}: {
  vincentPolicyDef: VincentPolicyDef<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >;
  toolParams: unknown;
  context: {
    userPkpTokenId: string;
    toolIpfsCid: string;
    rpcUrl: string;
  };
}) => {
  const { userPkpTokenId, toolIpfsCid } = context;
  const policyIpfsCid = LitAuth.actionIpfsIds[0];

  try {
    const delegationRpcUrl = await Lit.Actions.getRpcUrl({
      chain: 'yellowstone',
    });

    const onChainPolicyParams = await getOnchainPolicyParams({
      delegationRpcUrl,
      vincentContractAddress: LIT_DATIL_VINCENT_ADDRESS,
      appDelegateeAddress: ethers.utils.getAddress(LitAuth.authSigAddress),
      agentWalletPkpTokenId: userPkpTokenId,
      toolIpfsCid: toolIpfsCid,
      policyIpfsCid,
    });

    const evaluateResult = await evaluate(vincentPolicyDef, {
      toolParams,
      userParams: onChainPolicyParams,
      delegation: {
        delegatee: ethers.utils.getAddress(LitAuth.authSigAddress),
        delegator: userPkpTokenId,
      },
    });

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
};
