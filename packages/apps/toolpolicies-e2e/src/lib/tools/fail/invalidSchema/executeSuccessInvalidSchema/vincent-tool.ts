import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { toolParams, SuccessSchema } from '../../../../schemas';

/**
 * Tool with execute success schema defined but returns invalid result
 * Tests succeed() with an invalid result that doesn't match the success schema
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool that returns an invalid success result.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    // This should fail schema validation because we're returning a string
    // instead of an object with an 'ok' boolean property
    return succeed('This is not a valid success result' as any);
  },
});
