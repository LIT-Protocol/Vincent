import { getTestContext } from '../testContext';
import { getAppVersion } from '../VincentAppViewFacet/getAppVersion';
import { permitAppVersion } from '../VincentUserFacet/permitAppVersion';
import { getAllToolsAndPoliciesForApp } from './getAllToolsAndPoliciesForApp';

describe('getAllToolsAndPoliciesForApp', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });

    // Get the app version details first
    const appVersionRes = await getAppVersion(
      {
        appId: testContext.registerAppRes.appId,
        version: 1n, // First version
      },
      testContext.networkContext,
    );

    // Permit the app version to set up the test data
    await permitAppVersion(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: testContext.registerAppRes.appId,
        appVersion: appVersionRes[1].version,
        toolIpfsCids: testContext.TOOL_IPFS_CIDS,
        policyIpfsCids: testContext.TOOL_POLICIES,
        policyParameterNames: testContext.TOOL_POLICY_PARAMETER_NAMES,
        policyParameterValues: testContext.TOOL_POLICY_PARAMETER_VALUES,
      },
      testContext.networkContext,
    );
  });

  it('should retrieve all tools and their policies for a PKP token and app', async () => {
    const result = await getAllToolsAndPoliciesForApp(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: testContext.registerAppRes.appId,
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log('Tools and policies:', JSON.stringify(result, null, 2));

    // Verify the structure of the response
    expect(Array.isArray(result)).toBe(true);
    console.log('result:', result);
    // We expect to have tools and policies as we just permitted the app version with them
    expect(result.length).toBeGreaterThan(0);

    // Verify tool structure
    const tool = result[0];
    expect(tool).toHaveProperty('toolIpfsCid');
    expect(tool).toHaveProperty('policies');

    // Check that the tool IPFS CID matches what we permitted
    expect(tool.toolIpfsCid).toBe(testContext.TOOL_IPFS_CIDS[0]);

    // Verify policy structure
    if (tool.policies.length > 0) {
      const policy = tool.policies[0];
      expect(policy).toHaveProperty('policyIpfsCid');
      expect(policy).toHaveProperty('parameters');

      // Check that the policy IPFS CID matches what we permitted
      expect(policy.policyIpfsCid).toBe(testContext.TOOL_POLICIES[0][0]);

      // Verify parameter structure if there are parameters
      if (policy.parameters.length > 0) {
        const parameter = policy.parameters[0];
        expect(parameter).toHaveProperty('name');
        expect(parameter).toHaveProperty('paramType');
        expect(parameter).toHaveProperty('value');

        // Check that the parameter name matches what we permitted
        expect(parameter.name).toBe(testContext.TOOL_POLICY_PARAMETER_NAMES[0][0][0]);
      }
    }
  });
});
