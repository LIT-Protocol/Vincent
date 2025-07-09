import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, AllowSchema } from '../../../../schemas';

/**
 * Policy that allows in precheck with schema
 * Tests allow() with schema in precheck
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/test-policy@1.0.0',
  toolParamsSchema: policyParams,
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
