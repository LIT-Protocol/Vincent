import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { toolParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as evaluateDenyWithSchema } from '../../../../generated/policies/deny/withSchema/evaluateDenyWithSchema/vincent-bundled-policy';

const evaluateDenyWithSchemaPolicy = createVincentToolPolicy({
  bundledVincentPolicy: evaluateDenyWithSchema,
  toolParamsSchema: toolParams,
  toolParameterMappings: {
    x: 'x',
  },
});

/**
 * Tool with policy that denies during evaluation with schema
 * Test:
 * - tool execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `evaluateDenyWithSchema` packagename string
 * - `policies.context.deniedPolicy.result.reason` matches the reason string
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([evaluateDenyWithSchemaPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
