import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import * as util from 'node:util';
import {
  setupVincentDevelopmentEnvironment,
  type VincentDevEnvironment,
  getEnv,
  ensureWalletHasTokens,
} from '@lit-protocol/vincent-e2e-test-utils';
import { disconnectVincentAbilityClients } from '@lit-protocol/vincent-app-sdk/abilityClient';

import { bundledVincentAbility as relayLinkAbility } from '../../src';

jest.setTimeout(300000); // 5 minutes

// Test configuration from environment variables (required)
const BASE_SEPOLIA_RPC_URL = getEnv('BASE_SEPOLIA_RPC_URL');
const BASE_MAINNET_RPC_URL = getEnv('BASE_MAINNET_RPC_URL');
const VINCENT_API_URL = getEnv('VINCENT_API_URL', 'https://api.heyvincent.ai');
const TEST_FUNDER_PRIVATE_KEY = getEnv('TEST_FUNDER_PRIVATE_KEY');
const TEST_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_APP_MANAGER_PRIVATE_KEY');
const TEST_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_APP_DELEGATEE_PRIVATE_KEY');
const TEST_USER_EOA_PRIVATE_KEY = getEnv('TEST_USER_EOA_PRIVATE_KEY');

const VINCENT_REGISTRY_RPC_URL = BASE_SEPOLIA_RPC_URL;
const VINCENT_REGISTRY_CHAIN = baseSepolia;

const SMART_ACCOUNT_CHAIN_RPC_URL = BASE_MAINNET_RPC_URL;
const SMART_ACCOUNT_CHAIN = base;

// Relay.link operations use Base Mainnet (for liquidity)
const RELAY_CHAIN = base;
const RELAY_CHAIN_ID = RELAY_CHAIN.id; // 8453

const BASE_MAINNET_SMART_ACCOUNT_MIN_BALANCE = parseEther('0.00005');
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC

