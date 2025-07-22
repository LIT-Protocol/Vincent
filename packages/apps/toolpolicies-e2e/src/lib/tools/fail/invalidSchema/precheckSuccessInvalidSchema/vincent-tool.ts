import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { toolParams, SuccessSchema, FailSchema } from '../../../../schemas';

/**
 * Tool with precheck success schema defined but returns invalid result
 * Tests succeed() with an invalid result that doesn't match the success schema in precheck
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool that returns an invalid success result in precheck.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([]),
  precheckSuccessSchema: SuccessSchema,
  executeFailSchema: FailSchema,
  precheck: async (_, { succeed }) => {
    // This should fail schema validation because we're returning an array
    // instead of an object with an 'ok' boolean property
    return succeed(['This', 'is', 'not', 'a', 'valid', 'success', 'result'] as any);
  },
  execute: async (_, { fail }) => {
    // This will fail with a valid result
    return fail({ err: 'Intentional failure with schema' });
  },
});
