import { createPublicClient, formatEther, http, parseEther, toHex, erc20Abi } from 'viem';
import { base, baseSepolia, arbitrum } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';
import * as util from 'node:util';
import {
  setupVincentDevelopmentEnvironment,
  type VincentDevEnvironment,
  getEnv,
  deploySmartAccountToChain,
  ensureWalletHasTokens,
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

jest.setTimeout(300000); // 5 minutes

// Test configuration from environment variables (required)
const BASE_SEPOLIA_RPC_URL = getEnv('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org');
const BASE_MAINNET_RPC_URL = getEnv('BASE_MAINNET_RPC_URL', 'https://mainnet.base.org');
const ARB_MAINNET_RPC_URL = getEnv('ARB_MAINNET_RPC_URL', 'https://1rpc.io/arb');
const VINCENT_API_URL = getEnv('VINCENT_API_URL', 'https://api.heyvincent.ai');
const ZERODEV_PROJECT_ID = getEnv('ZERODEV_PROJECT_ID');
const TEST_FUNDER_PRIVATE_KEY = getEnv('TEST_FUNDER_PRIVATE_KEY');
const TEST_APP_MANAGER_PRIVATE_KEY = getEnv('TEST_APP_MANAGER_PRIVATE_KEY');
const TEST_APP_DELEGATEE_PRIVATE_KEY = getEnv('TEST_APP_DELEGATEE_PRIVATE_KEY');
const TEST_USER_EOA_PRIVATE_KEY = getEnv('TEST_USER_EOA_PRIVATE_KEY');

// Vincent setup uses Base Sepolia (where the registry lives)
const REGISTRY_CHAIN = baseSepolia;

// Base Mainnet configuration
const BASE_CHAIN = base;
const BASE_ZERODEV_RPC_URL = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/${BASE_CHAIN.id}`;

// Arbitrum Mainnet configuration
const ARB_CHAIN = arbitrum;
const ARB_ZERODEV_RPC_URL = `https://rpc.zerodev.app/api/v3/${ZERODEV_PROJECT_ID}/chain/${ARB_CHAIN.id}`;

const BASE_MAINNET_SMART_ACCOUNT_FUND_AMOUNT_BEFORE_DEPLOYMENT = parseEther('0.0001');
const BASE_MAINNET_SMART_ACCOUNT_MIN_BALANCE = parseEther('0.00005');
const ARB_MAINNET_SMART_ACCOUNT_FUND_AMOUNT_BEFORE_DEPLOYMENT = parseEther('0.0006');
const ARB_MAINNET_SMART_ACCOUNT_MIN_BALANCE = parseEther('0.0006');

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Base Mainnet USDC
const ARB_USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'; // Arbitrum Mainnet USDC

describe('Bridge ETH from Base to USDC on Arbitrum and back', () => {
  let env: VincentDevEnvironment;
  let baseMainnetPermissionApproval: string;
  let arbMainnetPermissionApproval: string;

  beforeAll(async () => {
    // Setup Vincent development environment with relay.link ability
    // Uses Base Sepolia for registry, smart account will operate on Base Mainnet and Arbitrum Mainnet
    env = await setupVincentDevelopmentEnvironment({
      vincentRegistryRpcUrl: BASE_SEPOLIA_RPC_URL,
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
        name: 'Relay.link Cross-Chain E2E Test App',
        description: 'Test app for relay.link cross-chain bridging with smart accounts',
        contactEmail: 'test@example.com',
        appUrl: 'https://example.com',
        deploymentStatus: 'dev',
      },
    });

    // Deploy smart account on Base Mainnet with permission plugin enabled
    console.log('Deploying smart account on Base Mainnet...');
    const baseDeployment = await deploySmartAccountToChain({
      userEoaPrivateKey: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
      agentSignerAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
      accountIndexHash: env.accountIndexHash as string,
      targetChain: BASE_CHAIN as any,
      targetChainRpcUrl: BASE_MAINNET_RPC_URL,
      zerodevProjectId: ZERODEV_PROJECT_ID,
      funderPrivateKey: TEST_FUNDER_PRIVATE_KEY as `0x${string}`,
      fundAmountBeforeDeployment: BASE_MAINNET_SMART_ACCOUNT_FUND_AMOUNT_BEFORE_DEPLOYMENT,
    });

    baseMainnetPermissionApproval = baseDeployment.serializedPermissionAccount;

    // Ensure Base smart account has sufficient balance
    await ensureWalletHasTokens({
      address: env.agentSmartAccount.address as `0x${string}`,
      funderWalletClient: env.accounts.funder as any,
      publicClient: createPublicClient({
        chain: BASE_CHAIN as any,
        transport: http(BASE_MAINNET_RPC_URL),
      }) as any,
      minAmount: BASE_MAINNET_SMART_ACCOUNT_MIN_BALANCE,
    });

    // Deploy smart account on Arbitrum Mainnet with permission plugin enabled
    console.log('Deploying smart account on Arbitrum Mainnet...');
    const arbDeployment = await deploySmartAccountToChain({
      userEoaPrivateKey: TEST_USER_EOA_PRIVATE_KEY as `0x${string}`,
      agentSignerAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
      accountIndexHash: env.accountIndexHash as string,
      targetChain: ARB_CHAIN as any,
      targetChainRpcUrl: ARB_MAINNET_RPC_URL,
      zerodevProjectId: ZERODEV_PROJECT_ID,
      funderPrivateKey: TEST_FUNDER_PRIVATE_KEY as `0x${string}`,
      fundAmountBeforeDeployment: ARB_MAINNET_SMART_ACCOUNT_FUND_AMOUNT_BEFORE_DEPLOYMENT,
    });

    arbMainnetPermissionApproval = arbDeployment.serializedPermissionAccount;

    // Ensure Arbitrum smart account has sufficient balance
    await ensureWalletHasTokens({
      address: env.agentSmartAccount.address as `0x${string}`,
      funderWalletClient: env.accounts.funder as any,
      publicClient: createPublicClient({
        chain: ARB_CHAIN as any,
        transport: http(ARB_MAINNET_RPC_URL),
      }) as any,
      minAmount: ARB_MAINNET_SMART_ACCOUNT_MIN_BALANCE,
    });

    console.log('[Smart Account Setup Complete]', {
      address: env.agentSmartAccount.address,
      pkpSigner: env.agentSmartAccount.agentSignerAddress,
      baseChain: `${BASE_CHAIN.name} (${BASE_CHAIN.id})`,
      arbChain: `${ARB_CHAIN.name} (${ARB_CHAIN.id})`,
    });
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe('Smart Account Setup', () => {
    it('should have smart account deployed on Base Mainnet', async () => {
      const provider = createPublicClient({
        chain: BASE_CHAIN,
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
        chain: `${BASE_CHAIN.name} (${BASE_CHAIN.id})`,
        codeLength: code?.length,
      });
    });

    it('should have smart account deployed on Arbitrum Mainnet', async () => {
      const provider = createPublicClient({
        chain: ARB_CHAIN,
        transport: http(ARB_MAINNET_RPC_URL),
      });
      const code = await provider.getCode({
        address: env.agentSmartAccount.address as `0x${string}`,
      });

      expect(code).toBeDefined();
      expect(code).not.toBe('0x');
      expect(code?.length).toBeGreaterThan(2);

      console.log('[Smart Account Deployed on Arbitrum Mainnet]', {
        address: env.agentSmartAccount.address,
        chain: `${ARB_CHAIN.name} (${ARB_CHAIN.id})`,
        codeLength: code?.length,
      });
    });
  });

  describe.skip('Cross-Chain Bridge: Base ETH -> Arbitrum USDC', () => {
    it('should bridge ETH from Base to USDC on Arbitrum', async () => {
      const relayClient = getVincentAbilityClient({
        bundledVincentAbility: relayLinkAbility,
        ethersSigner: env.ethersWallets.appDelegatee,
        registryRpcUrl: env.vincentRegistryRpcUrl,
        debug: false,
      });

      // Create Arbitrum client to check USDC balance
      const arbClient = createPublicClient({
        chain: ARB_CHAIN,
        transport: http(ARB_MAINNET_RPC_URL),
      });

      // Get initial USDC balance on Arbitrum before the bridge
      const initialArbUsdcBalance = await arbClient.readContract({
        address: ARB_USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [env.agentSmartAccount.address],
      });

      console.log('[Initial Arbitrum USDC balance]', initialArbUsdcBalance.toString());

      // Get quote for ETH (Base) -> USDC (Arbitrum) cross-chain bridge
      const quote = await getRelayLinkQuote({
        user: env.agentSmartAccount.address,
        originChainId: BASE_CHAIN.id,
        destinationChainId: ARB_CHAIN.id,
        originCurrency: ETH_ADDRESS,
        destinationCurrency: ARB_USDC_ADDRESS,
        amount: parseEther('0.000034').toString(),
        tradeType: 'EXACT_INPUT',
        useReceiver: true,
        protocolVersion: 'preferV2',
      });

      console.log('[Base ETH -> Arb USDC Quote]', util.inspect(quote, { depth: 10 }));

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
        chain: BASE_CHAIN,
        zerodevRpcUrl: BASE_ZERODEV_RPC_URL,
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

      // // Collect all transactions from all steps
      // const allTransactions: Array<{
      //     to: `0x${string}`;
      //     data: `0x${string}`;
      //     value: string;
      // }> = [];

      // for (const step of quote.steps) {
      //     if (step.kind !== 'transaction') continue;

      //     for (const txItem of step.items || []) {
      //         if (!txItem?.data) continue;

      //         const txData = txItem.data;
      //         console.log('[Collecting cross-chain tx for batch]', {
      //             id: step.id,
      //             action: step.action,
      //             to: txData.to,
      //         });

      //         allTransactions.push({
      //             to: txData.to as `0x${string}`,
      //             data: txData.data as `0x${string}`,
      //             value: txData.value || '0',
      //         });
      //     }
      // }

      // console.log(`[Batching ${allTransactions.length} transactions into single UserOp]`);

      // // Convert all relay transactions to a single batched UserOp (on Base)
      // const userOp = await transactionsToZerodevUserOp({
      //     permittedAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
      //     serializedPermissionAccount: baseMainnetPermissionApproval,
      //     transactions: allTransactions,
      //     chain: BASE_CHAIN,
      //     zerodevRpcUrl: BASE_ZERODEV_RPC_URL,
      // });

      // console.log('[Prepared userOp]', util.inspect(userOp, { depth: 10 }));

      // // Convert numeric values to hex for the Vincent UserOp format
      // const hexUserOperation = Object.fromEntries(
      //     Object.entries(userOp).map(([key, value]) => {
      //         if (typeof value === 'number' || typeof value === 'bigint') {
      //             return [key, toHex(value)];
      //         }
      //         return [key, value];
      //     }),
      // );

      // // Convert to Vincent UserOp format
      // const vincentUserOp = toVincentUserOp(hexUserOperation as any);

      // console.log('[Vincent userOp]', util.inspect(vincentUserOp, { depth: 10 }));

      const abilityParams = {
        alchemyRpcUrl: BASE_MAINNET_RPC_URL,
        userOp: vincentUserOp,
        entryPointAddress: entryPoint07Address,
      } as any;

      const delegationContext = {
        delegatorPkpEthAddress: env.agentSmartAccount.agentSignerAddress,
        agentAddress: env.agentSmartAccount.address as `0x${string}`,
      };

      // Precheck the UserOp (runs simulation)
      const precheckResult = await relayClient.precheck(abilityParams, delegationContext);

      console.log('[Precheck result]', util.inspect(precheckResult, { depth: 10 }));

      expect(precheckResult).toBeDefined();

      if (precheckResult.success === false) {
        console.error('[Precheck FAILED]', precheckResult.runtimeError);
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.success).toBe(true);

      // Execute the ability to get the signature
      const executeResult = await relayClient.execute(abilityParams, delegationContext);

      console.log('[Execute result]', util.inspect(executeResult, { depth: 10 }));

      expect(executeResult).toBeDefined();
      expect(executeResult.success).toBe(true);

      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      // Verify we got a signature back
      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.signature).toBeDefined();
      expect(executeResult.result.signature).toMatch(/^0x[a-fA-F0-9]+$/);

      // Submit the signed UserOp to the bundler (on Base)
      const { userOpHash, transactionHash } = await submitSignedUserOp({
        permittedAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
        serializedPermissionAccount: baseMainnetPermissionApproval,
        userOpSignature: executeResult.result.signature,
        userOp: hexUserOperation,
        chain: BASE_CHAIN,
        zerodevRpcUrl: BASE_ZERODEV_RPC_URL,
      });

      console.log('[Cross-chain bridge completed from smart account]', {
        userOpHash,
        transactionHash,
        txUrl: `https://basescan.org/tx/${transactionHash}`,
        smartAccountAddress: env.agentSmartAccount.address,
        signerPkp: env.agentSmartAccount.agentSignerAddress,
      });

      expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Wait for cross-chain bridging to complete and verify USDC balance increased on Arbitrum
      console.log('[Waiting for cross-chain bridging to complete...]');

      const maxRetries = 12; // Increase retries for cross-chain
      const retryDelayMs = 10000; // 10 seconds between retries
      let finalArbUsdcBalance = initialArbUsdcBalance;

      for (let i = 0; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));

        finalArbUsdcBalance = await arbClient.readContract({
          address: ARB_USDC_ADDRESS,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [env.agentSmartAccount.address],
        });

        console.log(
          `[Retry ${i + 1}/${maxRetries}] Arbitrum USDC balance: ${finalArbUsdcBalance.toString()}`,
        );

        if (finalArbUsdcBalance > initialArbUsdcBalance) {
          console.log('[Cross-chain bridging completed - balance increased]');
          break;
        }
      }

      // Verify the USDC balance on Arbitrum increased
      expect(finalArbUsdcBalance).toBeGreaterThan(initialArbUsdcBalance);
      console.log('[Arbitrum USDC balance verification]', {
        initial: initialArbUsdcBalance.toString(),
        final: finalArbUsdcBalance.toString(),
        increase: (finalArbUsdcBalance - initialArbUsdcBalance).toString(),
      });

      console.log('[Cross-chain bridge Base ETH -> Arbitrum USDC completed successfully]');
    });
  });

  describe.skip('Cross-Chain Bridge: Arbitrum USDC -> Base ETH', () => {
    it('should bridge USDC from Arbitrum back to ETH on Base', async () => {
      const relayClient = getVincentAbilityClient({
        bundledVincentAbility: relayLinkAbility,
        ethersSigner: env.ethersWallets.appDelegatee,
        registryRpcUrl: env.vincentRegistryRpcUrl,
        debug: false,
      });

      const smartAccountAddress = env.agentSmartAccount.address;

      // Create Base client to check ETH balance
      const baseClient = createPublicClient({
        chain: BASE_CHAIN,
        transport: http(BASE_MAINNET_RPC_URL),
      });

      // Get initial ETH balance on Base before the bridge
      const initialBaseEthBalance = await baseClient.getBalance({
        address: smartAccountAddress as `0x${string}`,
      });

      console.log('[Initial Base ETH balance]', formatEther(initialBaseEthBalance));

      // Get quote for USDC (Arbitrum) -> ETH (Base) cross-chain bridge
      const quote = await getRelayLinkQuote({
        user: smartAccountAddress,
        originChainId: ARB_CHAIN.id,
        destinationChainId: BASE_CHAIN.id,
        originCurrency: ARB_USDC_ADDRESS,
        destinationCurrency: ETH_ADDRESS,
        amount: '10000', // 0.01 USDC (6 decimals)
        tradeType: 'EXACT_INPUT',
        useReceiver: true,
        protocolVersion: 'preferV2',
      });

      console.log('[Arb USDC -> Base ETH Quote]', util.inspect(quote, { depth: 10 }));

      expect(quote.steps).toBeDefined();
      expect(quote.steps.length).toBeGreaterThan(0);

      // Collect all transactions from all steps (may include approval + bridge)
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
          console.log('[Collecting cross-chain tx for batch]', {
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

      // Convert all relay transactions to a single batched UserOp (on Arbitrum)
      const userOp = await transactionsToZerodevUserOp({
        permittedAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
        serializedPermissionAccount: arbMainnetPermissionApproval,
        transactions: allTransactions,
        chain: ARB_CHAIN,
        zerodevRpcUrl: ARB_ZERODEV_RPC_URL,
      });

      console.log('[Prepared userOp]', util.inspect(userOp, { depth: 10 }));

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

      console.log('[Vincent userOp]', util.inspect(vincentUserOp, { depth: 10 }));

      const abilityParams = {
        alchemyRpcUrl: ARB_MAINNET_RPC_URL,
        userOp: vincentUserOp,
        entryPointAddress: entryPoint07Address,
      } as any;

      const delegationContext = {
        delegatorPkpEthAddress: env.agentSmartAccount.agentSignerAddress,
        agentAddress: env.agentSmartAccount.address as `0x${string}`,
      };

      // Precheck the UserOp (runs simulation)
      const precheckResult = await relayClient.precheck(abilityParams, delegationContext);

      console.log('[Precheck result]', util.inspect(precheckResult, { depth: 10 }));

      expect(precheckResult).toBeDefined();

      if (precheckResult.success === false) {
        console.error('[Precheck FAILED]', precheckResult.runtimeError);
        throw new Error(precheckResult.runtimeError);
      }

      expect(precheckResult.success).toBe(true);

      // Execute the ability to get the signature
      const executeResult = await relayClient.execute(abilityParams, delegationContext);

      console.log('[Execute result]', util.inspect(executeResult, { depth: 10 }));

      expect(executeResult).toBeDefined();
      expect(executeResult.success).toBe(true);

      if (executeResult.success === false) {
        throw new Error(executeResult.runtimeError);
      }

      // Verify we got a signature back
      expect(executeResult.result).toBeDefined();
      expect(executeResult.result.signature).toBeDefined();
      expect(executeResult.result.signature).toMatch(/^0x[a-fA-F0-9]+$/);

      // Submit the signed UserOp to the bundler (on Arbitrum)
      const { userOpHash, transactionHash } = await submitSignedUserOp({
        permittedAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
        serializedPermissionAccount: arbMainnetPermissionApproval,
        userOpSignature: executeResult.result.signature,
        userOp: hexUserOperation,
        chain: ARB_CHAIN,
        zerodevRpcUrl: ARB_ZERODEV_RPC_URL,
      });

      console.log('[Cross-chain bridge completed from smart account]', {
        userOpHash,
        transactionHash,
        txUrl: `https://arbiscan.io/tx/${transactionHash}`,
        smartAccountAddress: env.agentSmartAccount.address,
        signerPkp: env.agentSmartAccount.agentSignerAddress,
      });

      expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Wait for cross-chain bridging to complete and verify ETH balance increased on Base
      console.log('[Waiting for cross-chain bridging to complete...]');

      const maxRetries = 12; // Increase retries for cross-chain
      const retryDelayMs = 10000; // 10 seconds between retries
      let finalBaseEthBalance = initialBaseEthBalance;

      for (let i = 0; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));

        finalBaseEthBalance = await baseClient.getBalance({
          address: smartAccountAddress as `0x${string}`,
        });

        console.log(
          `[Retry ${i + 1}/${maxRetries}] Base ETH balance: ${formatEther(finalBaseEthBalance)}`,
        );

        if (finalBaseEthBalance > initialBaseEthBalance) {
          console.log('[Cross-chain bridging completed - balance increased]');
          break;
        }
      }

      // Verify the ETH balance on Base increased
      expect(finalBaseEthBalance).toBeGreaterThan(initialBaseEthBalance);
      console.log('[Base ETH balance verification]', {
        initial: formatEther(initialBaseEthBalance),
        final: formatEther(finalBaseEthBalance),
        increase: formatEther(finalBaseEthBalance - initialBaseEthBalance),
      });

      console.log('[Cross-chain bridge Arbitrum USDC -> Base ETH completed successfully]');
    });
  });
});
