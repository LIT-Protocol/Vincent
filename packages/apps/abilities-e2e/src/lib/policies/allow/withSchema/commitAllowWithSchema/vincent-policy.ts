import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { policyParams, AllowSchema } from '../../../../schemas';

/**
 * Policy that allows in commit with schema
 * Tests allow() with schema in commit
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/test-policy@1.0.0',
  abilityParamsSchema: policyParams,
  commitAllowResultSchema: AllowSchema,
  commitParamsSchema: policyParams,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { allow }) => {
    return allow({ ok: true });
  },
});
