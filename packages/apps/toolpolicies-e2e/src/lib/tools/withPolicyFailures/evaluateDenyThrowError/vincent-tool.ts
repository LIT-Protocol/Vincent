import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { toolParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as evaluateDenyThrowError } from '../../../../generated/policies/deny/noSchema/evaluateDenyThrowError/vincent-bundled-policy';

const evaluateDenyThrowErrorPolicy = createVincentToolPolicy({
  bundledVincentPolicy: evaluateDenyThrowError,
  toolParamsSchema: toolParams,
  toolParameterMappings: {
    x: 'x',
  },
});

/**
 * Tool with policy that throws an error during evaluation
 * Test:
 * - tool execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `evaluateDenyThrowError` packagename string
 * - `policies.context.deniedPolicy.result.error` matches the thrown error string
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([evaluateDenyThrowErrorPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
