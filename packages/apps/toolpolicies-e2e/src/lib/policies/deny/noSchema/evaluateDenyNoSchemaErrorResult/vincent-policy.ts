import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, toolParams } from '../../../../schemas';

/**
 * Policy that denies in evaluate without schema but with error string
 * Tests deny() without schema but with error string in evaluate
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/evaluateDenyNoSchemaErrorResult',
  toolParamsSchema: toolParams,
  userParamsSchema: policyParams,

  // No evaluateDenyResultSchema defined

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { deny }) => {
    // Call deny() with an error string, but no schema is defined
    return deny('Intentional evaluate denial with error string');
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
