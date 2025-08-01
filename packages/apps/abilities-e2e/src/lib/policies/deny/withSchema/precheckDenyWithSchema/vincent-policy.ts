import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, DenySchema, abilityParams } from '../../../../schemas';

/**
 * Policy that denies in precheck with schema
 * Tests deny() with schema in precheck
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/precheckDenyWithSchema',
  abilityParamsSchema: abilityParams,
  userParamsSchema: policyParams,

  precheckDenyResultSchema: DenySchema,

  precheck: async (_, { deny }) => {
    return deny({ reason: 'Intentional precheck denial with schema' });
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
