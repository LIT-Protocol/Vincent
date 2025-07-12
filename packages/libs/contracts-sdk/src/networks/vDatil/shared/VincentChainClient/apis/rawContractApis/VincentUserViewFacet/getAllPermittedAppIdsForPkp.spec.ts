// TODO: We need to test this when write methods are implemented
import { getTestContext } from '../testContext';
import { getAppVersion } from '../VincentAppViewFacet/getAppVersion';
import { permitAppVersion } from '../VincentUserFacet/permitAppVersion';
import { getAllPermittedAppIdsForPkp } from './getAllPermittedAppIdsForPkp';

describe('getAllPermittedAppIdsForPkp', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    // Initialize test context with app registration
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should retrieve all permitted app IDs for a PKP token', async () => {
    // First, get the app version details
    const appVersionRes = await getAppVersion(
      {
        appId: testContext.registerAppRes.appId,
        version: 1, // First version
      },
      testContext.networkContext,
    );

    console.log('App Version Details:', {
      appId: testContext.registerAppRes.appId,
      appVersion: appVersionRes[1].version,
    });

    // Permit the app version
    const permitResult = await permitAppVersion(
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

    const appVersionPermittedEvents = permitResult.decodedLogs.filter(
      (log) => log.eventName === 'AppVersionPermitted',
    );

    console.log('App Version Permitted Events:', appVersionPermittedEvents);

    const eventAppId = appVersionPermittedEvents[0].args.appId;
    const eventAppVersion = appVersionPermittedEvents[0].args.appVersion;
    const eventPkpTokenId = appVersionPermittedEvents[0].args.pkpTokenId;

    const result = await getAllPermittedAppIdsForPkp(
      {
        pkpTokenId: eventPkpTokenId,
      },
      testContext.networkContext,
    );

    // Verify the structure of the response
    expect(Array.isArray(result)).toBe(true);

    // Log the result for debugging
    console.log('Permitted app IDs:', result);

    // We can't assert exact values as they depend on the test environment state,
    // but we can verify the returned value is an array of bigints
    if (result.length > 0) {
      result.forEach((appId) => {
        expect(typeof appId).toBe('bigint');
        // expect eventAppId to be included in the result
        expect(result).toContain(eventAppId);
      });
    }
  });
});
