import { createPublicClient, createWalletClient, formatEther, http, parseEther, toHex } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';
import * as util from 'node:util';
import {
  setupVincentDevelopmentEnvironment,
  type VincentDevEnvironment,
  getEnv,
  ensureWalletHasTokens,
  createPermissionApproval,
} from '@lit-protocol/vincent-e2e-test-utils';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';

import {
  bundledVincentAbility as relayLinkAbility,
  getRelayLinkQuote,
  transactionsToZerodevUserOp,
  submitSignedUserOp,
  toVincentUserOp,
  relayTransactionToUserOp,
} from '../../src';
import { tryDecodeKernelCalldataToLowLevelCalls } from '@lit-protocol/vincent-ability-sdk/gatedSigner';

jest.setTimeout(300000); // 5 minutes

// Test configuration from environment variables (required)
// const BASE_SEPOLIA_RPC_URL = getEnv('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org');
const BASE_MAINNET_RPC_URL = getEnv('BASE_MAINNET_RPC_URL', 'https://mainnet.base.org');
const VINCENT_API_URL = getEnv('VINCENT_API_URL', 'https://api.heyvincent.ai');
const ZERODEV_PROJECT_ID = getEnv('ZERODEV_PROJECT_ID');
const TEST_FUNDER_PRIVATE_KEY = getEnv('TEST_FUNDER_PRIVATE_KEY');
const TEST_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_APP_MANAGER_PRIVATE_KEY');
const TEST_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_APP_DELEGATEE_PRIVATE_KEY');
const TEST_USER_EOA_PRIVATE_KEY = getEnv('TEST_USER_EOA_PRIVATE_KEY');

// Vincent setup uses Base Sepolia (where the registry lives)
// const REGISTRY_CHAIN = baseSepolia;
const REGISTRY_CHAIN = base;

