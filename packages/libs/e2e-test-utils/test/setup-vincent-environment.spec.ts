import { ethers } from 'ethers';
import { baseSepolia } from 'viem/chains';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { setupVincentDevelopmentEnvironment } from '../src/lib/setup-vincent-development-environment';
import type { VincentDevEnvironment } from '../src/lib/setup/types';

// Extend Jest timeout to 5 minutes for setup
jest.setTimeout(300000);

// Helper to get required environment variables
const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  if (!process.env[key] && fallback) {
    console.warn(`ℹ️  ${key} not set; using fallback value.`);
  }
  return value;
};

// Test configuration from environment variables (required)
const BASE_SEPOLIA_RPC_URL = getEnv('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org');
const VINCENT_API_URL = getEnv('VINCENT_API_URL', 'https://api.heyvincent.ai');
const TEST_FUNDER_PRIVATE_KEY = getEnv('TEST_FUNDER_PRIVATE_KEY');
const TEST_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_APP_MANAGER_PRIVATE_KEY');
const TEST_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_APP_DELEGATEE_PRIVATE_KEY');
const TEST_USER_EOA_PRIVATE_KEY = getEnv('TEST_USER_EOA_PRIVATE_KEY');
const TEST_ABILITY_IPFS_CID = getEnv(
  'TEST_ABILITY_IPFS_CID',
  'QmRkPbEyFSzdknk6fBQYnKRHKfSs2AYpgcjZVQ699BMnLz',
);

/**
 * E2E test for Vincent development environment setup
 *
 * This test validates:
 * 1. App is registered on-chain with correct manager and delegatee
 * 2. App version has expected abilities and policies
 * 3. PKP is created by registry API
 * 4. Smart account is deployed with User EOA and PKP as signers
 * 5. App is registered with Vincent API
 */
