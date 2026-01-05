import {
  setupVincentDevelopmentEnvironment,
  getEnv,
  type PkpInfo,
  type VincentDevEnvironment,
  type ZerodevSmartAccountInfo,
} from '@lit-protocol/vincent-e2e-test-utils';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import * as util from 'node:util';
import { toHex } from 'viem';
import { base } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';

import {
  bundledVincentAbility as relayLinkAbility,
  getRelayLinkQuote,
  toVincentUserOp,
  relayTransactionToUserOp,
  transactionsToZerodevUserOp,
  submitSignedUserOp,
} from '../../../src';

jest.setTimeout(300000);

// Check for required environment variables for smart account testing
const ZERODEV_RPC_URL = process.env.ZERODEV_RPC_URL;
const SMART_ACCOUNT_CHAIN_ID = process.env.SMART_ACCOUNT_CHAIN_ID;
const hasRequiredEnvVars = ZERODEV_RPC_URL && SMART_ACCOUNT_CHAIN_ID;

(hasRequiredEnvVars ? describe : describe.skip)(
  'Relay.link Ability E2E Tests (ZeroDev Smart Account)',
  () => {
    const ENV = getEnv();

    let agentPkpInfo: PkpInfo;
    let wallets: VincentDevEnvironment['wallets'];
    let smartAccount: ZerodevSmartAccountInfo;

    beforeAll(async () => {
      const PERMISSION_DATA = {
        [relayLinkAbility.ipfsCid]: {},
      };

      const setupResult = await setupVincentDevelopmentEnvironment({
        permissionData: PERMISSION_DATA,
        smartAccountType: 'zerodev',
      });

      agentPkpInfo = setupResult.agentPkpInfo;
      wallets = setupResult.wallets;
      smartAccount = setupResult.smartAccount as ZerodevSmartAccountInfo;

      console.log('[Smart Account Setup]', {
        agentPkpAddress: agentPkpInfo.ethAddress,
        smartAccountAddress: smartAccount.account.address,
      });
    });

    afterAll(async () => {
      await disconnectVincentAbilityClients();
    });

    describe('Smart Account Setup', () => {
      it('should have created a ZeroDev smart account', () => {
        expect(smartAccount).toBeDefined();
        expect(smartAccount.account).toBeDefined();
        expect(smartAccount.account.address).toBeDefined();
        expect(smartAccount.account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        expect(smartAccount.serializedPermissionAccount).toBeDefined();
        expect(typeof smartAccount.serializedPermissionAccount).toBe('string');

        console.log(
          '[ZeroDev Smart Account]',
          util.inspect(
            {
              address: smartAccount.account.address,
              hasSerializedPermissionAccount: true,
            },
            { depth: 5 },
          ),
        );
      });
    });

    describe('Get Quote from Relay.link', () => {
      it('should successfully get a quote for the smart account address', async () => {
        // Use the SMART ACCOUNT address as the user, not the PKP
        const userAddress = smartAccount.account.address;

        // Get quote for ETH -> USDC swap on Base
        const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
        const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

        const quote = await getRelayLinkQuote({
          user: userAddress,
          originChainId: 8453,
          destinationChainId: 8453,
          originCurrency: ETH_ADDRESS,
          destinationCurrency: USDC_ADDRESS,
          amount: '10000000000000', // 0.00001 ETH
          tradeType: 'EXACT_INPUT',
          useReceiver: true,
          protocolVersion: 'preferV2',
          // appFees: [{ recipient: '0x2998657a1C195B3D9909cB51dB3E57836159732C', fee: '100' }], // TODO: Replace with app owner + Lit Protocol central account
        });

        console.log('[should successfully get a quote]', util.inspect(quote, { depth: 10 }));

        expect(quote).toBeDefined();
        expect(quote.steps).toBeDefined();
        expect(quote.steps.length).toBeGreaterThan(0);
      });
    });

    describe('Execute Relay.link Transaction from Smart Account', () => {
      it('should build, sign, and execute a UserOp from the smart account', async () => {
        const relayClient = getVincentAbilityClient({
          bundledVincentAbility: relayLinkAbility,
          ethersSigner: wallets.appDelegatee,
          debug: false,
        });

        // Use the SMART ACCOUNT address as the user
        const smartAccountAddress = smartAccount.account.address;

        // Get quote for ETH -> USDC swap on Base from the smart account
        const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
        const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

        const quote = await getRelayLinkQuote({
          user: smartAccountAddress,
          originChainId: 8453,
          destinationChainId: 8453,
          originCurrency: ETH_ADDRESS,
          destinationCurrency: USDC_ADDRESS,
          amount: '10000000000000', // 0.00001 ETH
          tradeType: 'EXACT_INPUT',
          useReceiver: true,
          protocolVersion: 'preferV2',
          // appFees: [{ recipient: '0x2998657a1C195B3D9909cB51dB3E57836159732C', fee: '100' }], // TODO: Replace with app owner + Lit Protocol central account
        });

        expect(quote.steps).toBeDefined();
        expect(quote.steps.length).toBeGreaterThan(0);

        // Find the transaction step
        const txStep = quote.steps.find((step: any) => step.kind === 'transaction');
        expect(txStep).toBeDefined();

        const txItem = txStep?.items?.[0];
        expect(txItem?.data).toBeDefined();

        const txData = txItem!.data;

        console.log('[relay quote tx data]', util.inspect(txData, { depth: 10 }));

        // Convert the relay transaction to a UserOp using the smart account
        const userOp = await relayTransactionToUserOp({
          permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
          serializedPermissionAccount: smartAccount.serializedPermissionAccount,
          transaction: {
            to: txData.to as `0x${string}`,
            data: txData.data as `0x${string}`,
            value: txData.value || '0',
            chainId: txData.chainId,
            from: smartAccountAddress,
          },
          chain: base,
          zerodevRpcUrl: ZERODEV_RPC_URL!,
        });

        console.log('[prepared userOp - raw]', util.inspect(userOp, { depth: 10 }));

        // Check if paymaster data exists
        console.log('[paymaster fields]', {
          paymaster: userOp.paymaster,
          paymasterData: userOp.paymasterData,
          paymasterVerificationGasLimit: userOp.paymasterVerificationGasLimit,
          paymasterPostOpGasLimit: userOp.paymasterPostOpGasLimit,
          maxFeePerGas: userOp.maxFeePerGas,
          maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
        });

        // Convert numeric values to hex for the Vincent UserOp format
        const hexUserOperation = Object.fromEntries(
          Object.entries(userOp).map(([key, value]) => {
            if (typeof value === 'number' || typeof value === 'bigint') {
              return [key, toHex(value)];
            }
            return [key, value];
          }),
        );

        console.log('[hex userOp]', util.inspect(hexUserOperation, { depth: 10 }));

        // Convert to Vincent UserOp format
        const vincentUserOp = toVincentUserOp(hexUserOperation as any);

        console.log('[vincent userOp]', util.inspect(vincentUserOp, { depth: 10 }));

        const abilityParams = {
          alchemyRpcUrl: ENV.ALCHEMY_RPC_URL!,
          userOp: vincentUserOp,
          entryPointAddress: entryPoint07Address,
        } as any;

        const delegationContext = {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        };

        // Precheck the UserOp (runs simulation)
        const precheckResult = await relayClient.precheck(abilityParams, delegationContext);

        console.log('[precheck result]', util.inspect(precheckResult, { depth: 10 }));

        expect(precheckResult).toBeDefined();
        expect(precheckResult.success).toBe(true);

        if (precheckResult.success === false) {
          throw new Error(precheckResult.runtimeError);
        }

        // Execute the ability to get the signature
        const executeResult = await relayClient.execute(abilityParams, delegationContext);

        console.log('[execute result]', util.inspect(executeResult, { depth: 10 }));

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
        const { userOpHash, transactionHash } = await submitSignedUserOp({
          permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
          serializedPermissionAccount: smartAccount.serializedPermissionAccount,
          userOpSignature: executeResult.result.signature,
          userOp: hexUserOperation,
          chain: base,
          zerodevRpcUrl: ZERODEV_RPC_URL!,
        });

        console.log('[swap completed from smart account]', {
          userOpHash,
          transactionHash,
          txUrl: `https://basescan.org/tx/${transactionHash}`,
          smartAccountAddress: smartAccount.account.address,
          signerPkp: agentPkpInfo.ethAddress,
        });

        expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      });
    });

    describe('Execute USDC -> ETH Transaction (ERC20 approval flow)', () => {
      it('should build, sign, and execute a USDC -> ETH UserOp with ERC20 approval', async () => {
        const relayClient = getVincentAbilityClient({
          bundledVincentAbility: relayLinkAbility,
          ethersSigner: wallets.appDelegatee,
          debug: false,
        });

        // Use the SMART ACCOUNT address as the user
        const smartAccountAddress = smartAccount.account.address;

        // Get quote for USDC -> ETH swap on Base (reverse of the other test)
        const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
        const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

        const quote = await getRelayLinkQuote({
          user: smartAccountAddress,
          originChainId: 8453,
          destinationChainId: 8453,
          originCurrency: USDC_ADDRESS, // Swapping FROM USDC
          destinationCurrency: ETH_ADDRESS, // TO ETH
          amount: '50000', // 0.05 USDC (6 decimals)
          tradeType: 'EXACT_INPUT',
          useReceiver: true,
          protocolVersion: 'preferV2',
          // appFees: [{ recipient: '0x2998657a1C195B3D9909cB51dB3E57836159732C', fee: '100' }], // TODO: Replace with app owner + Lit Protocol central account
        });

        console.log('[USDC -> ETH quote]', util.inspect(quote, { depth: 10 }));

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
            console.log('[collecting tx for batch]', {
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

        console.log(`[batching ${allTransactions.length} transactions into single UserOp]`);

        // Convert all relay transactions to a single batched UserOp
        const userOp = await transactionsToZerodevUserOp({
          permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
          serializedPermissionAccount: smartAccount.serializedPermissionAccount,
          transactions: allTransactions,
          chain: base,
          zerodevRpcUrl: ZERODEV_RPC_URL!,
        });

        console.log('[prepared userOp]', util.inspect(userOp, { depth: 10 }));

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

        console.log('[vincent userOp]', util.inspect(vincentUserOp, { depth: 10 }));

        const abilityParams = {
          alchemyRpcUrl: ENV.ALCHEMY_RPC_URL!,
          userOp: vincentUserOp,
          entryPointAddress: entryPoint07Address,
        } as any;

        const delegationContext = {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        };

        // Precheck the UserOp (runs simulation)
        const precheckResult = await relayClient.precheck(abilityParams, delegationContext);

        console.log('[precheck result]', util.inspect(precheckResult, { depth: 10 }));

        expect(precheckResult).toBeDefined();
        expect(precheckResult.success).toBe(true);

        if (precheckResult.success === false) {
          throw new Error(precheckResult.runtimeError);
        }

        // Execute the ability to get the signature
        const executeResult = await relayClient.execute(abilityParams, delegationContext);

        console.log('[execute result]', util.inspect(executeResult, { depth: 10 }));

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
        const { userOpHash, transactionHash } = await submitSignedUserOp({
          permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
          serializedPermissionAccount: smartAccount.serializedPermissionAccount,
          userOpSignature: executeResult.result.signature,
          userOp: hexUserOperation,
          chain: base,
          zerodevRpcUrl: ZERODEV_RPC_URL!,
        });

        console.log('[USDC -> ETH swap completed from smart account]', {
          userOpHash,
          transactionHash,
          txUrl: `https://basescan.org/tx/${transactionHash}`,
        });

        expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      });
    });
  },
);
