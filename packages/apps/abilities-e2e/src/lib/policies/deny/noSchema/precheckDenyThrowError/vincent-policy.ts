import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, abilityParams } from '../../../../schemas';

/**
 * Policy that throws an error in precheck
 * Tests throwing an error instead of calling deny() in precheck
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/precheckDenyThrowError',
  abilityParamsSchema: abilityParams,
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
