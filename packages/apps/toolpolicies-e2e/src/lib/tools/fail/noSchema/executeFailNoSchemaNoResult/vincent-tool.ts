import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { toolParams } from '../../../../schemas';

/**
 * Tool with no execute fail schema defined
 * Tests fail() without schema in execute (no result)
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([]),
  execute: async (_, { fail }) => {
    return fail();
  },
});
