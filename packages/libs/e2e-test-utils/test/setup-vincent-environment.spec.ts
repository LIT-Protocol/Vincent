import { ethers } from 'ethers';
import { baseSepolia } from 'viem/chains';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';
import { setupVincentDevelopmentEnvironment } from '../src/lib/setupVincentDevelopmentEnv';
import type { VincentDevEnvironment } from '../src/lib/setup/types';
import { getEnv } from '../src/lib/setup';

// Extend Jest timeout to 5 minutes for setup
jest.setTimeout(300000);

// Test configuration from environment variables (required)
const BASE_SEPOLIA_RPC_URL = getEnv('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org');
const VINCENT_API_URL = getEnv('VINCENT_API_URL', 'https://api.heyvincent.ai');
const ZERODEV_PROJECT_ID = getEnv('ZERODEV_PROJECT_ID');
const TEST_FUNDER_PRIVATE_KEY = getEnv('TEST_FUNDER_PRIVATE_KEY');
const TEST_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_APP_MANAGER_PRIVATE_KEY');
const TEST_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_APP_DELEGATEE_PRIVATE_KEY');
const TEST_USER_EOA_PRIVATE_KEY = getEnv('TEST_USER_EOA_PRIVATE_KEY');
const TEST_ABILITY_IPFS_CID = getEnv(
  'TEST_ABILITY_IPFS_CID',
  'QmRkPbEyFSzdknk6fBQYnKRHKfSs2AYpgcjZVQ699BMnLz',
);
const TEST_POLICY_IPFS_CID = getEnv(
  'TEST_POLICY_IPFS_CID',
  'QmZFznizKKYWoYTq6Na8G7uUm3QN3gX54qu52EKe6nfRo4',
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

  beforeAll(async () => {
    console.log('\nRunning Vincent Development Environment E2E Test');
    console.log(`RPC URL: ${BASE_SEPOLIA_RPC_URL}`);
    console.log(`Vincent API: ${VINCENT_API_URL}`);

    // Run the setup
    env = await setupVincentDevelopmentEnvironment({
      vincentRegistryRpcUrl: BASE_SEPOLIA_RPC_URL,
      vincentRegistryChain: baseSepolia,
      vincentApiUrl: VINCENT_API_URL,
      zerodevProjectId: ZERODEV_PROJECT_ID,
      privateKeys: {
        funder: TEST_FUNDER_PRIVATE_KEY as `0x${string}`,
        appManager: TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`,
        appDelegatee: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
        userEoa: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
      },
      abilityIpfsCids: [TEST_ABILITY_IPFS_CID],
      abilityPolicies: [[TEST_POLICY_IPFS_CID]],
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
    });

    it('should have valid app version', () => {
      expect(env.appVersion).toBeGreaterThan(0);
    });

    it('should have account index hash', () => {
      expect(env.accountIndexHash).toBeDefined();
      if (env.accountIndexHash) {
        expect(env.accountIndexHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it('should have app managed by correct app manager', async () => {
      // Create ethers wallet from private key for contract calls
      const provider = new ethers.providers.JsonRpcProvider(env.vincentRegistryRpcUrl);
      const appManagerWallet = new ethers.Wallet(TEST_APP_MANAGER_PRIVATE_KEY, provider);

      const client = getClient({ signer: appManagerWallet });
      const app = await client.getAppById({ appId: env.appId });

      expect(app).toBeDefined();
      expect(app!.manager.toLowerCase()).toBe(env.accounts.appManager.address.toLowerCase());
    });

    it('should have delegatee registered for the app', async () => {
      // Create ethers wallet from private key for contract calls
      const provider = new ethers.providers.JsonRpcProvider(env.vincentRegistryRpcUrl);
      const appDelegateeWallet = new ethers.Wallet(TEST_APP_DELEGATEE_PRIVATE_KEY, provider);

      const client = getClient({ signer: appDelegateeWallet });
      const app = await client.getAppByDelegateeAddress({
        delegateeAddress: env.accounts.appDelegatee.address,
      });

      expect(app).toBeDefined();
      expect(app!.id).toBe(env.appId);
    });
  });

  describe('App Version Configuration', () => {
    it('should have correct abilities configured', async () => {
      // Create ethers wallet from private key for contract calls
      const provider = new ethers.providers.JsonRpcProvider(env.vincentRegistryRpcUrl);
      const appManagerWallet = new ethers.Wallet(TEST_APP_MANAGER_PRIVATE_KEY, provider);

      const client = getClient({ signer: appManagerWallet });
      const result = await client.getAppVersion({
        appId: env.appId,
        version: env.appVersion,
      });

      expect(result).toBeDefined();
      expect(result!.appVersion).toBeDefined();

      // Access abilities correctly based on the actual return type
      const abilities = (result!.appVersion as any).abilities;
      expect(abilities).toBeDefined();
      expect(Array.isArray(abilities)).toBe(true);
      expect(abilities.length).toBe(1);

      // Validate ability IPFS CID
      const ability = abilities[0];
      expect(ability.abilityIpfsCid).toBe(TEST_ABILITY_IPFS_CID);
    });

    it('should have correct policies configured', async () => {
      // Create ethers wallet from private key for contract calls
      const provider = new ethers.providers.JsonRpcProvider(env.vincentRegistryRpcUrl);
      const appManagerWallet = new ethers.Wallet(TEST_APP_MANAGER_PRIVATE_KEY, provider);

      const client = getClient({ signer: appManagerWallet });
      const result = await client.getAppVersion({
        appId: env.appId,
        version: env.appVersion,
      });

      expect(result).toBeDefined();
      expect(result!.appVersion).toBeDefined();

      // Access abilities correctly
      const abilities = (result!.appVersion as any).abilities;
      expect(abilities).toBeDefined();

      // Validate policies (empty array in this test)
      const ability = abilities[0];
      expect(ability.policyIpfsCids.length).toBe(1);
      expect(ability.policyIpfsCids[0]).toBe(TEST_POLICY_IPFS_CID);
    });
  });

  describe('PKP and Smart Account', () => {
    it('should have PKP signer address from registry API', () => {
      expect(env.agentSignerAddress).toBeDefined();
      expect(env.agentSignerAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have smart account address from registry API', () => {
      expect(env.agentSmartAccountAddress).toBeDefined();
      expect(env.agentSmartAccountAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have local smart account client with matching address', () => {
      expect(env.smartAccount).toBeDefined();
      expect(env.smartAccount.account).toBeDefined();
      expect(env.smartAccount.account.address.toLowerCase()).toBe(
        env.agentSmartAccountAddress.toLowerCase(),
      );
    });

    it('should have smart account deployed on-chain', async () => {
      const provider = new ethers.providers.JsonRpcProvider(env.vincentRegistryRpcUrl);
      const code = await provider.getCode(env.agentSmartAccountAddress);

      expect(code).toBeDefined();
      expect(code).not.toBe('0x');
      expect(code.length).toBeGreaterThan(2);
    });
  });

  describe('Account Addresses', () => {
    it('should have valid funder account address', () => {
      expect(env.accounts.funder.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have valid app manager account address', () => {
      expect(env.accounts.appManager.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have valid app delegatee account address', () => {
      expect(env.accounts.appDelegatee.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have valid user EOA account address', () => {
      expect(env.accounts.userEoa.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('Account Index Hash', () => {
    it('should have valid account index hash', () => {
      expect(env.accountIndexHash).toBeDefined();
      expect(env.accountIndexHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('Summary', () => {
    it('should print complete environment summary', () => {
      console.log('Vincent Development Environment Summary:');
      console.table([
        { Key: 'App ID', Value: env.appId },
        { Key: 'App Version', Value: env.appVersion },
        { Key: 'Account Index Hash', Value: env.accountIndexHash || 'N/A' },
        { Key: 'Funder', Value: env.accounts.funder.address },
        { Key: 'App Manager', Value: env.accounts.appManager.address },
        { Key: 'App Delegatee', Value: env.accounts.appDelegatee.address },
        { Key: 'User EOA', Value: env.accounts.userEoa.address },
        { Key: 'PKP Signer', Value: env.agentSignerAddress },
        { Key: 'Smart Account', Value: env.agentSmartAccountAddress },
        {
          Key: 'Smart Account Deployment Tx',
          Value: env.smartAccountRegistrationTxHash || 'N/A (already deployed)',
        },
        { Key: 'Chain', Value: `${baseSepolia.name} (${baseSepolia.id})` },
      ]);

      expect(true).toBe(true); // Always pass to show summary
    });
  });
});
