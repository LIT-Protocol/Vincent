import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as evaluateDenyThrowError } from '../../../../generated/policies/deny/noSchema/evaluateDenyThrowError/vincent-bundled-policy';

const evaluateDenyThrowErrorPolicy = createVincentAbilityPolicy({
  bundledVincentPolicy: evaluateDenyThrowError,
  abilityParamsSchema: abilityParams,
  abilityParameterMappings: {
    x: 'x',
  },
});

/**
 * Ability with policy that throws an error during evaluation
 * Test:
 * - ability execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `evaluateDenyThrowError` packagename string
 * - `policies.context.deniedPolicy.result.error` matches the thrown error string
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([evaluateDenyThrowErrorPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
