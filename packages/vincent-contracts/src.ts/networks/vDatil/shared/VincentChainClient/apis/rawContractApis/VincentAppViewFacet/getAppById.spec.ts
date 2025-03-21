import { vincentNetworkContext } from '../../../_vincentConfig';
import { getAppById } from './getAppById';
import { registerApp } from '../VincentAppFacet/registerApp';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

describe('getAppById', () => {
  it('should fetch app details', async () => {
    // First register an app to get a valid appId
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

    const appId = Number(registerRes.decodedLogs.find(log => log.eventName === 'NewAppVersionRegistered')?.args.appId);
    console.log('Created app with ID:', appId);

    // Now test getAppById
    const result = await getAppById({ 
      appId
    }, vincentNetworkContext);

    console.log("result:", result);

    // Verify app details
    expect(Number(result.id)).toBe(appId);
    expect(result.name).toBe('Test App');
    expect(result.description).toBe('Test Description');
    expect(result.manager).toBeDefined();
    expect(result.authorizedRedirectUris).toEqual(['http://localhost:3000']);
    expect(result.delegatees).toContain(account.address);
    expect(Number(result.latestVersion)).toBe(1);
  });

  it('should handle non-existent app', async () => {
    await expect(getAppById({ 
      appId: 999999 // Non-existent app
    }, vincentNetworkContext)).rejects.toThrow();
  });
}); 