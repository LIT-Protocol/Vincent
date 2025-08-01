import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams } from '../../../../schemas';

/**
 * Policy that allows in commit without schema
 * Tests allow() without schema in commit
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/test-policy@1.0.0',
  abilityParamsSchema: policyParams,
  commitParamsSchema: policyParams,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
