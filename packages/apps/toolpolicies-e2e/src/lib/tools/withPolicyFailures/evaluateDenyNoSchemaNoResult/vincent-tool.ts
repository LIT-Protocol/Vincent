import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { toolParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as evaluateDenyNoSchemaNoResult } from '../../../../generated/policies/deny/noSchema/evaluateDenyNoSchemaNoResult/vincent-bundled-policy';

const evaluateDenyNoSchemaNoResultPolicy = createVincentToolPolicy({
  bundledVincentPolicy: evaluateDenyNoSchemaNoResult,
  toolParamsSchema: toolParams,
  toolParameterMappings: {
    x: 'x',
  },
});

/**
 * Tool with policy that denies during evaluation with no schema and no result
 * Test:
 * - tool execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `evaluateDenyNoSchemaNoResult` packagename string
 * - `policies.context.deniedPolicy.result` is undefined
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([evaluateDenyNoSchemaNoResultPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
