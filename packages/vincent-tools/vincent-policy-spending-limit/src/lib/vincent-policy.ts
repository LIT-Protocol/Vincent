import { z } from 'zod';
import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';

import { sendSpendTx } from './policy-helpers/send-spend-tx';
import { getTokenAmountInUsd } from './policy-helpers/get-token-amount-in-usd';
import { getSpendingLimitContractInstance } from './spending-limit-contract';

export const SpendingLimitPolicyToolParamsSchema = z.object({
  appId: z.number(),
  pkpEthAddress: z.string(),
  ethRpcUrl: z.string(),
  tokenAddress: z.string(),
  tokenDecimals: z.number(),
  buyAmount: z.bigint(),
});

export const SpendingLimitPolicyUserParamsSchema = z.object({
  maxDailySpendAmountUsd: z.bigint(),
});

export const SpendingLimitPolicyEvalAllowResultSchema = z.object({
  appId: z.number(),
  maxSpendingLimitInUsd: z.bigint(),
});

export const SpendingLimitPolicyEvalDenyResultSchema = z.object({
  reason: z.literal('Attempted buy amount exceeds daily limit'),
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

  evalAllowResultSchema: SpendingLimitPolicyEvalAllowResultSchema,
  evalDenyResultSchema: SpendingLimitPolicyEvalDenyResultSchema,

  commitParamsSchema: SpendingLimitPolicyCommitParamsSchema,
  commitAllowResultSchema: SpendingLimitPolicyCommitAllowResultSchema,
  commitDenyResultSchema: SpendingLimitPolicyCommitDenyResultSchema,

  evaluate: async ({ toolParams, userParams }, { allow, deny }) => {
    try {
      const { pkpEthAddress, appId, buyAmount, ethRpcUrl, tokenAddress, tokenDecimals } =
        SpendingLimitPolicyToolParamsSchema.parse(toolParams);
      const { maxDailySpendAmountUsd } = SpendingLimitPolicyUserParamsSchema.parse(userParams);

      const buyAmountInUsd = await getTokenAmountInUsd({
        ethRpcUrl,
        tokenAddress,
        tokenDecimals,
        tokenAmount: buyAmount,
      });

      // maxDailySpendingLimitInUsdCents has 2 decimal precision, but tokenAmountInUsd has 8,
      // so we multiply by 10^6 to match the precision
      const adjustedMaxDailySpendingLimit = maxDailySpendAmountUsd * 1_000_000n;
      console.log(
        `Adjusted maxDailySpendingLimitInUsdCents to 8 decimal precision: ${adjustedMaxDailySpendingLimit.toString()} (spendingLimitPolicyPrecheck)`,
      );

      const spendingLimitContract = getSpendingLimitContractInstance();
      const buyAmountAllowed = await spendingLimitContract.read.checkLimit([
        pkpEthAddress,
        appId,
        buyAmountInUsd,
        adjustedMaxDailySpendingLimit,
        86400n, // number of seconds in a day
      ]);
      console.log(`Buy amount allowed: ${buyAmountAllowed} (spendingLimitPolicyPrecheck)`);

      return buyAmountAllowed
        ? allow({
            appId,
            maxSpendingLimitInUsd: adjustedMaxDailySpendingLimit,
          })
        : deny({
            reason: 'Attempted buy amount exceeds daily limit',
          });
    } catch (error) {
      return deny({
        reason: 'Attempted buy amount exceeds daily limit',
      });
    }
  },
  commit: async (params, context) => {
    try {
      const { appId, amountSpentUsd, maxSpendingLimitInUsd, pkpEthAddress, pkpPubKey } =
        SpendingLimitPolicyCommitParamsSchema.parse(params);

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
    } catch (error) {
      return context.deny({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
});
