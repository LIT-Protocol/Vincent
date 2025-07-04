import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { toolParams, SuccessSchema } from '../../schemas/common';

/**
 * Tool with precheck success schema defined
 * Tests succeed() with schema in precheck
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([]),
  precheckSuccessSchema: SuccessSchema,
  precheck: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
  execute: async (_, { succeed }) => {
    return succeed();
  },
});
