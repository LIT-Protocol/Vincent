import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { supportedPoliciesForAbility } from '@lit-protocol/vincent-ability-sdk';
import { abilityParams } from '../../../../schemas';

/**
 * Ability with no execute fail schema defined
 * Tests fail() without schema in execute (with error message)
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([]),
  execute: async (_, { fail }) => {
    return fail('Intentional execute failure with error message');
  },
});
