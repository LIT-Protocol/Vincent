import { createVincentPolicy } from '@lit-protocol/vincent-tool-sdk';
import { policyParams, DenySchema, toolParams } from '../../../../schemas';

/**
 * Policy that denies in evaluate with schema
 * Tests deny() with schema in evaluate
 */
export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/evaluateDenyWithSchemaValidationError',
  toolParamsSchema: toolParams,
  userParamsSchema: policyParams,

  evalDenyResultSchema: DenySchema,

  precheck: async (_, { allow }) => {
    return allow();
  },

  evaluate: async (_, { deny }) => {
    // @ts-expect-error this is used specifically to test that the `deniedPolicy` is properly set to have the `schemaValidationError
    return deny({ intentionallyInvalid: 'Intentional evaluate denial with schema' });
  },

  commit: async (_, { allow }) => {
    return allow();
  },
});
