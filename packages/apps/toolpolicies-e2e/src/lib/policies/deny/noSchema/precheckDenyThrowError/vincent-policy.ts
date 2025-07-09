import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, toolParams } from '../../../../schemas';

/**
 * Policy that throws an error in precheck
 * Tests throwing an error instead of calling deny() in precheck
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/precheckDenyThrowError',
  toolParamsSchema: toolParams,
  userParamsSchema: policyParams,

  precheck: async () => {
    // Throw an error instead of calling deny()
    throw new Error('Intentional precheck failure with thrown error');
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
