import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as commitDenyWithSchema } from '../../../../generated/policies/deny/withSchema/commitDenyWithSchema/vincent-bundled-policy';

const commitDenyWithSchemaPolicy = createVincentAbilityPolicy({
  bundledVincentPolicy: commitDenyWithSchema,
  abilityParamsSchema: abilityParams,
  abilityParameterMappings: {
    x: 'x',
  },
});

/**
 * Ability with policy that denies during commit with schema
 * Test:
 * - ability execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `commitDenyWithSchema` packagename string
 * - `policies.context.deniedPolicy.result.reason` matches the reason string
 */
export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([commitDenyWithSchemaPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
