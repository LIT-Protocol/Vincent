import { getTestContext } from '../testContext';
import { getAppVersion } from '../VincentAppViewFacet/getAppVersion';
import {
  getAllPermittedAppIdsForPkp,
  getPermittedAppVersionForPkp,
} from '../VincentUserViewFacet';
import { getAllRegisteredAgentPkps } from '../VincentUserViewFacet/getAllRegisteredAgentPkps';
import { permitAppVersion } from './permitAppVersion';

/**
 * Test for the permitAppVersion function
 * This test verifies that a PKP token can be permitted to use a specific app version
 */
describe('permitAppVersion', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    // Initialize test context with app registration
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should permit an app version for a PKP token', async () => {
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

    // Get the wallet address to check registered PKPs
    const userAddress = testContext.networkContext.walletClient.account.address;

    // Check if any PKPs are already registered for this user
    let initialPkps;
    try {
      initialPkps = await getAllRegisteredAgentPkps(
        { userAddress },
        testContext.networkContext,
      );
      console.log('Initial registered PKPs:', initialPkps);
    } catch (error) {
      console.log('No PKPs registered initially (expected):', error.message);
      initialPkps = [];
    }

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

    // Verify the transaction result
    expect(permitResult).toHaveProperty('hash');
    expect(permitResult).toHaveProperty('receipt');
    expect(permitResult).toHaveProperty('decodedLogs');
    console.log('Transaction hash:', permitResult.hash);

    // Verify transaction was successful
    expect(permitResult.receipt.status).toBe('success');

    // Verify logs contain the expected events
    const appVersionPermittedEvents = permitResult.decodedLogs.filter(
      (log) => log.eventName === 'AppVersionPermitted',
    );

    expect(appVersionPermittedEvents.length).toBeGreaterThan(0);
    if (appVersionPermittedEvents.length > 0) {
      const event = appVersionPermittedEvents[0];
      console.log('event', event);
      expect(event.args.pkpTokenId).toBe(testContext.AGENT_PKP_TOKEN_IDS[0]);
      expect(event.args.appId).toBe(testContext.registerAppRes.appId);
      expect(event.args.appVersion).toBe(appVersionRes[1].version);

      // Verify the permitted app version for the PKP
      const permittedVersion = await getPermittedAppVersionForPkp(
        {
          pkpTokenId: event.args.pkpTokenId,
          appId: event.args.appId,
        },
        testContext.networkContext,
      );

      console.log('Permitted app version:', permittedVersion);

      const permittedAppIds = await getAllPermittedAppIdsForPkp(
        {
          pkpTokenId: event.args.pkpTokenId,
        },
        testContext.networkContext,
      );

      console.log('Permitted app IDs:', permittedAppIds);
    }

    // Verify the PKP is now registered for the user
    // const registeredPkps = await getAllRegisteredAgentPkps(
    //   { userAddress },
    //   testContext.networkContext,
    // );

    // console.log('Registered PKPs after permitAppVersion:', registeredPkps);
    // expect(registeredPkps).toContain(testContext.AGENT_PKP_TOKEN_IDS[0]);

    // Verify the permitted app version for the PKP
    // const permittedVersion = await getPermittedAppVersionForPkp(
    //   {
    //     pkpTokenId: testContext.AGENT_PKP_TOKEN_IDS[0],
    //     appId: testContext.registerAppRes.appId,
    //   },
    //   testContext.networkContext,
    // );

    // console.log('Permitted app version:', permittedVersion);
    // expect(permittedVersion).toBe(appVersionRes[1].version);
  });
});
