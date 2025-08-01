import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { supportedPoliciesForAbility } from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, FailSchema } from '../../../../schemas';

/**
 * Ability with execute fail schema defined but no precheck fail schema
 * Tests fail() without schema in precheck (with error message)
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([]),
  executeFailSchema: FailSchema,
  execute: async (_, { fail }) => {
    return fail({ err: 'Intentional failure with schema' });
  },
  precheck: async (_, { fail }) => {
    return fail('Intentional precheck failure with error message');
  },
});
