import { z } from 'zod';
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

import { sendSpendTx } from './policy-helpers/send-spend-tx';
import { checkIfBuyAmountAllowed } from './policy-helpers/check-spending-limit';

declare const Lit: {
  Actions: {
    runOnce: (
      params: {
        waitForResponse: boolean;
        name: string;
      },
      callback: () => Promise<unknown>,
    ) => Promise<string>;
  };
};

export const SpendingLimitPolicyToolParamsSchema = z.object({
  appId: z.number(),
  pkpEthAddress: z.string(),
  ethRpcUrl: z.string(),
  rpcUrlForUniswap: z.string(),
  chainIdForUniswap: z.number(),
  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  buyAmount: z.number(),
});

export const SpendingLimitPolicyUserParamsSchema = z.object({
  maxDailySpendAmountUsd: z.number(),
});

export const spendingLimitPolicyPrecheckAllowResultSchema = z.object({
  appId: z.number(),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const spendingLimitPolicyPrecheckDenyResultSchema = z.object({
  appId: z.number(),
  reason: z.literal('Attempted buy amount exceeds daily limit'),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const SpendingLimitPolicyEvalAllowResultSchema = z.object({
  appId: z.number(),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const SpendingLimitPolicyEvalDenyResultSchema = z.object({
  reason: z.literal('Attempted buy amount exceeds daily limit'),
  maxSpendingLimitInUsd: z.number(),
  buyAmountInUsd: z.number(),
});

export const SpendingLimitPolicyCommitParamsSchema = z.object({
  appId: z.number(),
  amountSpentUsd: z.number(),
  maxSpendingLimitInUsd: z.number(),
  pkpEthAddress: z.string(),
  pkpPubKey: z.string(),
});

export const SpendingLimitPolicyCommitAllowResultSchema = z.object({
  spendTxHash: z.string(),
});

export const SpendingLimitPolicyCommitDenyResultSchema = z.object({
  error: z.string(),
});

export const SpendingLimitPolicyDef = createVincentPolicy({
  packageName: '@lit-protocol/vincent-policy-spending-limit' as const,

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,
  commitParamsSchema: SpendingLimitPolicyCommitParamsSchema,

  precheckAllowResultSchema: spendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: spendingLimitPolicyPrecheckDenyResultSchema,

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  commitAllowResultSchema: SpendingLimitPolicyCommitAllowResultSchema,
  commitDenyResultSchema: SpendingLimitPolicyCommitDenyResultSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => {
    const {
      pkpEthAddress,
      appId,
      buyAmount,
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenAddress,
      tokenDecimals,
    } = toolParams;
    const { maxDailySpendAmountUsd } = userParams;

    const { buyAmountAllowed, buyAmountInUsd, adjustedMaxDailySpendingLimit } =
      await checkIfBuyAmountAllowed({
        ethRpcUrl,
        rpcUrlForUniswap,
        chainIdForUniswap,
        tokenAddress: tokenAddress as `0x${string}`,
        tokenDecimals,
        buyAmount,
        maxDailySpendAmountUsd,
        pkpEthAddress: pkpEthAddress as `0x${string}`,
        appId,
      });

    return buyAmountAllowed
      ? allow({
          appId,
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        })
      : deny({
          appId,
          reason: 'Attempted buy amount exceeds daily limit',
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        });
  },
  evaluate: async ({ toolParams, userParams }, { allow, deny }) => {
    const {
      pkpEthAddress,
      appId,
      buyAmount,
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenAddress,
      tokenDecimals,
    } = toolParams;
    const { maxDailySpendAmountUsd } = userParams;

    const checkBuyAmountResponse = await Lit.Actions.runOnce(
      { waitForResponse: true, name: 'checkBuyAmount' },
      async () => {
        try {
          const { buyAmountAllowed, buyAmountInUsd, adjustedMaxDailySpendingLimit } =
            await checkIfBuyAmountAllowed({
              ethRpcUrl,
              rpcUrlForUniswap,
              chainIdForUniswap,
              tokenAddress: tokenAddress as `0x${string}`,
              tokenDecimals,
              buyAmount,
              maxDailySpendAmountUsd,
              pkpEthAddress: pkpEthAddress as `0x${string}`,
              appId,
            });

          return JSON.stringify({
            status: 'success',
            buyAmountAllowed,
            buyAmountInUsd: buyAmountInUsd.toString(),
            adjustedMaxDailySpendingLimit: adjustedMaxDailySpendingLimit.toString(),
          });
        } catch (error) {
          return JSON.stringify({
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          });
        }
      },
    );

    const parsedCheckBuyAmountResponse = JSON.parse(checkBuyAmountResponse);
    if (parsedCheckBuyAmountResponse.status === 'error') {
      throw new Error(
        `Error checking buy amount: ${parsedCheckBuyAmountResponse.error} (evaluate)`,
      );
    }
    const { buyAmountAllowed, buyAmountInUsd, adjustedMaxDailySpendingLimit } =
      parsedCheckBuyAmountResponse;

    return buyAmountAllowed
      ? allow({
          appId,
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        })
      : deny({
          reason: 'Attempted buy amount exceeds daily limit',
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        });
  },
  commit: async (params, { allow }) => {
    const { appId, amountSpentUsd, maxSpendingLimitInUsd, pkpEthAddress, pkpPubKey } = params;

    const spendTxHash = await sendSpendTx({
      appId,
      amountSpentUsd,
      maxSpendingLimitInUsd,
      spendingLimitDuration: 86400, // number of seconds in a day
      pkpEthAddress,
      pkpPubKey,
    });

    return allow({
      spendTxHash,
    });
  },
});
