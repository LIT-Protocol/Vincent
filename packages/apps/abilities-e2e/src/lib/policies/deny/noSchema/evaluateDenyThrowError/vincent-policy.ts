import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, abilityParams } from '../../../../schemas';

/**
 * Policy that throws an error in evaluate
 * Tests throwing an error instead of calling deny() in evaluate
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/evaluateDenyThrowError',
  abilityParamsSchema: abilityParams,
  userParamsSchema: policyParams,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async () => {
    // Throw an error instead of calling deny()
    throw new Error('Intentional evaluate failure with thrown error');
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
