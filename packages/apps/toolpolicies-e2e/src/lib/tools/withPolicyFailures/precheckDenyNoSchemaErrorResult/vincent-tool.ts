import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { toolParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as precheckDenyNoSchemaErrorResult } from '../../../../generated/policies/deny/noSchema/precheckDenyNoSchemaErrorResult/vincent-bundled-policy';

const precheckDenyNoSchemaErrorResultPolicy = createVincentToolPolicy({
  bundledVincentPolicy: precheckDenyNoSchemaErrorResult,
  toolParamsSchema: toolParams,
  toolParameterMappings: {
    x: 'x',
  },
});

/**
 * Tool with policy that denies during precheck with no schema and error result
 * Test:
 * - tool execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `precheckDenyNoSchemaErrorResult` packagename string
 * - `policies.context.deniedPolicy.result.error` matches the error string
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([precheckDenyNoSchemaErrorResultPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
