import { createVincentAbility } from '@lit-protocol/vincent-ability-sdk';
import { supportedPoliciesForAbility } from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema, FailSchema } from '../../../../schemas';

/**
 * Ability with precheck success schema defined but returns invalid result
 * Tests succeed() with an invalid result that doesn't match the success schema in precheck
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability that returns an invalid success result in precheck.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([]),
  precheckSuccessSchema: SuccessSchema,
  executeFailSchema: FailSchema,
  precheck: async (_, { succeed }) => {
    // This should fail schema validation because we're returning an array
    // instead of an object with an 'ok' boolean property
    return succeed(['This', 'is', 'not', 'a', 'valid', 'success', 'result'] as any);
  },
  execute: async (_, { fail }) => {
    // This will fail with a valid result
    return fail({ err: 'Intentional failure with schema' });
  },
});
