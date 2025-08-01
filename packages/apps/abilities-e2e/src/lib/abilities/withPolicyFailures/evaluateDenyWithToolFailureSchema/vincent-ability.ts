import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema, FailSchema } from '../../../schemas';
import { bundledVincentPolicy as evaluateDenyWithSchema } from '../../../../generated/policies/deny/withSchema/evaluateDenyWithSchema/vincent-bundled-policy';

const evaluateDenyWithSchemaPolicy = createVincentAbilityPolicy({
  bundledVincentPolicy: evaluateDenyWithSchema,
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
  supportedPolicies: supportedPoliciesForAbility([evaluateDenyWithSchemaPolicy]),
  executeSuccessSchema: SuccessSchema,
  executeFailSchema: FailSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
