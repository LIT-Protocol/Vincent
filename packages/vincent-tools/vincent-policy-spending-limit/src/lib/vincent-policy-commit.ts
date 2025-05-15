import { PolicyContext } from '@lit-protocol/vincent-tool-sdk';
import { z } from 'zod';

import {
  SpendingLimitPolicyCommitParamsSchema,
  SpendingLimitPolicyCommitAllowResultSchema,
  SpendingLimitPolicyCommitDenyResultSchema,
} from './vincent-policy';
import { sendSpendTx } from './policy-helpers/send-spend-tx';

export const SpendingLimitPolicyCommit = async (
  params: z.infer<typeof SpendingLimitPolicyCommitParamsSchema>,
  context: PolicyContext<
    typeof SpendingLimitPolicyCommitAllowResultSchema,
    typeof SpendingLimitPolicyCommitDenyResultSchema
  >,
) => {
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
};
