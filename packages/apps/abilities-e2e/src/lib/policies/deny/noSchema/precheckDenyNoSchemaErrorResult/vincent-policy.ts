import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, abilityParams } from '../../../../schemas';

/**
 * Policy that denies in precheck without schema but with error string
 * Tests deny() without schema but with error string in precheck
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/precheckDenyNoSchemaErrorResult',
  abilityParamsSchema: abilityParams,
  userParamsSchema: policyParams,

  // No precheckDenyResultSchema defined

  precheck: async (_, { deny }) => {
    // Call deny() with an error string, but no schema is defined
    return deny('Intentional precheck denial with error string');
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
