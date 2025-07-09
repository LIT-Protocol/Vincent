import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, toolParams } from '../../../../schemas';

/**
 * Policy that throws an error in commit
 * Tests throwing an error instead of calling deny() in commit
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/commitDenyThrowError',
  toolParamsSchema: toolParams,
  userParamsSchema: policyParams,
  commitParamsSchema: policyParams,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async () => {
    // Throw an error instead of calling deny()
    throw new Error('Intentional commit failure with thrown error');
  },
});
