import { getTestContext } from '../testContext';
import { registerNextAppVersion } from './registerNextAppVersion';

describe('registerNextAppVersion', () => {
  let testContext: Awaited<ReturnType<typeof getTestContext>>;

  beforeAll(async () => {
    testContext = await getTestContext({
      registerApp: true,
    });
  });

  it('should register a new version of an existing app with test parameters', async () => {
    // first we need to register an app
    const { appId } = testContext.registerAppRes;

    // then use the app id to register a new version
    const res2 = await registerNextAppVersion(
      {
        appId: appId, // Assuming this is an existing app's ID
        toolIpfsCids: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
        toolPolicies: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
        toolPolicyParameterNames: [[['param1']]],
        toolPolicyParameterTypes: [[['INT256']]], // Updated different parameter type
      },
      testContext.networkContext,
    );

    console.log(res2);

    expect(res2.hash).toBeDefined();
    expect(res2.receipt).toBeDefined();
    expect(res2.decodedLogs).toBeDefined();

    // Check events
    const newVersionEvent = res2.decodedLogs.find(
      (log) => log.eventName === 'NewAppVersionRegistered',
    );

    expect(newVersionEvent).toBeDefined();

    const appId2 = newVersionEvent?.args.appId;
    const appVersion = newVersionEvent?.args.appVersion;

    console.log('App ID: ', appId2);
    console.log('App Version: ', appVersion);
  });
});
