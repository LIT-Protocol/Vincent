import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, toolParams } from '../../../../schemas';

/**
 * Policy that denies in commit with no schema and no result
 * Tests deny() with no schema defined and no result provided in commit
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/commitDenyNoSchemaNoResult',
  toolParamsSchema: toolParams,
  userParamsSchema: policyParams,
  commitParamsSchema: policyParams,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { deny }) => {
    // Call deny() without a result or error message
    return deny();
  },
});
