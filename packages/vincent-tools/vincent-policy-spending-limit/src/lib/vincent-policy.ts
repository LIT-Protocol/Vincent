import { z } from 'zod';
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

import { sendSpendTx } from './policy-helpers/send-spend-tx';
import { checkIfBuyAmountAllowed } from './check-spending-limit';

export const SpendingLimitPolicyToolParamsSchema = z.object({
  appId: z.number(),
  pkpEthAddress: z.string(),
  ethRpcUrl: z.string(),
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
  // TODO: Replace with actual CID
  ipfsCid: 'Qm-REPLACE-ME',
  packageName: '@lit-protocol/vincent-policy-spending-limit',

  toolParamsSchema: SpendingLimitPolicyToolParamsSchema,
  userParamsSchema: SpendingLimitPolicyUserParamsSchema,

  precheckAllowResultSchema: spendingLimitPolicyPrecheckAllowResultSchema,
  precheckDenyResultSchema: spendingLimitPolicyPrecheckDenyResultSchema,

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  commitParamsSchema: SpendingLimitPolicyCommitParamsSchema,
  commitAllowResultSchema: SpendingLimitPolicyCommitAllowResultSchema,
  commitDenyResultSchema: SpendingLimitPolicyCommitDenyResultSchema,

  precheck: async ({ toolParams, userParams }, { allow, deny }) => {
    const { pkpEthAddress, appId, buyAmount, ethRpcUrl, tokenAddress, tokenDecimals } = toolParams;
    const { maxDailySpendAmountUsd } = userParams;

    const { buyAmountAllowed, buyAmountInUsd, adjustedMaxDailySpendingLimit } =
      await checkIfBuyAmountAllowed({
        ethRpcUrl,
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
          reason: 'Attempted buy amount exceeds daily limit',
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        });
  },
  evaluate: async ({ toolParams, userParams }, { allow, deny }) => {
    const { pkpEthAddress, appId, buyAmount, ethRpcUrl, tokenAddress, tokenDecimals } = toolParams;
    const { maxDailySpendAmountUsd } = userParams;

    const { buyAmountAllowed, buyAmountInUsd, adjustedMaxDailySpendingLimit } =
      await checkIfBuyAmountAllowed({
        ethRpcUrl,
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
          reason: 'Attempted buy amount exceeds daily limit',
          maxSpendingLimitInUsd: Number(adjustedMaxDailySpendingLimit),
          buyAmountInUsd: Number(buyAmountInUsd),
        });
  },
  commit: async (params, context) => {
    const { appId, amountSpentUsd, maxSpendingLimitInUsd, pkpEthAddress, pkpPubKey } = params;

    const spendTxHash = await sendSpendTx({
      appId,
      amountSpentUsd,
      maxSpendingLimitInUsd,
      spendingLimitDuration: 86400, // number of seconds in a day
      pkpEthAddress,
      pkpPubKey,
    });

    return context.allow({
      spendTxHash,
    });
  },
});