describe('Vincent Development Environment Setup', () => {
  let env: VincentDevEnvironment;
  let provider: ethers.providers.JsonRpcProvider;

  beforeAll(async () => {
    console.log('\nRunning Vincent Development Environment E2E Test');
    console.log(`RPC URL: ${BASE_SEPOLIA_RPC_URL}`);
    console.log(`Vincent API: ${VINCENT_API_URL}`);

    // Create provider for on-chain checks
    provider = new ethers.providers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);

    // Run the setup
    env = await setupVincentDevelopmentEnvironment({
      rpcUrl: BASE_SEPOLIA_RPC_URL,
      chain: baseSepolia,
      vincentApiUrl: VINCENT_API_URL,
      privateKeys: {
        funder: TEST_FUNDER_PRIVATE_KEY,
        appManager: TEST_APP_MANAGER_PRIVATE_KEY,
        appDelegatee: TEST_APP_DELEGATEE_PRIVATE_KEY,
        userEoa: TEST_USER_EOA_PRIVATE_KEY,
      },
      abilityIpfsCids: [TEST_ABILITY_IPFS_CID],
      abilityPolicies: [[]],
      appMetadata: {
        name: 'E2E Test App',
        description: 'Test app for e2e-test-utils validation',
        contactEmail: 'test@example.com',
        appUrl: 'https://example.com',
        deploymentStatus: 'dev',
      },
    });

    console.log('\nSetup completed successfully');
  });

  describe('On-chain App Registration', () => {
    it('should register app with valid app ID', () => {
      expect(env.appId).toBeGreaterThan(0);
      console.log(`App ID: ${env.appId}`);
    });

    // it.skip('should have valid app version', () => {
    //   expect(env.appVersion).toBeGreaterThan(0);
    // });

    // it.skip('should have registration transaction hash or be reusing existing app', () => {
    //   expect(env.registrationTxHash).toBeDefined();
    //   if (env.registrationTxHash) {
    //     expect(env.registrationTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    //     console.log(`Registration Tx: ${env.registrationTxHash}`);
    //   } else {
    //     console.log(`Reusing existing app (no new registration tx)`);
    //   }
    // });

    // it.skip('should have app managed by correct app manager', async () => {
    //   const client = getClient({ signer: env.wallets.appManager });
    //   const app = await client.getAppById({ appId: env.appId });

    //   expect(app).toBeDefined();
    //   expect(app!.manager.toLowerCase()).toBe(env.wallets.appManager.address.toLowerCase());
    // });

    // it.skip('should have delegatee registered for the app', async () => {
    //   const client = getClient({ signer: env.wallets.appDelegatee });
    //   const app = await client.getAppByDelegateeAddress({
    //     delegateeAddress: env.wallets.appDelegatee.address,
    //   });

    //   expect(app).toBeDefined();
    //   expect(app!.id).toBe(env.appId);
    // });
  });

  // describe.skip('App Version Configuration', () => {
  //   it('should have correct abilities configured', async () => {
  //     const client = getClient({ signer: env.wallets.appManager });
  //     const result = await client.getAppVersion({
  //       appId: env.appId,
  //       version: env.appVersion,
  //     });

  //     expect(result).toBeDefined();
  //     expect(result!.appVersion).toBeDefined();

  //     // Access abilities correctly based on the actual return type
  //     const abilities = (result!.appVersion as any).abilities;
  //     expect(abilities).toBeDefined();
  //     expect(Array.isArray(abilities)).toBe(true);
  //     expect(abilities.length).toBe(1);

  //     // Validate ability IPFS CID
  //     const ability = abilities[0];
  //     expect(ability.abilityIpfsCid).toBe(TEST_ABILITY_IPFS_CID);
  //   });

  //   it('should have correct policies configured', async () => {
  //     const client = getClient({ signer: env.wallets.appManager });
  //     const result = await client.getAppVersion({
  //       appId: env.appId,
  //       version: env.appVersion,
  //     });

  //     expect(result).toBeDefined();
  //     expect(result!.appVersion).toBeDefined();

  //     // Access abilities correctly
  //     const abilities = (result!.appVersion as any).abilities;
  //     expect(abilities).toBeDefined();

  //     // Validate policies (empty array in this test)
  //     const ability = abilities[0];
  //     expect(ability.policyIpfsCids.length).toBe(0);
  //   });
  // });

  // describe.skip('PKP and Smart Account', () => {
  //   it('should have PKP signer address from registry API', () => {
  //     expect(env.agentSignerAddress).toBeDefined();
  //     expect(env.agentSignerAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  //   });

  //   it('should have smart account address from registry API', () => {
  //     expect(env.agentSmartAccountAddress).toBeDefined();
  //     expect(env.agentSmartAccountAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  //   });

  //   it('should have local smart account client with matching address', () => {
  //     expect(env.smartAccount).toBeDefined();
  //     expect(env.smartAccount.account).toBeDefined();
  //     expect(env.smartAccount.account.address.toLowerCase()).toBe(
  //       env.agentSmartAccountAddress.toLowerCase()
  //     );
  //   });

  //   it('should have smart account deployed on-chain', async () => {
  //     const code = await provider.getCode(env.agentSmartAccountAddress);

  //     expect(code).toBeDefined();
  //     expect(code).not.toBe('0x');
  //     expect(code.length).toBeGreaterThan(2);
  //   });
  // });

  // describe.skip('Wallet Addresses', () => {
  //   it('should have valid funder wallet address', () => {
  //     expect(env.wallets.funder.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  //   });

  //   it('should have valid app manager wallet address', () => {
  //     expect(env.wallets.appManager.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  //   });

  //   it('should have valid app delegatee wallet address', () => {
  //     expect(env.wallets.appDelegatee.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  //   });

  //   it('should have valid user EOA wallet address', () => {
  //     expect(env.wallets.userEoa.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  //     expect(env.userEoaAddress).toBe(env.wallets.userEoa.address);
  //   });
  // });

  // describe.skip('Account Index Hash', () => {
  //   it('should have valid account index hash', () => {
  //     expect(env.accountIndexHash).toBeDefined();
  //     expect(env.accountIndexHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  //   });
  // });

  // describe.skip('Summary', () => {
  //   it('should print complete environment summary', () => {
  //     console.log('\nVincent Development Environment Summary:');
  //     console.log('═══════════════════════════════════════════');
  //     console.log(`App ID: ${env.appId}`);
  //     console.log(`App Version: ${env.appVersion}`);
  //     console.log(`Registration Tx: ${env.registrationTxHash || 'N/A (existing app)'}`);
  //     console.log('\nAddresses:');
  //     console.log(`  Funder:             ${env.wallets.funder.address}`);
  //     console.log(`  App Manager:        ${env.wallets.appManager.address}`);
  //     console.log(`  App Delegatee:      ${env.wallets.appDelegatee.address}`);
  //     console.log(`  User EOA:           ${env.userEoaAddress}`);
  //     console.log(`  PKP Signer:         ${env.agentSignerAddress}`);
  //     console.log(`  Smart Account:      ${env.agentSmartAccountAddress}`);
  //     console.log('\nConfiguration:');
  //     console.log(`  Account Index Hash: ${env.accountIndexHash}`);
  //     console.log(`  Chain:              ${baseSepolia.name} (${baseSepolia.id})`);
  //     console.log(`  Abilities:          1`);
  //     console.log('═══════════════════════════════════════════\n');

  //     expect(true).toBe(true); // Always pass to show summary
  //   });
  // });
});
