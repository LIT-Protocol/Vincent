import { getTestContext } from '../testContext';
import { permitAppVersion } from './permitAppVersion';
import { setToolPolicyParameters } from './setToolPolicyParameters';
import { removeToolPolicyParameters } from './removeToolPolicyParameters';
import { getAppVersion } from '../VincentAppViewFacet/getAppVersion';
import { getAllToolsAndPoliciesForApp } from '../VincentUserViewFacet/getAllToolsAndPoliciesForApp';

describe('removeToolPolicyParameters', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should remove tool policy parameters for a PKP token', async () => {
    // Get the app version details first
    const appVersionRes = await getAppVersion(
      {
        appId: testContext.registerAppRes.appId,
        version: 1n, // First version
      },
      testContext.networkContext,
    );

    // First permit the app version
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

    // Set policy parameters first
    await setToolPolicyParameters(
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

    // Verify parameters were set by checking tools and policies
    const toolsAndPoliciesBefore = await getAllToolsAndPoliciesForApp(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: testContext.registerAppRes.appId,
      },
      testContext.networkContext,
    );

    console.log(
      'Tools and policies before removal:',
      JSON.stringify(toolsAndPoliciesBefore, null, 2),
    );

    // Ensure we have parameters to remove
    expect(toolsAndPoliciesBefore.length).toBeGreaterThan(0);
    expect(toolsAndPoliciesBefore[0].policies.length).toBeGreaterThan(0);
    expect(toolsAndPoliciesBefore[0].policies[0].parameters.length).toBeGreaterThan(0);

    // Now remove the policy parameters
    const result = await removeToolPolicyParameters(
      {
        appId: testContext.registerAppRes.appId,
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appVersion: appVersionRes[1].version,
        toolIpfsCids: testContext.TOOL_IPFS_CIDS,
        policyIpfsCids: testContext.TOOL_POLICIES,
        policyParameterNames: testContext.TOOL_POLICY_PARAMETER_NAMES,
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log('Remove tool policy parameters result:', result);

    // Verify structure of the response
    expect(result).toHaveProperty('hash');
    expect(result).toHaveProperty('receipt');
    expect(result).toHaveProperty('decodedLogs');

    // Verify the parameters were removed by checking the event
    const parameterRemovedEvent = result.decodedLogs.find(
      (log) => log.eventName === 'ToolPolicyParameterRemoved',
    );
    expect(parameterRemovedEvent).toBeDefined();

    if (parameterRemovedEvent) {
      expect(parameterRemovedEvent.args.pkpTokenId).toBe(testContext.AGENT_PKP_TOKEN_IDS[0]);
      expect(parameterRemovedEvent.args.appId).toBe(testContext.registerAppRes.appId);
      expect(parameterRemovedEvent.args.appVersion).toBe(appVersionRes[1].version);
    }

    // Verify the parameters were removed using getAllToolsAndPoliciesForApp
    const toolsAndPoliciesAfter = await getAllToolsAndPoliciesForApp(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: testContext.registerAppRes.appId,
      },
      testContext.networkContext,
    );

    console.log(
      'Tools and policies after removal:',
      JSON.stringify(toolsAndPoliciesAfter, null, 2),
    );

    // We expect either no tools or no policies after removal
    if (toolsAndPoliciesAfter.length > 0) {
      expect(toolsAndPoliciesAfter[0].policies.length).toBe(0);
    }
  });
});