// Relay.link operations use Base Mainnet (for liquidity)
const RELAY_CHAIN = base;
const RELAY_CHAIN_ID = RELAY_CHAIN.id; // 8453
const ZERODEV_RPC_URL = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/${RELAY_CHAIN_ID}`;

const BASE_MAINNET_SMART_ACCOUNT_MIN_BALANCE = parseEther('0.00005');
const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC

describe('Swap ETH to USDC and back on Base Mainnet', () => {
  let env: VincentDevEnvironment;
  let baseMainnetPermissionApproval: string;

  beforeAll(async () => {
    // Setup Vincent development environment with relay.link ability
    // Uses Base Sepolia for registry, smart account will operate on Base Mainnet
    env = await setupVincentDevelopmentEnvironment({
      vincentRegistryRpcUrl: BASE_MAINNET_RPC_URL,
      vincentRegistryChain: REGISTRY_CHAIN as any,
      vincentApiUrl: VINCENT_API_URL,
      zerodevProjectId: ZERODEV_PROJECT_ID,
      privateKeys: {
        funder: TEST_FUNDER_PRIVATE_KEY as `0x${string}`,
        appManager: TEST_APP_MANAGER_PRIVATE_KEY as `0x${string}`,
        appDelegatee: TEST_APP_DELEGATEE_PRIVATE_KEY as `0x${string}`,
        userEoa: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
      },
      abilityIpfsCids: [relayLinkAbility.ipfsCid],
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
          minAmountVincentRegistryChain: parseEther('0.00071'),
        },
        userEoaMinAmount: {
          minAmountVincentRegistryChain: parseEther('0.0003'),
        },
      },
      smartAccountFundAmountBeforeDeployment: parseEther('0.00005'),
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

    baseMainnetPermissionApproval = await createPermissionApproval({
      userEoaPrivateKey: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
      sessionKeyAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
      accountIndexHash: env.accountIndexHash as string,
      targetChain: RELAY_CHAIN,
      targetChainRpcUrl: BASE_MAINNET_RPC_URL,
    });
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe.skip('Get Quote from Relay.link', () => {
    it('should successfully get a quote for the smart account address', async () => {
      const smartAccountAddress = env.agentSmartAccount.address;

      // Get quote for ETH -> USDC swap on Base Mainnet
      // Set recipient to funder so USDC goes directly to funder (no refund needed)
      const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
      const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC

      const quote = await getRelayLinkQuote({
        user: smartAccountAddress,
        recipient: env.accounts.funder.address, // Send USDC to funder
        originChainId: RELAY_CHAIN_ID,
        destinationChainId: RELAY_CHAIN_ID,
        originCurrency: ETH_ADDRESS,
        destinationCurrency: USDC_ADDRESS,
        amount: parseEther('0.00001').toString(),
        tradeType: 'EXACT_INPUT',
        useReceiver: true,
        protocolVersion: 'preferV2',
      });

      console.log('[Relay Quote]', util.inspect(quote, { depth: 10 }));

      expect(quote).toBeDefined();
      expect(quote.steps).toBeDefined();
      expect(quote.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Execute Relay.link Transaction from Smart Account', () => {
    it('should build, sign, and execute a UserOp for ETH -> USDC swap', async () => {
      // Create ability client with Base Sepolia registry RPC URL
      // The Vincent registry is deployed on Base Sepolia, even though the swap executes on Base Mainnet
      const relayClient = getVincentAbilityClient({
        bundledVincentAbility: relayLinkAbility,
        ethersSigner: env.ethersWallets.appDelegatee,
        registryRpcUrl: env.vincentRegistryRpcUrl,
        debug: false,
      });

      const quote = await getRelayLinkQuote({
        user: env.agentSmartAccount.address,
        originChainId: RELAY_CHAIN_ID,
        destinationChainId: RELAY_CHAIN_ID,
        originCurrency: ETH_ADDRESS,
        destinationCurrency: USDC_ADDRESS,
        amount: parseEther('0.00001').toString(),
        tradeType: 'EXACT_INPUT',
        useReceiver: true,
        protocolVersion: 'preferV2',
      });

      expect(quote.steps).toBeDefined();
      expect(quote.steps.length).toBeGreaterThan(0);

      // Find the transaction step
      const txStep = quote.steps.find((step: any) => step.kind === 'transaction');
      expect(txStep).toBeDefined();

      const txItem = txStep?.items?.[0];
      expect(txItem?.data).toBeDefined();

      const txData = txItem!.data;

      console.log('[Transaction Data]', util.inspect(txData, { depth: 10 }));

      // Convert the relay transaction to a UserOp using the smart account
      // Use Base Mainnet-specific permission approval since we're operating on Base Mainnet
      const userOp = await relayTransactionToUserOp({
        permittedAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
        serializedPermissionAccount: baseMainnetPermissionApproval,
        transaction: {
          to: txData.to as `0x${string}`,
          data: txData.data as `0x${string}`,
          value: txData.value || '0',
          chainId: txData.chainId,
          from: env.agentSmartAccount.address as `0x${string}`,
        },
        chain: RELAY_CHAIN,
        zerodevRpcUrl: ZERODEV_RPC_URL,
      });

      console.log('[UserOp]', util.inspect(userOp, { depth: 10 }));

      // Convert numeric values to hex for the Vincent UserOp format
      const hexUserOperation = Object.fromEntries(
        Object.entries(userOp).map(([key, value]) => {
          if (typeof value === 'number' || typeof value === 'bigint') {
            return [key, toHex(value)];
          }
          return [key, value];
        }),
      );

      // Convert to Vincent UserOp format
      const vincentUserOp = toVincentUserOp(hexUserOperation as any);

      console.log('[Vincent UserOp]', util.inspect(vincentUserOp, { depth: 10 }));

      // Sanity check: Test kernel calldata decoding BEFORE sending to Lit Action
      console.log('[Sanity Check] Testing kernel calldata decoding...');
      try {
        const decodedCalls = tryDecodeKernelCalldataToLowLevelCalls(
          vincentUserOp.callData as `0x${string}`,
        );
        if (decodedCalls) {
          console.log('[Sanity Check] ✓ Successfully decoded kernel calldata:', {
            numberOfCalls: decodedCalls.length,
            calls: decodedCalls.map((c) => ({
              to: c.to,
              value: c.value.toString(),
              dataLength: c.data.length,
            })),
          });
        } else {
          console.warn(
            '[Sanity Check] ⚠ Kernel calldata decoding returned null (might not be kernel format)',
          );
        }
      } catch (error) {
        console.error('[Sanity Check] ✗ Kernel calldata decoding failed:', error);
        throw new Error(
          `Kernel calldata decoding failed: ${error instanceof Error ? error.message : error}`,
        );
      }

      const abilityParams = {
        alchemyRpcUrl: BASE_MAINNET_RPC_URL,
        userOp: vincentUserOp,
        entryPointAddress: entryPoint07Address,
      } as any;

      // Precheck the UserOp (runs simulation)
      const precheckResult = await relayClient.precheck(abilityParams, {
        delegatorPkpEthAddress: env.agentSmartAccount.agentSignerAddress,
        agentAddress: env.agentSmartAccount.address as `0x${string}`,
      });

      console.log('[Precheck Result]', util.inspect(precheckResult, { depth: 10 }));

      expect(precheckResult).toBeDefined();
      expect(precheckResult.success).toBe(true);

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      // Execute the ability to get the signature
      const executeResult = await relayClient.execute(abilityParams, {
        delegatorPkpEthAddress: env.agentSmartAccount.agentSignerAddress,
        agentAddress: env.agentSmartAccount.address as `0x${string}`,
      });

      console.log('[Execute Result]', util.inspect(executeResult, { depth: 10 }));

      expect(executeResult).toBeDefined();
      expect(executeResult.success).toBe(true);

      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      // Verify we got a signature back
      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.signature).toBeDefined();
      expect(executeResult.result.signature).toMatch(/^0x[a-fA-F0-9]+$/);

      // Submit the signed UserOp to the bundler
      // Use Base Mainnet-specific permission approval since we're operating on Base Mainnet
      const { userOpHash, transactionHash } = await submitSignedUserOp({
        permittedAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
        serializedPermissionAccount: baseMainnetPermissionApproval,
        userOpSignature: executeResult.result.signature,
        userOp: hexUserOperation,
        chain: RELAY_CHAIN,
        zerodevRpcUrl: ZERODEV_RPC_URL,
      });

      console.log('[Swap Completed]', {
        userOpHash,
        transactionHash,
        txUrl: `https://basescan.org/tx/${transactionHash}`,
        smartAccountAddress: env.agentSmartAccount.address,
        signerPkp: env.agentSmartAccount.agentSignerAddress,
      });

      expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe.skip('Execute USDC -> ETH Transaction (ERC20 approval flow)', () => {
    it('should build, sign, and execute a USDC -> ETH UserOp with ERC20 approval', async () => {
      // Create ability client with Base Sepolia registry RPC URL
      // The Vincent registry is deployed on Base Sepolia, even though the swap executes on Base Mainnet
      const relayClient = getVincentAbilityClient({
        bundledVincentAbility: relayLinkAbility,
        ethersSigner: env.ethersWallets.appDelegatee,
        registryRpcUrl: env.vincentRegistryRpcUrl,
        debug: false,
      });

      const quote = await getRelayLinkQuote({
        user: env.agentSmartAccount.address,
        originChainId: RELAY_CHAIN_ID,
        destinationChainId: RELAY_CHAIN_ID,
        originCurrency: USDC_ADDRESS, // Swapping FROM USDC
        destinationCurrency: ETH_ADDRESS, // TO ETH
        amount: '10000', // 0.01 USDC (6 decimals)
        tradeType: 'EXACT_INPUT',
        useReceiver: true,
        protocolVersion: 'preferV2',
      });

      console.log('[USDC -> ETH Quote]', util.inspect(quote, { depth: 10 }));

      expect(quote.steps).toBeDefined();
      expect(quote.steps.length).toBeGreaterThan(0);

      // Collect all transactions from all steps (approval + swap batched together)
      const allTransactions: Array<{
        to: `0x${string}`;
        data: `0x${string}`;
        value: string;
      }> = [];

      for (const step of quote.steps) {
        if (step.kind !== 'transaction') continue;

        for (const txItem of step.items || []) {
          if (!txItem?.data) continue;

          const txData = txItem.data;
          console.log('[Collecting Transaction]', {
            id: step.id,
            action: step.action,
            to: txData.to,
          });

          allTransactions.push({
            to: txData.to as `0x${string}`,
            data: txData.data as `0x${string}`,
            value: txData.value || '0',
          });
        }
      }

      console.log(`[Batching ${allTransactions.length} transactions into single UserOp]`);

      // Convert all relay transactions to a single batched UserOp
      // Use Base Mainnet-specific permission approval since we're operating on Base Mainnet
      const userOp = await transactionsToZerodevUserOp({
        permittedAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
        serializedPermissionAccount: baseMainnetPermissionApproval,
        transactions: allTransactions,
        chain: RELAY_CHAIN,
        zerodevRpcUrl: ZERODEV_RPC_URL,
      });

      console.log('[UserOp]', util.inspect(userOp, { depth: 10 }));

      // Convert numeric values to hex for the Vincent UserOp format
      const hexUserOperation = Object.fromEntries(
        Object.entries(userOp).map(([key, value]) => {
          if (typeof value === 'number' || typeof value === 'bigint') {
            return [key, toHex(value)];
          }
          return [key, value];
        }),
      );

      // Convert to Vincent UserOp format
      const vincentUserOp = toVincentUserOp(hexUserOperation as any);

      console.log('[Vincent UserOp]', util.inspect(vincentUserOp, { depth: 10 }));

      // Sanity check: Test kernel calldata decoding BEFORE sending to Lit Action
      console.log('[Sanity Check] Testing kernel calldata decoding...');
      try {
        const decodedCalls = tryDecodeKernelCalldataToLowLevelCalls(
          vincentUserOp.callData as `0x${string}`,
        );
        if (decodedCalls) {
          console.log('[Sanity Check] ✓ Successfully decoded kernel calldata:', {
            numberOfCalls: decodedCalls.length,
            calls: decodedCalls.map((c) => ({
              to: c.to,
              value: c.value.toString(),
              dataLength: c.data.length,
            })),
          });
        } else {
          console.warn(
            '[Sanity Check] ⚠ Kernel calldata decoding returned null (might not be kernel format)',
          );
        }
      } catch (error) {
        console.error('[Sanity Check] ✗ Kernel calldata decoding failed:', error);
        throw new Error(
          `Kernel calldata decoding failed: ${error instanceof Error ? error.message : error}`,
        );
      }

      const abilityParams = {
        alchemyRpcUrl: BASE_MAINNET_RPC_URL,
        userOp: vincentUserOp,
        entryPointAddress: entryPoint07Address,
      } as any;

      const delegationContext = {
        delegatorPkpEthAddress: env.agentSmartAccount.agentSignerAddress,
      };

      // Precheck the UserOp (runs simulation)
      const precheckResult = await relayClient.precheck(abilityParams, {
        ...delegationContext,
        agentAddress: env.agentSmartAccount.address as `0x${string}`,
      });

      console.log('[Precheck Result]', util.inspect(precheckResult, { depth: 10 }));

      expect(precheckResult).toBeDefined();
      expect(precheckResult.success).toBe(true);

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      // Execute the ability to get the signature
      const executeResult = await relayClient.execute(abilityParams, {
        ...delegationContext,
        agentAddress: env.agentSmartAccount.address as `0x${string}`,
      });

      console.log('[Execute Result]', util.inspect(executeResult, { depth: 10 }));

      expect(executeResult).toBeDefined();
      expect(executeResult.success).toBe(true);

      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      // Verify we got a signature back
      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.signature).toBeDefined();
      expect(executeResult.result.signature).toMatch(/^0x[a-fA-F0-9]+$/);

      // Submit the signed UserOp to the bundler
      // Use Base Mainnet-specific permission approval since we're operating on Base Mainnet
      const { userOpHash, transactionHash } = await submitSignedUserOp({
        permittedAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
        serializedPermissionAccount: baseMainnetPermissionApproval,
        userOpSignature: executeResult.result.signature,
        userOp: hexUserOperation,
        chain: RELAY_CHAIN,
        zerodevRpcUrl: ZERODEV_RPC_URL,
      });

      console.log('[USDC -> ETH Swap Completed]', {
        userOpHash,
        transactionHash,
        txUrl: `https://basescan.org/tx/${transactionHash}`,
      });

      expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe.skip('Smart Account Setup', () => {
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
