import { vincentNetworkContext } from '../../../_vincentConfig';
import { getAppVersion } from './getAppVersion';
import { registerApp } from '../VincentAppFacet/registerApp';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

describe('getAppVersion', () => {
  
  it('should fetch app version details', async () => {
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

    // Now test getAppVersion
    const result = await getAppVersion({ 
      appId,
      version: 1 // First version
    }, vincentNetworkContext);

    // Verify the response structure
    expect(result[0]).toBeDefined(); // app details
    expect(result[1]).toBeDefined(); // version details
    
    // Verify app details
    expect(Number(result[0].id)).toBe(appId);
    expect(result[0].name).toBe('Test App');
    expect(result[0].description).toBe('Test Description');
    expect(result[0].manager).toBeDefined();
    expect(result[0].authorizedRedirectUris).toEqual(['http://localhost:3000']);
    expect(result[0].delegatees).toContain(account.address);

    // Verify version details
    expect(Number(result[1].version)).toBe(1);
    expect(result[1].enabled).toBeDefined();
    expect(Array.isArray(result[1].delegatedAgentPkpTokenIds)).toBe(true);
    expect(Array.isArray(result[1].tools)).toBe(true);
    expect(result[1].tools[0].toolIpfsCid).toBe('QmUT4Ke8cPtJYRZiWrkoG9RZc77hmRETNQjvDYfLtrMUEY');
  });

  it('should handle non-existent app version', async () => {
    await expect(getAppVersion({ 
      appId: 999999, // Non-existent app
      version: 1
    }, vincentNetworkContext)).rejects.toThrow();
  });
}); 