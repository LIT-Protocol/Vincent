import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { toolParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as commitDenyNoSchemaNoResult } from '../../../../generated/policies/deny/noSchema/commitDenyNoSchemaNoResult/vincent-bundled-policy';

const commitDenyNoSchemaNoResultPolicy = createVincentToolPolicy({
  bundledVincentPolicy: commitDenyNoSchemaNoResult,
  toolParamsSchema: toolParams,
  toolParameterMappings: {
    x: 'x',
  },
});

/**
 * Tool with policy that denies during commit with no schema and no result
 * Test:
 * - tool execution result: `success: false`, SHOULD NOT SUCCEED!
 * - `context.policiesContext.allow = false`
 * - `policies.context.deniedPolicy.packageName` `commitDenyNoSchemaNoResult` packagename string
 * - `policies.context.deniedPolicy.result` is undefined
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([commitDenyNoSchemaNoResultPolicy]),
  executeSuccessSchema: SuccessSchema,
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
