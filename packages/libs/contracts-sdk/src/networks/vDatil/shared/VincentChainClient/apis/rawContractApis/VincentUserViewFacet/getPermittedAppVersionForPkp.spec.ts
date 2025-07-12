import { getTestContext } from '../testContext';
import { getAppVersion } from '../VincentAppViewFacet/getAppVersion';
import { permitAppVersion } from '../VincentUserFacet/permitAppVersion';
import { getPermittedAppVersionForPkp } from './getPermittedAppVersionForPkp';

describe('getPermittedAppVersionForPkp', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;
  let appVersionNumber: bigint;

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

    appVersionNumber = appVersionRes[1].version;

    // Permit the app version to set up the test data
    await permitAppVersion(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: testContext.registerAppRes.appId,
        appVersion: appVersionNumber,
        toolIpfsCids: testContext.TOOL_IPFS_CIDS,
        policyIpfsCids: testContext.TOOL_POLICIES,
        policyParameterNames: testContext.TOOL_POLICY_PARAMETER_NAMES,
        policyParameterValues: testContext.TOOL_POLICY_PARAMETER_VALUES,
      },
      testContext.networkContext,
    );
  });

  it('should retrieve the permitted app version for a PKP token and app', async () => {
    const result = await getPermittedAppVersionForPkp(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: testContext.registerAppRes.appId,
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log('Permitted app version:', result);

    // Verify the result
    expect(typeof result).toBe('bigint');

    // The permitted version should match what we set up in beforeAll
    expect(result).toBe(appVersionNumber);
  });
});
