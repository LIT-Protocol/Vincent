import { PolicyContext } from '@lit-protocol/vincent-tool-sdk/src/lib/types';
import { z } from 'zod';

import {
  spendingLimitPolicyCommitParamsSchema,
  spendingLimitPolicyCommitAllowResultSchema,
  spendingLimitPolicyCommitDenyResultSchema,
} from './vincent-policy';
import { sendSpendTx } from './policy-helpers/send-spend-tx';

export const spendingLimitPolicyCommit = async (
  params: z.infer<typeof spendingLimitPolicyCommitParamsSchema>,
  context: PolicyContext<
    typeof spendingLimitPolicyCommitAllowResultSchema,
    typeof spendingLimitPolicyCommitDenyResultSchema
  >,
) => {
  try {
    const { appId, amountSpentUsd, maxSpendingLimitInUsd, pkpEthAddress, pkpPubKey } =
      spendingLimitPolicyCommitParamsSchema.parse(params);

    const spendTxHash = await sendSpendTx({
      appId,
      amountSpentUsd,
      maxSpendingLimitInUsd,
      spendingLimitDuration: 86400, // number of seconds in a day
      pkpEthAddress,
      pkpPubKey,
    });

    return context.allow({
      transactionHash: spendTxHash,
    });
  } catch (error) {
    return context.deny({
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
