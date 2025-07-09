import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { toolParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as commitDenyNoSchemaErrorResult } from '../../../../generated/policies/deny/noSchema/commitDenyNoSchemaErrorResult/vincent-bundled-policy';

const commitDenyNoSchemaErrorResultPolicy = createVincentToolPolicy({
  bundledVincentPolicy: commitDenyNoSchemaErrorResult,
  toolParamsSchema: toolParams,
  toolParameterMappings: {
    x: 'x',
  },
});

/**
 * Tool with policy that denies during commit with no schema and error result
 * Test:
 * - tool execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `commitDenyNoSchemaErrorResult` packagename string
 * - `policies.context.deniedPolicy.result.error` matches the error string
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([commitDenyNoSchemaErrorResultPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
