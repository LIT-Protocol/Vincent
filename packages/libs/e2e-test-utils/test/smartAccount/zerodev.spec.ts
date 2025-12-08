import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import { setupVincentDevelopmentEnvironment } from '../../src';

describe('ZeroDev Smart Account Setup', () => {
  it('should successfully create a ZeroDev Kernel smart account through setupVincentDevelopmentEnvironment', async () => {
    console.log(`Testing ZeroDev smart account setup via setupVincentDevelopmentEnvironment...`);

    // Minimal permission data for testing - using a valid IPFS CID format
    // This is a placeholder valid CID, not a real ability
    const permissionData: PermissionData = {
      QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG: {},
    };

    // Create Vincent development environment with ZeroDev smart account
    const result = await setupVincentDevelopmentEnvironment({
      permissionData,
      smartAccountType: 'zerodev',
    });

    // Verify environment was created
    expect(result).toBeDefined();
    expect(result.agentPkpInfo).toBeDefined();
    expect(result.wallets).toBeDefined();
    expect(result.appId).toBeDefined();
    expect(result.appVersion).toBeDefined();

    // Verify smart account was created
    expect(result.smartAccount).toBeDefined();
    expect(result.smartAccount!.account).toBeDefined();
    expect(result.smartAccount!.account.address).toBeDefined();
    expect(result.smartAccount!.account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

    // ZeroDev-specific: verify serialized permission account exists
    if ('serializedPermissionAccount' in result.smartAccount!) {
      expect(result.smartAccount!.serializedPermissionAccount).toBeDefined();
      expect(typeof result.smartAccount!.serializedPermissionAccount).toBe('string');
    }
  }, 300000); // 5 minute timeout for full environment setup
});
