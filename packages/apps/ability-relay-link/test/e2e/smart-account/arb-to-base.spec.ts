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
import { arbitrum } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';

import {
  bundledVincentAbility as relayLinkAbility,
  getRelayLinkQuote,
  toVincentUserOp,
  transactionsToZerodevUserOp,
  submitSignedUserOp,
} from '../../../src';

jest.setTimeout(300000);

// Check for required environment variables for smart account testing on Arbitrum
// NOTE: To run this test, configure ZERODEV_RPC_URL and SMART_ACCOUNT_CHAIN_ID for Arbitrum (42161)
const ZERODEV_RPC_URL = process.env.ZERODEV_RPC_URL;
const SMART_ACCOUNT_CHAIN_ID = process.env.SMART_ACCOUNT_CHAIN_ID;
const hasRequiredEnvVars = ZERODEV_RPC_URL && SMART_ACCOUNT_CHAIN_ID;

(hasRequiredEnvVars ? describe : describe.skip)(
  'Relay.link Cross-Chain E2E Tests - Arbitrum to Base (ZeroDev Smart Account)',
  () => {
    const ENV = getEnv();

    let agentPkpInfo: PkpInfo;
    let wallets: VincentDevEnvironment['wallets'];
    let smartAccount: ZerodevSmartAccountInfo;

    beforeAll(async () => {
      const PERMISSION_DATA = {
        [relayLinkAbility.ipfsCid]: {},
      };

      // Setup with smart account (chain determined by SMART_ACCOUNT_CHAIN_ID env var)
      const setupResult = await setupVincentDevelopmentEnvironment({
        permissionData: PERMISSION_DATA,
        smartAccountType: 'zerodev',
      });

      agentPkpInfo = setupResult.agentPkpInfo;
      wallets = setupResult.wallets;
      smartAccount = setupResult.smartAccount as ZerodevSmartAccountInfo;

      console.log('[ZeroDev Smart Account Setup on Arbitrum]', {
        agentPkpAddress: agentPkpInfo.ethAddress,
        smartAccountAddress: smartAccount.account.address,
      });
    });

    afterAll(async () => {
      await disconnectVincentAbilityClients();
    });

    describe('Cross-Chain USDC Swap (Arbitrum -> Base)', () => {
      it('should execute a cross-chain USDC swap from Arbitrum to Base', async () => {
        const relayClient = getVincentAbilityClient({
          bundledVincentAbility: relayLinkAbility,
          ethersSigner: wallets.appDelegatee,
          debug: false,
        });

        const smartAccountAddress = smartAccount.account.address;

        // USDC addresses on different chains
        const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
        const ARB_USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';

        const quote = await getRelayLinkQuote({
          user: smartAccountAddress,
          originChainId: 42161, // Arbitrum
          destinationChainId: 8453, // Base
          originCurrency: ARB_USDC_ADDRESS,
          destinationCurrency: BASE_USDC_ADDRESS,
          amount: '100000', // 0.10 USDC (6 decimals)
          tradeType: 'EXACT_INPUT',
          useReceiver: true,
          protocolVersion: 'preferV2',
          appFees: [{ recipient: '0x2998657a1C195B3D9909cB51dB3E57836159732C', fee: '100' }],
        });

        console.log('[cross-chain USDC quote Arb -> Base]', util.inspect(quote, { depth: 10 }));

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
            console.log('[collecting cross-chain tx for batch]', {
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

        // Convert all relay transactions to a single batched UserOp (on Arbitrum)
        const userOp = await transactionsToZerodevUserOp({
          permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
          serializedPermissionAccount: smartAccount.serializedPermissionAccount,
          transactions: allTransactions,
          chain: arbitrum,
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

        if (precheckResult.success === false) {
          console.error('[precheck FAILED]', precheckResult.runtimeError);
          throw new Error(precheckResult.runtimeError);
        }

        expect(precheckResult.success).toBe(true);

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

        // Submit the signed UserOp to the bundler (on Arbitrum)
        const { userOpHash, transactionHash } = await submitSignedUserOp({
          permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
          serializedPermissionAccount: smartAccount.serializedPermissionAccount,
          userOpSignature: executeResult.result.signature,
          userOp: hexUserOperation,
          chain: arbitrum,
          zerodevRpcUrl: ZERODEV_RPC_URL!,
        });

        console.log('[cross-chain swap completed from smart account]', {
          userOpHash,
          transactionHash,
          txUrl: `https://arbiscan.io/tx/${transactionHash}`,
          smartAccountAddress: smartAccount.account.address,
          signerPkp: agentPkpInfo.ethAddress,
        });

        expect(userOpHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

        console.log('[Cross-chain USDC swap Arbitrum -> Base completed successfully]');
      });
    });
  },
);
