import { PolicyContext } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import {
  SpendingLimitPolicyToolParamsSchema,
  SpendingLimitPolicyUserParamsSchema,
  SpendingLimitPolicyEvalAllowResultSchema,
  SpendingLimitPolicyEvalDenyResultSchema,
} from './vincent-policy';
import { getSpendingLimitContractInstance } from './spending-limit-contract';
import { getTokenAmountInUsd } from './policy-helpers/get-token-amount-in-usd';

export const SpendingLimitPolicyEval = async (
  {
    toolParams,
    userParams,
  }: {
    toolParams: z.infer<typeof SpendingLimitPolicyToolParamsSchema>;
    userParams: z.infer<typeof SpendingLimitPolicyUserParamsSchema>;
  },
  context: PolicyContext<
    typeof SpendingLimitPolicyEvalAllowResultSchema,
    typeof SpendingLimitPolicyEvalDenyResultSchema
  >,
) => {
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
      ? context.allow({
          allow: true,
          appId,
          maxSpendingLimitInUsd: adjustedMaxDailySpendingLimit,
        })
      : context.deny({
          allow: false,
          reason: 'Attempted buy amount exceeds daily limit',
        });
  } catch (error) {
    return context.deny({
      allow: false,
      reason: 'Attempted buy amount exceeds daily limit',
    });
  }
};
