import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { supportedPoliciesForAbility } from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, FailSchema, SuccessSchema } from '../../../../schemas';

/**
 * Ability with precheck fail schema defined but returns invalid result
 * Tests fail() with an invalid result that doesn't match the fail schema in precheck
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability that returns an invalid fail result in precheck.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([]),
  precheckFailSchema: FailSchema,
  executeSuccessSchema: SuccessSchema,
  precheck: async (_, { fail }) => {
    // This should fail schema validation because we're returning a boolean
    // instead of an object with an 'err' string property
    return fail(false as any);
  },
  execute: async (_, { succeed }) => {
    // This will succeed with a valid result
    return succeed({ ok: true });
  },
});
