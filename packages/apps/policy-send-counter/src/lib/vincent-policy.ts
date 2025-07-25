import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

import { sendSpendTx } from './policy-helpers/send-spend-tx';
import { checkIfBuyAmountAllowed } from './policy-helpers/check-spending-limit';
import {
  commitAllowResultSchema,
  commitDenyResultSchema,
  commitParamsSchema,
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  toolParamsSchema,
  userParamsSchema,
} from './schemas';

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

export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/vincent-policy-spending-limit' as const,

  toolParamsSchema,
  userParamsSchema,
  commitParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  commitAllowResultSchema,
  commitDenyResultSchema,

  precheck: async (
    { toolParams, userParams },
    { allow, deny, appId, delegation: { delegatorPkpInfo } },
  ) => {
    console.log('Prechecking spending limit policy', { toolParams, userParams });
    const { ethAddress } = delegatorPkpInfo;
    const {
      buyAmount,
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenAddress,
      tokenDecimals,
    } = toolParams;
    const { maxDailySpendingLimitInUsdCents } = userParams;

    const { buyAmountAllowed, buyAmountInUsd, adjustedMaxDailySpendingLimit } =
      await checkIfBuyAmountAllowed({
        ethRpcUrl,
        rpcUrlForUniswap,
        chainIdForUniswap,
        tokenAddress: tokenAddress as `0x${string}`,
        tokenDecimals,
        buyAmount,
        maxDailySpendingLimitInUsdCents,
        pkpEthAddress: ethAddress as `0x${string}`,
        appId,
      });

    return buyAmountAllowed
      ? allow({
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        })
      : deny({
          reason: 'Attempted buy amount exceeds daily limit',
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        });
  },
  evaluate: async (
    { toolParams, userParams },
    { allow, deny, appId, delegation: { delegatorPkpInfo } },
  ) => {
    const { ethAddress } = delegatorPkpInfo;

    console.log('Evaluating spending limit policy', JSON.stringify(toolParams));
    const {
      buyAmount,
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap,
      tokenAddress,
      tokenDecimals,
    } = toolParams;
    const { maxDailySpendingLimitInUsdCents } = userParams;

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
              maxDailySpendingLimitInUsdCents,
              pkpEthAddress: ethAddress as `0x${string}`,
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
      return deny({
        reason: `Error checking buy amount: ${parsedCheckBuyAmountResponse.error} (evaluate)`,
      });
    }
    const { buyAmountAllowed, buyAmountInUsd, adjustedMaxDailySpendingLimit } =
      parsedCheckBuyAmountResponse;

    console.log('Evaluated spending limit policy', {
      buyAmountAllowed,
      buyAmountInUsd,
      adjustedMaxDailySpendingLimit,
    });

    return buyAmountAllowed
      ? allow({
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        })
      : deny({
          reason: 'Attempted buy amount exceeds daily limit',
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        });
  },
  commit: async (params, { allow, appId, delegation: { delegatorPkpInfo } }) => {
    const { ethAddress, publicKey } = delegatorPkpInfo;
    const { amountSpentUsd, maxSpendingLimitInUsd } = params;

    const spendTxHash = await sendSpendTx({
      appId,
      amountSpentUsd,
      maxSpendingLimitInUsd,
      spendingLimitDuration: 86400, // number of seconds in a day
      pkpEthAddress: ethAddress,
      pkpPubKey: publicKey,
    });

    return allow({
      spendTxHash,
    });
  },
});
