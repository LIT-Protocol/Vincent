import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { toolParams, FailSchema } from '../../../../schemas';

/**
 * Tool with execute fail schema defined but returns invalid result
 * Tests fail() with an invalid result that doesn't match the fail schema
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool that returns an invalid fail result.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([]),
  executeFailSchema: FailSchema,
  execute: async (_, { fail }) => {
    // This should fail schema validation because we're returning a number
    // instead of an object with an 'err' string property
    return fail(42 as any);
  },
});
