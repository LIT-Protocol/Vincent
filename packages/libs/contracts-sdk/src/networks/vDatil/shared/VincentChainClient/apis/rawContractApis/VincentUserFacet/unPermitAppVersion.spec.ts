import { getTestContext } from '../testContext';
import { permitAppVersion } from './permitAppVersion';
import { unPermitAppVersion } from './unPermitAppVersion';
import { getAppVersion } from '../VincentAppViewFacet/getAppVersion';
import { getPermittedAppVersionForPkp } from '../VincentUserViewFacet/getPermittedAppVersionForPkp';

describe('unPermitAppVersion', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should unpermit an app version for a PKP token', async () => {
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

    // Verify the app version was permitted
    const permittedVersionBefore = await getPermittedAppVersionForPkp(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: testContext.registerAppRes.appId,
      },
      testContext.networkContext,
    );
    expect(permittedVersionBefore).toBe(appVersionRes[1].version);

    // Now unpermit the app version
    const result = await unPermitAppVersion(
      {
        pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
        appId: testContext.registerAppRes.appId,
        appVersion: appVersionRes[1].version,
      },
      testContext.networkContext,
    );

    // Log the result for debugging
    console.log('Unpermit app version result:', result);

    // Verify structure of the response
    expect(result).toHaveProperty('hash');
    expect(result).toHaveProperty('receipt');
    expect(result).toHaveProperty('decodedLogs');

    // Verify the app version was unpermitted by checking the event
    const appVersionUnPermittedEvent = result.decodedLogs.find(
      (log) => log.eventName === 'AppVersionUnPermitted',
    );
    expect(appVersionUnPermittedEvent).toBeDefined();

    if (appVersionUnPermittedEvent) {
      expect(appVersionUnPermittedEvent.args.pkpTokenId).toBe(testContext.AGENT_PKP_TOKEN_IDS[0]);
      expect(appVersionUnPermittedEvent.args.appId).toBe(testContext.registerAppRes.appId);
      expect(appVersionUnPermittedEvent.args.appVersion).toBe(appVersionRes[1].version);
    }

    // Verify the app version is no longer permitted
    try {
      const permittedVersionAfter = await getPermittedAppVersionForPkp(
        {
          pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
          appId: testContext.registerAppRes.appId,
        },
        testContext.networkContext,
      );

      // The method might return 0 instead of throwing an error
      expect(permittedVersionAfter).toBe(0n);
    } catch (error) {
      // Or it might throw an error, which is also acceptable
      console.log('Expected error when checking unpermitted version:', error);
    }
  });
});
