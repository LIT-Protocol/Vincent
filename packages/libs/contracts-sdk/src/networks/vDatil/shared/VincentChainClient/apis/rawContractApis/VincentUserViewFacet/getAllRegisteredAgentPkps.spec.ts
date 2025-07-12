import { getTestContext } from '../testContext';
import { getAppVersion } from '../VincentAppViewFacet/getAppVersion';
import { permitAppVersion } from '../VincentUserFacet/permitAppVersion';
import { getAllRegisteredAgentPkps } from './getAllRegisteredAgentPkps';

describe('getAllRegisteredAgentPkps', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });

    // First test getAppVersion
    const appVersionRes = await getAppVersion(
      {
        appId: testContext.registerAppRes.appId,
        version: 1, // First version
      },
      testContext.networkContext,
    );

    // Then permit app version
    const permitAppVersionRes = await permitAppVersion(
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

    console.log('permitAppVersionRes', permitAppVersionRes);
  });

  it('should retrieve all registered agent PKPs for a user address', async () => {
    // Use the test wallet address which should have some PKPs registered
    const userAddress = testContext.networkContext.walletClient.account.address;

    const result = await getAllRegisteredAgentPkps(
      {
        userAddress: userAddress,
      },
      testContext.networkContext,
    );

    // Verify the structure of the response
    expect(Array.isArray(result)).toBe(true);

    // Log the result for debugging
    console.log('Registered PKP token IDs:', result);

    // We can't assert exact values as they depend on the test environment state,
    // but we can verify the returned value is an array of bigints
    if (result.length > 0) {
      result.forEach((pkpTokenId) => {
        expect(typeof pkpTokenId).toBe('bigint');
      });
    }
  });
});
