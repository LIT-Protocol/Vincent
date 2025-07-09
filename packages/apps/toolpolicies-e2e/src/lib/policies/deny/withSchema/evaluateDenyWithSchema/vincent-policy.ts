import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, DenySchema, toolParams } from '../../../../schemas';

/**
 * Policy that denies in evaluate with schema
 * Tests deny() with schema in evaluate
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/evaluateDenyWithSchema',
  toolParamsSchema: toolParams,
  userParamsSchema: policyParams,

  evalDenyResultSchema: DenySchema,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { deny }) => {
    return deny({ reason: 'Intentional evaluate denial with schema' });
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
