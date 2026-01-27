import { createPublicClient, createWalletClient, http, parseEther, toHex } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';
import * as util from 'node:util';
import {
  setupVincentDevelopmentEnvironment,
  type VincentDevEnvironment,
  getEnv,
  ensureWalletHasTokens,
} from '@lit-protocol/vincent-e2e-test-utils';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import {
  createVincentViemPkpSigner,
  wrapKernelAccountWithUserOpCapture,
} from '@lit-protocol/vincent-app-sdk/utils';
import { deserializePermissionAccount } from '@zerodev/permissions';
import { toECDSASigner } from '@zerodev/permissions/signers';
import { createKernelAccountClient } from '@zerodev/sdk';
import { getEntryPoint, KERNEL_V3_3 } from '@zerodev/sdk/constants';

import {
  bundledVincentAbility as relayLinkAbility,
  getRelayLinkQuote,
  toVincentUserOp,
  relayTransactionToUserOp,
} from '../../src';

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
          minAmountVincentRegistryChain: parseEther('0.0009'),
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

    // Serialized permission account is already created by setupVincentDevelopmentEnvironment
    // and available at env.agentSmartAccount.serializedPermissionAccount
    console.log('[Setup] Using serialized permission account from Vincent API');
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  describe('Execute Relay.link Transaction from Smart Account', () => {
    it('should build, sign, and execute a UserOp for ETH -> USDC swap', async () => {
      // Create ability client
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

      const userOp = await relayTransactionToUserOp({
        permittedAddress: env.agentSmartAccount.agentSignerAddress as `0x${string}`,
        serializedPermissionAccount: env.agentSmartAccount.serializedPermissionAccount!,
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

      // Create public client for Base Mainnet
      const publicClient = createPublicClient({
        chain: RELAY_CHAIN,
        transport: http(BASE_MAINNET_RPC_URL),
      });
      console.log('[Precheck Result]', util.inspect(precheckResult, { depth: 10 }));
      expect(precheckResult).toBeDefined();
      expect(precheckResult.success).toBe(true);
      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      // Create PKP signer with callback that uses relay to sign
      const pkpSigner = createVincentViemPkpSigner({
        pkpAddress: env.agentSmartAccount.agentSignerAddress,
        onSignUserOpHash: async ({ userOpHash, userOp }) => {
          console.log('[PKP Signer] Signing UserOp via relay-link');
          console.log('[PKP Signer] UserOp hash:', userOpHash);
          console.log('[PKP Signer] UserOp from ZeroDev:', util.inspect(userOp, { depth: 10 }));

          // Use the UserOp from ZeroDev directly - don't recreate it!
          // Convert bigint values to hex first
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

          const signingAbilityParams = {
            alchemyRpcUrl: BASE_MAINNET_RPC_URL,
            userOp: vincentUserOp,
            entryPointAddress: entryPoint07Address,
          } as any;

          // Call relay to sign
          console.log('[PKP Signer] Executing to get signature...');
          const executeResult = await relayClient.execute(signingAbilityParams, {
            delegatorPkpEthAddress: env.agentSmartAccount.agentSignerAddress,
            agentAddress: env.agentSmartAccount.address as `0x${string}`,
          });

          console.log('[PKP Signer] Execute result:', util.inspect(executeResult, { depth: 10 }));

          if (!executeResult.success) {
            throw new Error(executeResult.runtimeError);
          }

          return executeResult.result.signature as `0x${string}`;
        },
      });

      // Create ECDSA signer from PKP signer
      const pkpEcdsaSigner = await toECDSASigner({ signer: pkpSigner as any });

      // Deserialize permission account
      const rawDeserializedAccount = await deserializePermissionAccount(
        publicClient,
        getEntryPoint('0.7'),
        KERNEL_V3_3,
        env.agentSmartAccount.serializedPermissionAccount!,
        pkpEcdsaSigner,
      );

      // Wrap account to intercept UserOps
      const deserializedAccount = wrapKernelAccountWithUserOpCapture(
        rawDeserializedAccount,
        pkpSigner,
      );

      // Create kernel client
      const kernelClient = createKernelAccountClient({
        account: deserializedAccount,
        chain: RELAY_CHAIN,
        bundlerTransport: http(ZERODEV_RPC_URL),
        client: publicClient,
      });

      console.log('[Kernel Client] Sending UserOperation...');

      // Send transaction - signing happens automatically via PKP signer callback!
      const userOpHash = await kernelClient.sendUserOperation({
        callData: await deserializedAccount.encodeCalls([
          {
            to: txData.to as `0x${string}`,
            value: BigInt(txData.value || '0'),
            data: txData.data as `0x${string}`,
          },
        ]),
      });

      console.log('[Kernel Client] UserOp hash:', userOpHash);

      // Wait for receipt
      const receipt = await kernelClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      const transactionHash = receipt.receipt.transactionHash;

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
