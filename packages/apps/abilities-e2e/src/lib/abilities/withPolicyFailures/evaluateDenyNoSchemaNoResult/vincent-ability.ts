import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as evaluateDenyNoSchemaNoResult } from '../../../../generated/policies/deny/noSchema/evaluateDenyNoSchemaNoResult/vincent-bundled-policy';

const evaluateDenyNoSchemaNoResultPolicy = createVincentAbilityPolicy({
  bundledVincentPolicy: evaluateDenyNoSchemaNoResult,
  abilityParamsSchema: abilityParams,
  abilityParameterMappings: {
    x: 'x',
  },
});

/**
 * Ability with policy that denies during evaluation with no schema and no result
 * Test:
 * - ability execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `evaluateDenyNoSchemaNoResult` packagename string
 * - `policies.context.deniedPolicy.result` is undefined
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([evaluateDenyNoSchemaNoResultPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
