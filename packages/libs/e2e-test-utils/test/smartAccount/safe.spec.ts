import type { PermissionData } from '@lit-protocol/vincent-contracts-sdk';

import { setupVincentDevelopmentEnvironment } from '../../src';

const SAFE_RPC_URL = process.env.SAFE_RPC_URL;
const PIMLICO_RPC_URL = process.env.PIMLICO_RPC_URL;
const SMART_ACCOUNT_CHAIN_ID = process.env.SMART_ACCOUNT_CHAIN_ID;
const hasRequiredEnvVars = SAFE_RPC_URL && PIMLICO_RPC_URL && SMART_ACCOUNT_CHAIN_ID;

(hasRequiredEnvVars ? describe : describe.skip)('Safe Smart Account Setup', () => {
  it('should successfully create a Safe smart account through setupVincentDevelopmentEnvironment', async () => {
    console.log(`Testing Safe smart account setup via setupVincentDevelopmentEnvironment...`);

    // Minimal permission data for testing - using a valid IPFS CID format
    // This is a placeholder valid CID, not a real ability
    const permissionData: PermissionData = {
      QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG: {},
    };

    // Create Vincent development environment with Safe smart account
    const result = await setupVincentDevelopmentEnvironment({
      permissionData,
      smartAccountType: 'safe',
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

    // Safe-specific: verify client exists
    if ('client' in result.smartAccount!) {
      expect(result.smartAccount!.client).toBeDefined();
    }
  }, 300000); // 5 minute timeout for full environment setup
});
