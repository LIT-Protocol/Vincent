import { z } from 'zod';
import { PolicyEvaluationResultContext } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';
import { Percent } from '@uniswap/sdk-core';

import {
  UniswapSwapToolParamsSchema,
  UniswapSwapToolExecuteSuccessSchema,
  UniswapSwapToolExecuteFailSchema,
} from './vincent-tool';
import { getPkpInfo } from './tool-helpers/get-pkp-info';
import { getUniswapQuote } from './tool-helpers/get-uniswap-quote';
import { sendErc20Approval } from './tool-helpers/send-erc20-approval';
import { sendUniswapTx } from './tool-helpers/send-uniswap-tx';
import { FeeAmount } from '@uniswap/v3-sdk';
import { getTokenAmountInUsd } from './tool-helpers/get-token-amount-in-usd';

export const UniswapSwapToolExecute = async (
  {
    toolParams,
  }: {
    toolParams: z.infer<typeof UniswapSwapToolParamsSchema>;
  },
  {
    policiesContext,
    succeed,
    fail,
  }: {
    policiesContext: PolicyEvaluationResultContext<{
      '@lit-protocol/vincent-policy-spending-limit': {
        policyDef: typeof SpendingLimitPolicyDef;
      };
    }>;
    succeed: (result: z.infer<typeof UniswapSwapToolExecuteSuccessSchema>) => void;
    fail: (result: z.infer<typeof UniswapSwapToolExecuteFailSchema>) => void;
  },
) => {
  try {
    const {
      pkpEthAddress,
      ethRpcUrl,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
      poolFee,
      slippageTolerance,
      swapDeadline,
    } = UniswapSwapToolParamsSchema.parse(toolParams);

    const pkpInfo = await getPkpInfo({
      pkpEthAddress: pkpEthAddress as `0x${string}`,
    });
    console.log(
      `Retrieved PKP info for PKP ETH Address: ${pkpEthAddress}: ${JSON.stringify(pkpInfo)} (UniswapSwapToolEval)`,
    );

    const { swapQuote, uniswapSwapRoute, uniswapTokenIn, uniswapTokenOut } = await getUniswapQuote({
      ethRpcUrl,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
      poolFee: poolFee ?? FeeAmount.MEDIUM,
    });

    const erc20ApprovalTxHash = await sendErc20Approval({
      ethRpcUrl,
      tokenInAmount,
      tokenInDecimals,
      tokenInAddress: tokenInAddress as `0x${string}`,
      pkpEthAddress: pkpEthAddress as `0x${string}`,
      pkpPublicKey: pkpInfo.publicKey,
    });

    const swapTxHash = await sendUniswapTx({
      toolParams,
      pkpPublicKey: pkpInfo.publicKey,
      uniswapSwapRoute,
      uniswapTokenIn,
      uniswapTokenOut,
      swapQuote,
      slippageTolerance: new Percent(slippageTolerance ?? 50, 10_000),
      swapDeadline: BigInt(swapDeadline ?? Math.floor(Date.now() / 1000) + 60 * 20),
    });

    let spendTxHash: string | undefined;
    if (
      policiesContext?.allowedPolicies &&
      policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit']
    ) {
      const tokenInAmountInUsd = await getTokenAmountInUsd({
        ethRpcUrl,
        tokenAddress: tokenInAddress,
        tokenAmount: tokenInAmount,
        tokenDecimals: tokenInDecimals,
        poolFee: poolFee ?? FeeAmount.MEDIUM,
      });

      const spendingLimitPolicyContext =
        policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'];
      const { appId, maxSpendingLimitInUsd } = spendingLimitPolicyContext.result;

      // TODO
      // @ts-expect-error Property 'commit' does not exist on type '{ result: never; }'.
      spendTxHash = await spendingLimitPolicyContext.commit({
        appId,
        amountSpentUsd: tokenInAmountInUsd,
        maxSpendingLimitInUsd,
        pkpEthAddress,
        pkpPubKey: pkpInfo.publicKey,
      });
      console.log(
        `Committed spending limit policy for transaction: ${spendTxHash} (UniswapSwapToolExecute)`,
      );
    }

    return succeed({
      erc20ApprovalTxHash,
      swapTxHash,
      spendTxHash,
    });
  } catch (error) {
    return fail({
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
