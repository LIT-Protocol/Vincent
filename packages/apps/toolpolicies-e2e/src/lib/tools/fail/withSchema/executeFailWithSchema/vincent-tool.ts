import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { toolParams, FailSchema } from '../../../../schemas';

/**
 * Tool with execute fail schema defined
 * Tests fail() with schema in execute
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([]),
  executeFailSchema: FailSchema,
  execute: async (_, { fail }) => {
    return fail({ err: 'Intentional failure with schema' });
  },
});
