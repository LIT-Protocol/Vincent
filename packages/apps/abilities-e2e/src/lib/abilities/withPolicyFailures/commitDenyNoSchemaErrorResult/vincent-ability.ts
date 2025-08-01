import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as commitDenyNoSchemaErrorResult } from '../../../../generated/policies/deny/noSchema/commitDenyNoSchemaErrorResult/vincent-bundled-policy';

const commitDenyNoSchemaErrorResultPolicy = createVincentAbilityPolicy({
  bundledVincentPolicy: commitDenyNoSchemaErrorResult,
  abilityParamsSchema: abilityParams,
  abilityParameterMappings: {
    x: 'x',
  },
});

/**
 * Ability with policy that denies during commit with no schema and error result
 * Test:
 * - ability execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `commitDenyNoSchemaErrorResult` packagename string
 * - `policies.context.deniedPolicy.result.error` matches the error string
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([commitDenyNoSchemaErrorResultPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
