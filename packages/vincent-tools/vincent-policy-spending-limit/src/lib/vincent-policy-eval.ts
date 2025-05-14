import { PolicyContext } from '@lit-protocol/vincent-tool-sdk/src/lib/types';
import { z } from 'zod';

import {
  spendingLimitPolicyToolParamsSchema,
  spendingLimitPolicyUserParamsSchema,
  spendingLimitPolicyEvalAllowResultSchema,
  spendingLimitPolicyEvalDenyResultSchema,
} from './vincent-policy';
import { getSpendingLimitContractInstance } from './spending-limit-contract';
import { getTokenAmountInUsd } from './policy-helpers/get-token-amount-in-usd';

export const spendingLimitPolicyEval = async (
  {
    toolParams,
    userParams,
  }: {
    toolParams: z.infer<typeof spendingLimitPolicyToolParamsSchema>;
    userParams: z.infer<typeof spendingLimitPolicyUserParamsSchema>;
  },
  context: PolicyContext<
    typeof spendingLimitPolicyEvalAllowResultSchema,
    typeof spendingLimitPolicyEvalDenyResultSchema
  >,
) => {
  const { pkpEthAddress, appId, buyAmount, ethRpcUrl, tokenAddress, tokenDecimals } =
    spendingLimitPolicyToolParamsSchema.parse(toolParams);
  const { maxDailySpendAmountUsd } = spendingLimitPolicyUserParamsSchema.parse(userParams);

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

  try {
    const buyAmountAllowed = await spendingLimitContract.read.checkLimit([
      pkpEthAddress,
      appId,
      buyAmountInUsd,
      adjustedMaxDailySpendingLimit,
      86400n, // number of seconds in a day
    ]);
    console.log(`Buy amount allowed: ${buyAmountAllowed} (spendingLimitPolicyPrecheck)`);

    return context.allow({
      allow: true,
    });
  } catch (error) {
    return context.deny({
      allow: false,
      reason: 'Attempted buy amount exceeds daily limit',
    });
  }
};
