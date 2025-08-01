import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as commitDenyNoSchemaNoResult } from '../../../../generated/policies/deny/noSchema/commitDenyNoSchemaNoResult/vincent-bundled-policy';

const commitDenyNoSchemaNoResultPolicy = createVincentAbilityPolicy({
  bundledVincentPolicy: commitDenyNoSchemaNoResult,
  abilityParamsSchema: abilityParams,
  abilityParameterMappings: {
    x: 'x',
  },
});

/**
 * Ability with policy that denies during commit with no schema and no result
 * Test:
 * - ability execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `commitDenyNoSchemaNoResult` packagename string
 * - `policies.context.deniedPolicy.result` is undefined
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([commitDenyNoSchemaNoResultPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
