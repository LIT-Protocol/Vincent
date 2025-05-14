import { PolicyContext } from '@lit-protocol/vincent-tool-sdk/src/lib/types';
import { z } from 'zod';

import {
  spendingLimitPolicyToolParamsSchema,
  spendingLimitPolicyUserParamsSchema,
} from './vincent-policy';
import { getSpendingLimitContractInstance } from './spending-limit-contract';

export const spendingLimitPolicyPrecheck = async (
  {
    toolParams,
    userParams,
  }: {
    toolParams: z.infer<typeof spendingLimitPolicyToolParamsSchema>;
    userParams: z.infer<typeof spendingLimitPolicyUserParamsSchema>;
  },
  context: PolicyContext,
) => {
  const { pkpEthAddress, appId, buyAmount } = spendingLimitPolicyToolParamsSchema.parse(toolParams);

  const { maxDailySpendAmountUsd } = spendingLimitPolicyUserParamsSchema.parse(userParams);

  const spendingLimitContract = getSpendingLimitContractInstance();

  try {
    await spendingLimitContract.read.checkLimit([
      pkpEthAddress,
      appId,
      buyAmount,
      maxDailySpendAmountUsd,
    ]);
  } catch (error) {
    console.error('Error in spending limit precheck:', error);
    throw error;
  }
};
