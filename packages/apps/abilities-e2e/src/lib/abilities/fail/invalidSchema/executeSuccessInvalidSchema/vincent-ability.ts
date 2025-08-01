import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { supportedPoliciesForAbility } from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema } from '../../../../schemas';

/**
 * Ability with execute success schema defined but returns invalid result
 * Tests succeed() with an invalid result that doesn't match the success schema
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability that returns an invalid success result.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    // This should fail schema validation because we're returning a string
    // instead of an object with an 'ok' boolean property
    return succeed('This is not a valid success result' as any);
  },
});
