import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import { setupVincentDevelopmentEnvironment } from '../../src/lib/setup-vincent-development-environment';

describe('Crossmint Smart Account Setup', () => {
  const CROSSMINT_API_KEY = process.env.CROSSMINT_API_KEY;
  const SMART_ACCOUNT_CHAIN_ID = process.env.SMART_ACCOUNT_CHAIN_ID;

  beforeAll(() => {
    if (!CROSSMINT_API_KEY) {
      throw new Error('CROSSMINT_API_KEY environment variable is required for this test');
    }
    if (!SMART_ACCOUNT_CHAIN_ID) {
      throw new Error('SMART_ACCOUNT_CHAIN_ID environment variable is required for this test');
    }
  });

  it('should successfully create a Crossmint smart account through setupVincentDevelopmentEnvironment', async () => {
    console.log(`Testing Crossmint smart account setup via setupVincentDevelopmentEnvironment...`);

    // Minimal permission data for testing - using a valid IPFS CID format
    // This is a placeholder valid CID, not a real ability
    const permissionData: PermissionData = {
      QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG: {},
    };

    // Create Vincent development environment with Crossmint smart account
    const result = await setupVincentDevelopmentEnvironment({
      permissionData,
      smartAccountType: 'crossmint',
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

    console.log(`✅ Crossmint smart account created at: ${result.smartAccount!.account.address}`);
  }, 300000); // 5 minute timeout for full environment setup
});
