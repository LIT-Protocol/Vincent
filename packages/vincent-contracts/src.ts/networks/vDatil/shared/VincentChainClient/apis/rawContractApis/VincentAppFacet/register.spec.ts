import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { registerApp } from './registerApp';
import { vincentNetworkContext } from '../../../_vincentConfig';

describe('registerApp', () => {
  it('should register a new app with test parameters', async () => {
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

    console.log(res);

    expect(res.hash).toBeDefined();
    expect(res.receipt).toBeDefined();
    expect(res.decodedLogs).toBeDefined();

    const appId = res.decodedLogs.find((log) => log.eventName === 'NewAppVersionRegistered')?.args.appId;

    console.log("App ID: ", appId);
  });
});
