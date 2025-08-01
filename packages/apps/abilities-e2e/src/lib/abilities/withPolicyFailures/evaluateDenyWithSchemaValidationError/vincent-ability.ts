import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as evaluateDenyWithSchemaValidationError } from '../../../../generated/policies/deny/withSchema/evaluateDenyWithSchemaValidationError/vincent-bundled-policy';

const evaluateDenyWithSchemaValidationErrorPolicy = createVincentAbilityPolicy({
  bundledVincentPolicy: evaluateDenyWithSchemaValidationError,
  abilityParamsSchema: abilityParams,
  abilityParameterMappings: {
    x: 'x',
  },
});

/**
 * Ability with policy that denies during evaluation with schema
 * Test:
 * - ability execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `evaluateDenyWithSchema` packagename string
 * - `policies.context.deniedPolicy.result.reason` matches the reason string
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([evaluateDenyWithSchemaValidationErrorPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
