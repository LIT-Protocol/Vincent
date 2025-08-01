import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, AllowSchema } from '../../../../schemas';

/**
 * Policy that allows in evaluate with schema
 * Tests allow() with schema in evaluate
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/test-policy@1.0.0',
  abilityParamsSchema: policyParams,
  evalAllowResultSchema: AllowSchema,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { allow }) => {
    return allow({ ok: true });
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
