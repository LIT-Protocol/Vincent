import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { toolParams, FailSchema } from '../../../../schemas';

/**
 * Tool with precheck fail schema defined
 * Tests fail() with schema in precheck
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([]),
  precheckFailSchema: FailSchema,
  precheck: async (_, { fail }) => {
    return fail({ err: 'Intentional precheck failure with schema' });
  },
  execute: async (_, { succeed }) => {
    return succeed();
  },
});
