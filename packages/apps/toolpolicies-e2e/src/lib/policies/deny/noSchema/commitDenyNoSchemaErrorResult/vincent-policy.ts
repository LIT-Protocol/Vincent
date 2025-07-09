import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, toolParams } from '../../../../schemas';

/**
 * Policy that denies in commit without schema but with error string
 * Tests deny() without schema but with error string in commit
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/commitDenyNoSchemaErrorResult',
  toolParamsSchema: toolParams,
  userParamsSchema: policyParams,
  commitParamsSchema: policyParams,

  // No commitDenyResultSchema defined

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { deny }) => {
    // Call deny() with an error string, but no schema is defined
    return deny('Intentional commit denial with error string');
  },
});
