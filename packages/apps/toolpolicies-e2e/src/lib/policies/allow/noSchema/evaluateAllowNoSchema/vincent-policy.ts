import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams } from '../../../../schemas';

/**
 * Policy that allows in evaluate without schema
 * Tests allow() without schema in evaluate
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/test-policy@1.0.0',
  toolParamsSchema: policyParams,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { allow }) => {
    return allow();
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
