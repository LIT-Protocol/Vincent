import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { registerNextAppVersion } from './registerNextAppVersion';
import { vincentNetworkContext } from '../../../_vincentConfig';
import { registerApp } from './registerApp';

describe('registerNextAppVersion', () => {
  it('should register a new version of an existing app with test parameters', async () => {

    // first we need to register an app
    const account = privateKeyToAccount(generatePrivateKey());

    const res = await registerApp(
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

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    const appId = res.decodedLogs.find((log) => log.eventName === 'NewAppVersionRegistered')?.args.appId;

    console.log("App ID: ", appId);

    // then use the app id to register a new version
    const res2 = await registerNextAppVersion(
      {
        appId: appId, // Assuming this is an existing app's ID
        toolIpfsCids: ['QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY'],
        toolPolicies: [['QmcLbQPohPURMuNdhYYa6wyDp9pm6eHPdHv9TRgFkPVebE']],
        toolPolicyParameterNames: [[['param1']]],
        toolPolicyParameterTypes: [[['INT256']]], // <-- Updated different parameter type
      },
      vincentNetworkContext
    );

    console.log(res2);

    expect(res2.hash).toBeDefined();
    expect(res2.receipt).toBeDefined();
    expect(res2.decodedLogs).toBeDefined();
    
    const appId2 = res2.decodedLogs.find((log) => log.eventName === 'NewAppVersionRegistered')?.args.appId;

    console.log("App ID: ", appId2);
  });
}); 