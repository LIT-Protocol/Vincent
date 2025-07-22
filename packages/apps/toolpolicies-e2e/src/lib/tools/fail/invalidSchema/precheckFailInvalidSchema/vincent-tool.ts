import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { toolParams, FailSchema, SuccessSchema } from '../../../../schemas';

/**
 * Tool with precheck fail schema defined but returns invalid result
 * Tests fail() with an invalid result that doesn't match the fail schema in precheck
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool that returns an invalid fail result in precheck.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([]),
  precheckFailSchema: FailSchema,
  executeSuccessSchema: SuccessSchema,
  precheck: async (_, { fail }) => {
    // This should fail schema validation because we're returning a boolean
    // instead of an object with an 'err' string property
    return fail(false as any);
  },
  execute: async (_, { succeed }) => {
    // This will succeed with a valid result
    return succeed({ ok: true });
  },
});
