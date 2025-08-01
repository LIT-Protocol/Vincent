import {
  createVincentAbility,
  createVincentAbilityPolicy,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { abilityParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as precheckAllowWithUserParams } from '../../../../generated/policies/allow/withSchema/precheckAllowWithUserParams/vincent-bundled-policy';

const precheckAllowWithUserParamsPolicy = createVincentAbilityPolicy({
  bundledVincentPolicy: precheckAllowWithUserParams,
  abilityParamsSchema: abilityParams,
  abilityParameterMappings: {
    x: 'x',
  },
});

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/test-ability@1.0.0',
  abilityDescription: 'This is a test ability with policy that returns precheck results.',
  abilityParamsSchema: abilityParams,
  supportedPolicies: supportedPoliciesForAbility([precheckAllowWithUserParamsPolicy]),
  precheckSuccessSchema: SuccessSchema,
  executeSuccessSchema: SuccessSchema,
  precheck: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
