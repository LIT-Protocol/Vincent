import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, DenySchema, abilityParams } from '../../../../schemas';

/**
 * Policy that denies in evaluate with schema
 * Tests deny() with schema in evaluate
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/evaluateDenyWithSchema',
  abilityParamsSchema: abilityParams,
  userParamsSchema: policyParams,

  evalDenyResultSchema: DenySchema,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { deny }) => {
    return deny({ reason: 'Intentional evaluate denial with schema' });
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
