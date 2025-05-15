import { z } from 'zod';
import { createVincentTool, createVincentToolPolicy } from '@lit-protocol/vincent-tool-sdk';
import { SpendingLimitPolicyDef } from '@lit-protocol/vincent-policy-spending-limit';

import { UniswapSwapToolPrecheck } from './vincent-tool-precheck';
import { getPkpInfo } from './tool-helpers/get-pkp-info';
import { getUniswapQuote } from './tool-helpers/get-uniswap-quote';
import { sendErc20Approval } from './tool-helpers/send-erc20-approval';
import { sendUniswapTx } from './tool-helpers/send-uniswap-tx';
import { getTokenAmountInUsd } from './tool-helpers/get-token-amount-in-usd';
import { FeeAmount } from '@uniswap/v3-sdk';
import { Percent } from '@uniswap/sdk-core';

export const UniswapSwapToolParamsSchema = z.object({
  ethRpcUrl: z.string(),
  pkpEthAddress: z.string(),

  tokenInAddress: z.string(),
  tokenInDecimals: z.number(),
  tokenInAmount: z.bigint().refine((val) => val > 0n, {
    message: 'tokenInAmount must be greater than 0',
  }),

  tokenOutAddress: z.string(),
  tokenOutDecimals: z.number(),

  poolFee: z.number().optional(),
  slippageTolerance: z.number().optional(),
  swapDeadline: z.number().optional(),
});

export const UniswapSwapToolPrecheckSuccessSchema = z.object({
  allow: z.literal(true),
});

export const UniswapSwapToolPrecheckFailSchema = z.object({
  allow: z.literal(false),
  error: z.string(),
});

export const UniswapSwapToolExecuteSuccessSchema = z.object({
  erc20ApprovalTxHash: z.string(),
  swapTxHash: z.string(),
  spendTxHash: z.string().optional(),
});

export const UniswapSwapToolExecuteFailSchema = z.object({
  error: z.string(),
});

const SpendingLimitPolicy = createVincentToolPolicy({
  toolParamsSchema: UniswapSwapToolParamsSchema,
  policyDef: SpendingLimitPolicyDef,
  toolParameterMappings: {
    pkpEthAddress: 'pkpEthAddress',
    ethRpcUrl: 'ethRpcUrl',
    tokenInAddress: 'tokenAddress',
    tokenInDecimals: 'tokenDecimals',
    tokenInAmount: 'buyAmount',
  },
});

export const UniswapSwapToolDef = createVincentTool({
  toolParamsSchema: UniswapSwapToolParamsSchema,
  supportedPolicies: [SpendingLimitPolicy] as const,

  precheckSuccessSchema: UniswapSwapToolPrecheckSuccessSchema,
  precheckFailSchema: UniswapSwapToolPrecheckFailSchema,
  executeSuccessSchema: UniswapSwapToolExecuteSuccessSchema,
  executeFailSchema: UniswapSwapToolExecuteFailSchema,

  precheck: UniswapSwapToolPrecheck,
  execute: async ({ toolParams }, { succeed, fail, policiesContext }) => {
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
      } = toolParams;

      const pkpInfo = await getPkpInfo({
        pkpEthAddress: pkpEthAddress as `0x${string}`,
      });

      const { swapQuote, uniswapSwapRoute, uniswapTokenIn, uniswapTokenOut } =
        await getUniswapQuote({
          ethRpcUrl,
          tokenInAddress,
          tokenInDecimals,
          tokenInAmount,
          tokenOutAddress,
          tokenOutDecimals,
          poolFee: poolFee ?? FeeAmount.MEDIUM,
        });

      const erc20ApprovalTxHash = await sendErc20ApprovalTx({
        ethRpcUrl,
        tokenInAmount,
        tokenInDecimals,
        tokenInAddress: tokenInAddress as `0x${string}`,
        pkpEthAddress: pkpEthAddress as `0x${string}`,
        pkpPublicKey: pkpInfo.publicKey,
      });

      const swapTxHash = await sendUniswapTx({
        ethRpcUrl,
        pkpEthAddress: pkpEthAddress as `0x${string}`,
        tokenInDecimals,
        tokenInAmount,
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
        const commitFn =
          policiesContext.allowedPolicies['@lit-protocol/vincent-policy-spending-limit'].commit;
        if (commitFn) {
          const { appId, maxSpendingLimitInUsd } = spendingLimitPolicyContext.result;

          spendTxHash = await commitFn({
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
  },
});
