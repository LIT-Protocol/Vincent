import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as precheckDenyNoSchemaNoResult } from '../../../../generated/policies/deny/noSchema/precheckDenyNoSchemaNoResult/vincent-bundled-policy';

const precheckDenyNoSchemaNoResultPolicy = createVincentAbilityPolicy({
  bundledVincentPolicy: precheckDenyNoSchemaNoResult,
  abilityParamsSchema: abilityParams,
  abilityParameterMappings: {
    x: 'x',
  },
});

/**
 * Ability with policy that denies during precheck with no schema and no result
 * Test:
 * - ability execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `precheckDenyNoSchemaNoResult` packagename string
 * - `policies.context.deniedPolicy.result` is undefined
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([precheckDenyNoSchemaNoResultPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
