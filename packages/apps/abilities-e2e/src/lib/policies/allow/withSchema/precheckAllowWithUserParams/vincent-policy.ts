import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, AllowSchema, abilityParams } from '../../../../schemas';

/**
 * Policy that allows in precheck with schema and accepts user parameters
 * Tests allow() with schema in precheck and user parameter validation
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/test-policy@1.0.0',
  abilityParamsSchema: abilityParams,
  userParamsSchema: policyParams,

  precheckAllowResultSchema: AllowSchema,

  precheck: async (_, { allow }) => {
    return allow({ ok: true });
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
