import { ethers } from 'ethers';
import { base, baseSepolia } from 'viem/chains';

import { getClient } from '@lit-protocol/vincent-contracts-sdk';

import type { VincentDevEnvironment } from '../src';

import { getEnv, setupVincentDevelopmentEnvironment } from '../src';

// Extend Jest timeout to 5 minutes for setup
jest.setTimeout(300000);

// Test configuration from environment variables (required)
const VINCENT_REGISTRY_RPC_URL = getEnv('VINCENT_REGISTRY_RPC_URL');
const VINCENT_REGISTRY_CHAIN_ID = parseInt(getEnv('VINCENT_REGISTRY_CHAIN_ID'), 10);

const SMART_ACCOUNT_CHAIN_RPC_URL = getEnv('SMART_ACCOUNT_CHAIN_RPC_URL');
const SMART_ACCOUNT_CHAIN_ID = parseInt(getEnv('SMART_ACCOUNT_CHAIN_ID'), 10);

const VINCENT_API_URL = getEnv('VINCENT_API_URL', 'https://api.heyvincent.ai');

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

// Helper function to get chain configuration by ID
function getChainById(chainId: number) {
  if (chainId === base.id) {
    return base;
  } else if (chainId === baseSepolia.id) {
    return baseSepolia;
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
}

const vincentRegistryChain = getChainById(VINCENT_REGISTRY_CHAIN_ID);
const smartAccountChain = getChainById(SMART_ACCOUNT_CHAIN_ID);

describe('Vincent Development Environment Setup', () => {
  let env: VincentDevEnvironment;

  beforeAll(async () => {
    env = await setupVincentDevelopmentEnvironment({
      vincentRegistryRpcUrl: VINCENT_REGISTRY_RPC_URL,
      vincentRegistryChain,
      smartAccountChainRpcUrl: SMART_ACCOUNT_CHAIN_RPC_URL,
      smartAccountChain,
      vincentApiUrl: VINCENT_API_URL,
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
      expect(env.agentSmartAccount!.agentSignerAddress).toBeDefined();
      expect(env.agentSmartAccount!.agentSignerAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have smart account address', () => {
      expect(env.agentSmartAccount!.address).toBeDefined();
      expect(env.agentSmartAccount!.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have smart account deployed on-chain', async () => {
      // Smart account is deployed on the smart account chain, not the Vincent Registry chain
      const provider = new ethers.providers.JsonRpcProvider(env.smartAccountChainRpcUrl);
      const code = await provider.getCode(env.agentSmartAccount!.address);

      expect(code).toBeDefined();
      expect(code).not.toBe('0x');
      expect(code.length).toBeGreaterThan(2);
    });

    it('should have deployment transaction hash (or be already deployed)', () => {
      // deploymentTxHash might be undefined if already installed
      if (env.agentSmartAccount!.deploymentTxHash) {
        expect(env.agentSmartAccount!.deploymentTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it('should have serialized permission account (or be already installed)', () => {
      // serializedPermissionAccount might be undefined if already installed
      if (env.agentSmartAccount!.serializedPermissionAccount) {
        expect(env.agentSmartAccount!.serializedPermissionAccount).toBeTruthy();
        expect(env.agentSmartAccount!.serializedPermissionAccount.length).toBeGreaterThan(0);
        expect(() =>
          Buffer.from(env.agentSmartAccount!.serializedPermissionAccount!, 'base64'),
        ).not.toThrow();
        const decoded = Buffer.from(
          env.agentSmartAccount!.serializedPermissionAccount!,
          'base64',
        ).toString('utf-8');
        expect(() => JSON.parse(decoded)).not.toThrow();
      }
    });

    it('should have permit app version transaction hash (or be already installed)', () => {
      // permitAppVersionTxHash might be undefined if already installed
      if (env.agentSmartAccount!.permitAppVersionTxHash) {
        expect(env.agentSmartAccount!.permitAppVersionTxHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });

    it('should have app registered for the smart account on-chain', async () => {
      const provider = new ethers.providers.JsonRpcProvider(env.vincentRegistryRpcUrl);
      const wallet = new ethers.Wallet(TEST_APP_MANAGER_PRIVATE_KEY, provider);
      const contractClient = getClient({ signer: wallet });

      const userAddress = await contractClient.getUserAddressForAgent({
        agentAddress: env.agentSmartAccount!.address as `0x${string}`,
      });

      expect(userAddress).toBeDefined();
      expect(userAddress?.toLowerCase()).toBe(env.accounts.userEoa.address.toLowerCase());
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

  describe('Wallet Funding and Balances', () => {
    it('should have funded funder wallet on Vincent Registry chain', async () => {
      const balance = await env.clients.vincentRegistryPublicClient.getBalance({
        address: env.accounts.funder.address,
      });

      expect(balance).toBeGreaterThan(0n);
    });

    it('should have funded app manager wallet', async () => {
      const balance = await env.clients.vincentRegistryPublicClient.getBalance({
        address: env.accounts.appManager.address,
      });

      expect(balance).toBeGreaterThan(0n);
    });

    it('should have funded user EOA wallet', async () => {
      const balance = await env.clients.vincentRegistryPublicClient.getBalance({
        address: env.accounts.userEoa.address,
      });

      expect(balance).toBeGreaterThan(0n);
    });

    it('should have funded app delegatee wallet on Chronicle Yellowstone', async () => {
      const balance = await env.clients.chronicleYellowstonePublicClient.getBalance({
        address: env.accounts.appDelegatee.address,
      });

      expect(balance).toBeGreaterThan(0n);
    });
  });

  describe('Ethers Wallets Integration', () => {
    it('should have ethers wallet for funder', () => {
      expect(env.ethersWallets.funder).toBeDefined();
      expect(env.ethersWallets.funder.address).toBe(env.accounts.funder.address);
    });

    it('should have ethers wallet for app manager', () => {
      expect(env.ethersWallets.appManager).toBeDefined();
      expect(env.ethersWallets.appManager.address).toBe(env.accounts.appManager.address);
    });

    it('should have ethers wallet for app delegatee', () => {
      expect(env.ethersWallets.appDelegatee).toBeDefined();
      expect(env.ethersWallets.appDelegatee.address).toBe(env.accounts.appDelegatee.address);
    });

    it('should have ethers wallet for user EOA', () => {
      expect(env.ethersWallets.userEoa).toBeDefined();
      expect(env.ethersWallets.userEoa.address).toBe(env.accounts.userEoa.address);
    });

    it('should have working ethers provider connection', async () => {
      const blockNumber = await env.ethersWallets.funder.provider?.getBlockNumber();
      expect(blockNumber).toBeGreaterThan(0);
    });
  });

  describe('Public Clients', () => {
    it('should have Vincent Registry public client', () => {
      expect(env.clients.vincentRegistryPublicClient).toBeDefined();
    });

    it('should have Chronicle Yellowstone public client', () => {
      expect(env.clients.chronicleYellowstonePublicClient).toBeDefined();
    });

    it('should have working Vincent Registry RPC connection', async () => {
      const blockNumber = await env.clients.vincentRegistryPublicClient.getBlockNumber();
      expect(blockNumber).toBeGreaterThan(0n);
    });

    it('should have working Chronicle Yellowstone RPC connection', async () => {
      const blockNumber = await env.clients.chronicleYellowstonePublicClient.getBlockNumber();
      expect(blockNumber).toBeGreaterThan(0n);
    });
  });

  describe('Integration Checks', () => {
    it('should have PKP and smart account addresses that are different', () => {
      expect(env.agentSmartAccount!.agentSignerAddress).not.toBe(env.agentSmartAccount!.address);
      expect(env.agentSmartAccount!.agentSignerAddress).not.toBe(env.accounts.userEoa.address);
    });

    it('should have smart account different from user EOA', () => {
      expect(env.agentSmartAccount!.address.toLowerCase()).not.toBe(
        env.accounts.userEoa.address.toLowerCase(),
      );
    });

    it('should have all required environment properties defined', () => {
      expect(env.vincentRegistryRpcUrl).toBeDefined();
      expect(env.vincentRegistryChain).toBeDefined();
      expect(env.appId).toBeDefined();
      expect(env.appVersion).toBeDefined();
      expect(env.accountIndexHash).toBeDefined();
      expect(env.accounts).toBeDefined();
      expect(env.ethersWallets).toBeDefined();
      expect(env.clients).toBeDefined();
      expect(env.agentSmartAccount!).toBeDefined();
    });

    it('should have correct chain ID for Vincent Registry', () => {
      expect(env.vincentRegistryChain.id).toBe(VINCENT_REGISTRY_CHAIN_ID);
      expect(env.vincentRegistryChain.name).toBe(vincentRegistryChain.name);
    });
  });

  describe('Summary', () => {
    it('should print complete environment summary', () => {
      console.log('Vincent Development Environment Summary:');
      console.table({
        'App ID': env.appId,
        'App Version': env.appVersion,
        'Account Index Hash': env.accountIndexHash || 'N/A',
        Funder: env.accounts.funder.address,
        'App Manager': env.accounts.appManager.address,
        'App Delegatee': env.accounts.appDelegatee.address,
        'User EOA': env.accounts.userEoa.address,
        'Agent Signer Address': env.agentSmartAccount!.agentSignerAddress,
        'Agent Smart Account Address': env.agentSmartAccount!.address,
        'Smart Account Deployment Tx':
          env.agentSmartAccount!.deploymentTxHash || 'N/A (already installed)',
        'Serialized Permission Account': env.agentSmartAccount!.serializedPermissionAccount
          ? env.agentSmartAccount!.serializedPermissionAccount.substring(0, 50) + '...'
          : 'N/A (already installed)',
        'Permit App Version Tx':
          env.agentSmartAccount!.permitAppVersionTxHash || 'N/A (already installed)',
        'Vincent Registry Chain': `${vincentRegistryChain.name} (${vincentRegistryChain.id})`,
        'Smart Account Chain': `${smartAccountChain.name} (${smartAccountChain.id})`,
      });

      expect(true).toBe(true); // Always pass to show summary
    });
  });
});
