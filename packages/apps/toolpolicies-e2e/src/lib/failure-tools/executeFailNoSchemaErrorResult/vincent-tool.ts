import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { toolParams } from '../../schemas/common';

/**
 * Tool with no execute fail schema defined
 * Tests fail() without schema in execute (with error message)
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([]),
  execute: async (_, { fail }) => {
    return fail('Intentional execute failure with error message');
  },
});
