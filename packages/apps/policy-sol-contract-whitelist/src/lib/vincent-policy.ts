import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';

import {
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  abilityParamsSchema,
  userParamsSchema,
} from './schemas';
import { checkWhitelist } from './lit-action-helpers';

export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/vincent-policy-sol-contract-whitelist' as const,

  abilityParamsSchema,
  userParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  precheck: async ({ abilityParams, userParams }, { allow, deny }) => {
    const { serializedTransaction } = abilityParams;
    const { whitelist } = userParams;

    const result = checkWhitelist(serializedTransaction, whitelist);

    if (!result.ok) {
      return deny({
        reason: result.reason,
        programIds: result.programIds,
      });
    }

    return allow({
      programIds: result.programIds,
      version: result.version,
    });
  },

  evaluate: async ({ abilityParams, userParams }, { allow, deny }) => {
    const { serializedTransaction } = abilityParams;
    const { whitelist } = userParams;

    const result = checkWhitelist(serializedTransaction, whitelist);

    if (!result.ok) {
      return deny({
        reason: result.reason,
        programIds: result.programIds,
      });
    }

    return allow({
      programIds: result.programIds,
      version: result.version,
    });
  },
});
