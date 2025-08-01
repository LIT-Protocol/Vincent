import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, abilityParams } from '../../../../schemas';

/**
 * Policy that denies in evaluate with no schema and no result
 * Tests deny() with no schema defined and no result provided in evaluate
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/evaluateDenyNoSchemaNoResult',
  abilityParamsSchema: abilityParams,
  userParamsSchema: policyParams,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { deny }) => {
    // Call deny() without a result or error message
    return deny();
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
