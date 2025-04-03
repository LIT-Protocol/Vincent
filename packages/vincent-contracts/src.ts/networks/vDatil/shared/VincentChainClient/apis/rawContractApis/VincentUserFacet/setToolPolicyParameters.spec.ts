import { getTestContext } from '../testContext';
import { createPolicyParameterValue } from '../VincentAppFacet/schemas/ParameterType';
import { getAppVersion } from '../VincentAppViewFacet/getAppVersion';
import { getAllToolsAndPoliciesForApp } from '../VincentUserViewFacet/getAllToolsAndPoliciesForApp';
import { permitAppVersion } from './permitAppVersion';
import { setToolPolicyParameters } from './setToolPolicyParameters';

describe('setToolPolicyParameters', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should set tool policy parameters for a PKP token', async () => {
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

    // Set new policy parameters
    const newParameterValues = [
      [
        [
          createPolicyParameterValue('string', 'Hello World'),
          createPolicyParameterValue('string[]', 'Hello,World'),
          createPolicyParameterValue('bytes', '0x1234'),
        ],
      ],
    ];

    const result = await setToolPolicyParameters(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: testContext.registerAppRes.appId,
        appVersion: appVersionRes[1].version,
        toolIpfsCids: testContext.TOOL_IPFS_CIDS,
        policyIpfsCids: testContext.TOOL_POLICIES,
        policyParameterNames: testContext.TOOL_POLICY_PARAMETER_NAMES,
        policyParameterValues: newParameterValues,
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log('Set tool policy parameters result:', result);

    // Verify structure of the response
    expect(result).toHaveProperty('hash');
    expect(result).toHaveProperty('receipt');
    expect(result).toHaveProperty('decodedLogs');

    console.log('APP ID:', result.decodedLogs[0].args.appId);

    // Verify the parameters were set by checking the event
    const parameterSetEvent = result.decodedLogs.find(
      (log) => log.eventName === 'ToolPolicyParameterSet',
    );
    expect(parameterSetEvent).toBeDefined();

    if (parameterSetEvent) {
      expect(parameterSetEvent.args.pkpTokenId).toBe(
        testContext.AGENT_PKP_TOKEN_IDS[0],
      );
      expect(parameterSetEvent.args.appId).toBe(
        testContext.registerAppRes.appId,
      );
      expect(parameterSetEvent.args.appVersion).toBe(appVersionRes[1].version);
    }

    // Verify the parameters using getAllToolsAndPoliciesForApp
    const toolsAndPolicies = await getAllToolsAndPoliciesForApp(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: result.decodedLogs[0].args.appId,
      },
      testContext.networkContext,
    );

    console.log(
      'Tools and policies after setting parameters:',
      JSON.stringify(toolsAndPolicies, null, 2),
    );

    // Verify the parameters were set correctly
    expect(toolsAndPolicies.length).toBeGreaterThan(0);
    expect(toolsAndPolicies[0].policies.length).toBeGreaterThan(0);
    expect(toolsAndPolicies[0].policies[0].parameters.length).toBeGreaterThan(
      0,
    );
  });
});
