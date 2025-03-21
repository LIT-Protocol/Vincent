import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { enableAppVersion } from './enableAppVersion';
import { vincentNetworkContext } from '../../../_vincentConfig';
import { registerApp } from './registerApp';
import { registerNextAppVersion } from './registerNextAppVersion';

describe('enableAppVersion', () => {
  it('should enable and disable an app version', async () => {
    // First register an app
    const account = privateKeyToAccount(generatePrivateKey());

    const registerRes = await registerApp(
      {
        appName: 'Test App',
        appDescription: 'Test Description',
        authorizedRedirectUris: ['http://localhost:3000'],
        delegatees: [account.address],
        toolIpfsCids: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
        toolPolicies: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
        toolPolicyParameterNames: [[['param1']]],
        toolPolicyParameterTypes: [[['BYTES']]],
      },
      vincentNetworkContext
    );

    const appId = registerRes.decodedLogs.find((log) => log.eventName === 'NewAppVersionRegistered')?.args.appId;
    console.log("Initial App ID: ", appId);

    // Register a new version
    const nextVersionRes = await registerNextAppVersion(
      {
        appId: appId,
        toolIpfsCids: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
        toolPolicies: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
        toolPolicyParameterNames: [[['param1']]],
        toolPolicyParameterTypes: [[['INT256']]],
      },
      vincentNetworkContext
    );

    console.log("nextVersionRes:", nextVersionRes);

    const appVersion = nextVersionRes.decodedLogs.find((log) => log.eventName === 'NewAppVersionRegistered')?.args.appVersion;
    console.log("App Version: ", appVersion);

    // Test enabling the app version
    const enableRes = await enableAppVersion(
      {
        appId: appId,
        appVersion: appVersion,
        enabled: false,
      },
      vincentNetworkContext
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
      vincentNetworkContext
    );

    expect(disableRes.hash).toBeDefined();
    expect(disableRes.receipt).toBeDefined();
    expect(disableRes.decodedLogs).toBeDefined();
  });
}); 