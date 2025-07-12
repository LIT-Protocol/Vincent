import { vincentNetworkContext } from '../../../NetworkContextManager';
import { getTestContext } from '../testContext';
import { enableAppVersion } from './enableAppVersion';
import { registerNextAppVersion } from './registerNextAppVersion';

describe('enableAppVersion', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should enable and disable an app version', async () => {
    const { appId } = testContext.registerAppRes;

    // Register a new version
    const nextVersionRes = await registerNextAppVersion(
      {
        appId: appId,
        toolIpfsCids: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
        toolPolicies: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
        toolPolicyParameterNames: [[['param1']]],
        toolPolicyParameterTypes: [[['INT256']]],
      },
      vincentNetworkContext,
    );

    const appVersion = nextVersionRes.decodedLogs.find(
      (log) => log.eventName === 'NewAppVersionRegistered',
    )?.args.appVersion;
    console.log('App Version: ', appVersion);

    // Test enabling the app version
    const enableRes = await enableAppVersion(
      {
        appId: appId,
        appVersion: appVersion,
        enabled: false,
      },
      vincentNetworkContext,
    );

    expect(enableRes.hash).toBeDefined();
    expect(enableRes.receipt).toBeDefined();
    expect(enableRes.decodedLogs).toBeDefined();

    // Test disabling the app version
    const disableRes = await enableAppVersion(
      {
        appId: appId,
        appVersion: appVersion,
        enabled: true,
      },
      vincentNetworkContext,
    );

    expect(disableRes.hash).toBeDefined();
    expect(disableRes.receipt).toBeDefined();
    expect(disableRes.decodedLogs).toBeDefined();
  });
});
