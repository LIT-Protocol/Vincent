import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { supportedPoliciesForAbility } from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, FailSchema } from '../../../../schemas';

/**
 * Ability with precheck fail schema defined
 * Tests fail() with schema in precheck
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([]),
  precheckFailSchema: FailSchema,
  precheck: async (_, { fail }) => {
    return fail({ err: 'Intentional precheck failure with schema' });
  },
  execute: async (_, { succeed }) => {
    return succeed();
  },
});
