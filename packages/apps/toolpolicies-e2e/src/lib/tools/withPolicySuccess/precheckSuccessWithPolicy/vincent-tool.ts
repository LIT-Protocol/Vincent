import {
  createVincentTool,
  createVincentToolPolicy,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { toolParams, SuccessSchema } from '../../../schemas';
import { bundledVincentPolicy as precheckAllowWithUserParams } from '../../../../generated/policies/allow/withSchema/precheckAllowWithUserParams/vincent-bundled-policy';

const precheckAllowWithUserParamsPolicy = createVincentToolPolicy({
  bundledVincentPolicy: precheckAllowWithUserParams,
  toolParamsSchema: toolParams,
  toolParameterMappings: {
    x: 'x', // Tool's x maps to policy's x (both use toolParams schema)
  },
});

/**
 * Tool with policy that allows during precheck with schema results
 * Test:
 * - tool precheck result: `success: true`
 * - `context.policiesContext.allow = true`
 * - `context.policiesContext.allowedPolicies[policyIpfsCid].result` contains the policy result
 */
export const vincentTool = createVincentTool({
  packageName: '@lit-protocol/test-tool@1.0.0',
  toolDescription: 'This is a test tool with policy that returns precheck results.',
  toolParamsSchema: toolParams,
  supportedPolicies: supportedPoliciesForTool([precheckAllowWithUserParamsPolicy]),
  precheckSuccessSchema: SuccessSchema,
  executeSuccessSchema: SuccessSchema,
  precheck: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
  execute: async (_, { succeed }) => {
    return succeed({ ok: true });
  },
});
