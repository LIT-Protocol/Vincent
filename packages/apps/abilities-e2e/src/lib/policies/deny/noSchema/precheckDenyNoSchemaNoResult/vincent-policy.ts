import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, abilityParams } from '../../../../schemas';

/**
 * Policy that denies in precheck without schema and no result
 * Tests deny() without schema and no result in precheck
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/precheckDenyNoSchemaNoResult',
  abilityParamsSchema: abilityParams,
  userParamsSchema: policyParams,

  // No precheckDenyResultSchema defined

  precheck: async (_, { deny }) => {
    // Call deny() without a result or error string
    return deny();
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