describe('Swap ETH to USDC and back on Base Mainnet', () => {
  let env: VincentDevEnvironment;

  beforeAll(async () => {
    // Setup Vincent development environment with relay.link ability
    // Uses Base Sepolia for registry, smart account will operate on Base Mainnet
    env = await setupVincentDevelopmentEnvironment({
      vincentRegistryRpcUrl: VINCENT_REGISTRY_RPC_URL,
      vincentRegistryChain: VINCENT_REGISTRY_CHAIN as any,
      smartAccountChainRpcUrl: SMART_ACCOUNT_CHAIN_RPC_URL,
      smartAccountChain: SMART_ACCOUNT_CHAIN as any,
      vincentApiUrl: VINCENT_API_URL,
      privateKeys: {
        funder: TEST_FUNDER_PRIVATE_KEY as `0x${string}`,
        appManager: TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`,
        appDelegatee: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
        userEoa: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
      },
      abilityIpfsCids: [
        // relayLinkAbility.ipfsCid
        'QmUSDv7XougqNrpzjdryJEGibbnyRKWJjGTmptcYMr8oKk',
      ],
      abilityPolicies: [[]],
      appMetadata: {
        name: 'Relay.link E2E Test App',
        description: 'Test app for relay.link ability with smart accounts',
        contactEmail: 'test@example.com',
        appUrl: 'https://example.com',
        deploymentStatus: 'dev',
      },
      funding: {
        funder: {
          minAmountVincentRegistryChain: parseEther('0.0001'),
        },
        appManagerMinAmount: {
          minAmountVincentRegistryChain: parseEther('0.0009'),
        },
        userEoaMinAmount: {
          minAmountVincentRegistryChain: parseEther('0.0003'),
        },
      },
    });

    // Create a wallet client for the funder on Base Mainnet
    const baseMainnetFunderWalletClient = createWalletClient({
      account: env.accounts.funder as any,
      chain: RELAY_CHAIN,
      transport: http(BASE_MAINNET_RPC_URL),
    });

    await ensureWalletHasTokens({
      address: env.agentSmartAccount.address as `0x${string}`,
      funderWalletClient: baseMainnetFunderWalletClient as any,
      publicClient: createPublicClient({
        chain: RELAY_CHAIN as any,
        transport: http(BASE_MAINNET_RPC_URL),
      }) as any,
      minAmount: BASE_MAINNET_SMART_ACCOUNT_MIN_BALANCE,
    });
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe('Execute Relay.link Transaction via Batch API', () => {
    it('should execute ETH -> USDC swap via batch API', async () => {
      console.log('[Batch API Test] Starting ETH -> USDC swap');

      // Call the batch execution API
      const response = await fetch(`${VINCENT_API_URL}/app/relay-link/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delegateePrivateKey: TEST_APP_DELEGATEE_PRIVATE_KEY,
          defaults: {
            ORIGIN_CHAIN_ID: RELAY_CHAIN_ID,
            DESTINATION_CHAIN_ID: RELAY_CHAIN_ID,
            ORIGIN_CURRENCY: ETH_ADDRESS,
            DESTINATION_CURRENCY: USDC_ADDRESS,
            TRADE_TYPE: 'EXACT_INPUT',
          },
          delegators: [
            {
              delegatorAddress: env.accounts.userEoa.address,
              abilityParams: {
                AMOUNT: parseEther('0.00001').toString(), // 0.00001 ETH
              },
            },
          ],
        }),
      });

      expect(response.ok).toBe(true);
      const result = await response.json();

      console.log('[Batch API Response]', util.inspect(result, { depth: 10 }));

      expect(result.results).toBeDefined();
      expect(result.results[env.accounts.userEoa.address]).toBeDefined();

      const delegatorResult = result.results[env.accounts.userEoa.address];
      expect(delegatorResult.success).toBe(true);

      if (delegatorResult.success) {
        expect(delegatorResult.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(delegatorResult.userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

        console.log('[Swap Completed via Batch API]', {
          userOpHash: delegatorResult.userOpHash,
          transactionHash: delegatorResult.transactionHash,
          txUrl: `https://basescan.org/tx/${delegatorResult.transactionHash}`,
          smartAccountAddress: env.agentSmartAccount.address,
          signerPkp: env.agentSmartAccount.agentSignerAddress,
        });
      } else {
        throw new Error(`Execution failed: ${delegatorResult.error}`);
      }
    });

    it('should execute USDC -> ETH swap (reverse) via batch API', async () => {
      console.log('[Batch API Test] Starting USDC -> ETH swap (reverse)');

      // Call the batch execution API with reversed currencies
      const response = await fetch(`${VINCENT_API_URL}/app/relay-link/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          delegateePrivateKey: TEST_APP_DELEGATEE_PRIVATE_KEY,
          defaults: {
            ORIGIN_CHAIN_ID: RELAY_CHAIN_ID,
            DESTINATION_CHAIN_ID: RELAY_CHAIN_ID,
            ORIGIN_CURRENCY: USDC_ADDRESS, // Swapping FROM USDC
            DESTINATION_CURRENCY: ETH_ADDRESS, // Swapping TO ETH
            TRADE_TYPE: 'EXACT_INPUT',
          },
          delegators: [
            {
              delegatorAddress: env.accounts.userEoa.address,
              abilityParams: {
                AMOUNT: '10000', // 0.01 USDC (USDC has 6 decimals)
              },
            },
          ],
        }),
      });

      expect(response.ok).toBe(true);
      const result = await response.json();

      console.log('[Batch API Response (Reverse)]', util.inspect(result, { depth: 10 }));

      expect(result.results).toBeDefined();
      expect(result.results[env.accounts.userEoa.address]).toBeDefined();

      const delegatorResult = result.results[env.accounts.userEoa.address];
      expect(delegatorResult.success).toBe(true);

      if (delegatorResult.success) {
        expect(delegatorResult.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(delegatorResult.userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

        console.log('[Reverse Swap Completed via Batch API]', {
          userOpHash: delegatorResult.userOpHash,
          transactionHash: delegatorResult.transactionHash,
          txUrl: `https://basescan.org/tx/${delegatorResult.transactionHash}`,
          smartAccountAddress: env.agentSmartAccount.address,
          signerPkp: env.agentSmartAccount.agentSignerAddress,
        });
      } else {
        throw new Error(`Execution failed: ${delegatorResult.error}`);
      }
    });
  });

  describe('Smart Account Setup', () => {
    it('should have smart account deployed on Base Mainnet', async () => {
      const provider = createPublicClient({
        chain: RELAY_CHAIN,
        transport: http(BASE_MAINNET_RPC_URL),
      });
      const code = await provider.getCode({
        address: env.agentSmartAccount.address as `0x${string}`,
      });

      expect(code).toBeDefined();
      expect(code).not.toBe('0x');
      expect(code?.length).toBeGreaterThan(2);

      console.log('[Smart Account Deployed on Base Mainnet]', {
        address: env.agentSmartAccount.address,
        chain: `${RELAY_CHAIN.name} (${RELAY_CHAIN_ID})`,
        codeLength: code?.length,
      });
    });
  });
});
