import { createVincentTool } from '@lit-protocol/vincent-tool-sdk';
import { supportedPoliciesForTool } from '@lit-protocol/vincent-tool-sdk';
import { toolParams } from '../../schemas/common';

/**
 * Tool with no execute fail schema defined
 * Tests throw new Error() in execute
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([]),
  execute: async () => {
    throw new Error('Intentional execute failure with thrown error');
  },
});
