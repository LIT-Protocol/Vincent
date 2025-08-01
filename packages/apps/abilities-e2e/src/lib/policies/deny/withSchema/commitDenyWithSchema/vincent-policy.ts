import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, DenySchema, abilityParams } from '../../../../schemas';

/**
 * Policy that denies in commit with schema
 * Tests deny() with schema in commit
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/commitDenyWithSchema',
  abilityParamsSchema: abilityParams,
  userParamsSchema: policyParams,
  commitParamsSchema: policyParams,

  commitDenyResultSchema: DenySchema,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { deny }) => {
    return deny({ reason: 'Intentional commit denial with schema' });
  },
});
