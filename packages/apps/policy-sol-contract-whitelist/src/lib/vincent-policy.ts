import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';

import {
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  abilityParamsSchema,
  userParamsSchema,
} from './schemas';
import {
  checkWhitelist,
  deserializeTransaction,
  verifyBlockhashForCluster,
} from './lit-action-helpers';

export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/vincent-policy-sol-contract-whitelist' as const,

  abilityParamsSchema,
  userParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  precheck: async ({ abilityParams, userParams }, { allow, deny }) => {
    const { serializedTransaction, cluster } = abilityParams;
    const { whitelist } = userParams;

    const transaction = deserializeTransaction(serializedTransaction);

    // Verify blockhash matches the specified cluster
    const verification = await verifyBlockhashForCluster(transaction, cluster);
    if (!verification.valid) {
      return deny({
        reason: verification.error,
      });
    }

    const result = checkWhitelist({ cluster, transaction, whitelist });

    if (!result.ok) {
      return deny({
        reason: result.reason,
        nonWhitelistedProgramIds: result.nonWhitelistedProgramIds,
      });
    }

    return allow({
      whitelistedProgramIds: result.whitelistedProgramIds,
    });
  },

  evaluate: async ({ abilityParams, userParams }, { allow, deny }) => {
    const { serializedTransaction, cluster } = abilityParams;
    const { whitelist } = userParams;

    const transaction = deserializeTransaction(serializedTransaction);

    // Verify blockhash matches the specified cluster
    const verification = await verifyBlockhashForCluster(transaction, cluster);
    if (!verification.valid) {
      return deny({
        reason: verification.error,
      });
    }

    const result = checkWhitelist({ cluster, transaction, whitelist });

    if (!result.ok) {
      return deny({
        reason: result.reason,
        nonWhitelistedProgramIds: result.nonWhitelistedProgramIds,
      });
    }

    return allow({
      whitelistedProgramIds: result.whitelistedProgramIds,
    });
  },
});
