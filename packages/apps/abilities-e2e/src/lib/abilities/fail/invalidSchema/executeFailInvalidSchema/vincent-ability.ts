import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { supportedPoliciesForAbility } from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, FailSchema } from '../../../../schemas';

/**
 * Ability with execute fail schema defined but returns invalid result
 * Tests fail() with an invalid result that doesn't match the fail schema
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability that returns an invalid fail result.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([]),
  executeFailSchema: FailSchema,
  execute: async (_, { fail }) => {
    // This should fail schema validation because we're returning a number
    // instead of an object with an 'err' string property
    return fail(42 as any);
  },
});
