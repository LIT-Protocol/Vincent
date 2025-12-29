import {
  setupVincentDevelopmentEnvironment,
  getEnv,
  type PkpInfo,
  type VincentDevEnvironment,
  type CrossmintSmartAccountInfo,
} from '@lit-protocol/vincent-e2e-test-utils';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import * as util from 'node:util';
import { base } from 'viem/chains';
import { entryPoint07Address } from 'viem/account-abstraction';

import {
  bundledVincentAbility as relayLinkAbility,
  getRelayLinkQuote,
  toVincentUserOp,
  transactionsToCrossmintUserOp,
  sendPermittedCrossmintUserOperation,
} from '../../../src';

jest.setTimeout(300000);

// Check for required environment variables for Crossmint smart account testing
const CROSSMINT_API_KEY = process.env.CROSSMINT_API_KEY;
const SMART_ACCOUNT_CHAIN_ID = process.env.SMART_ACCOUNT_CHAIN_ID;
const hasRequiredEnvVars = CROSSMINT_API_KEY && SMART_ACCOUNT_CHAIN_ID;

(hasRequiredEnvVars ? describe : describe.skip)(
  'Relay.link Ability E2E Tests (Crossmint Smart Account)',
  () => {
    const ENV = getEnv();

    let agentPkpInfo: PkpInfo;
    let wallets: VincentDevEnvironment['wallets'];
    let smartAccount: CrossmintSmartAccountInfo;

    beforeAll(async () => {
      const PERMISSION_DATA = {
        [relayLinkAbility.ipfsCid]: {},
      };

      const setupResult = await setupVincentDevelopmentEnvironment({
        permissionData: PERMISSION_DATA,
        smartAccountType: 'crossmint',
      });

      agentPkpInfo = setupResult.agentPkpInfo;
      wallets = setupResult.wallets;
      smartAccount = setupResult.smartAccount as CrossmintSmartAccountInfo;

      console.log('[Crossmint Smart Account Setup]', {
        agentPkpAddress: agentPkpInfo.ethAddress,
        smartAccountAddress: smartAccount.account.address,
      });
    });

    afterAll(async () => {
      await disconnectVincentAbilityClients();
    });

    describe('Smart Account Setup', () => {
      it('should have created a Crossmint smart account', () => {
        expect(smartAccount).toBeDefined();
        expect(smartAccount.account).toBeDefined();
        expect(smartAccount.account.address).toBeDefined();
        expect(smartAccount.account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

        console.log(
          '[Crossmint Smart Account]',
          util.inspect(
            {
              address: smartAccount.account.address,
            },
            { depth: 5 },
          ),
        );
      });
    });

    describe('Get Quote from Relay.link', () => {
      it('should successfully get a quote for the smart account address', async () => {
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
          appFees: [{ recipient: '0x2998657a1C195B3D9909cB51dB3E57836159732C', fee: '100' }], // TODO: Replace with app owner + Lit Protocol central account
        });

        console.log('[should successfully get a quote]', util.inspect(quote, { depth: 10 }));

        expect(quote).toBeDefined();
        expect(quote.steps).toBeDefined();
        expect(quote.steps.length).toBeGreaterThan(0);
      });
    });

    describe('Execute Relay.link Transaction from Crossmint Smart Account', () => {
      it('should build, sign, and execute a UserOp from the smart account', async () => {
        const relayClient = getVincentAbilityClient({
          bundledVincentAbility: relayLinkAbility,
          ethersSigner: wallets.appDelegatee,
          debug: false,
        });

        const crossmintClient = smartAccount.client;
        const smartAccountAddress = smartAccount.account.address as `0x${string}`;

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
          appFees: [{ recipient: '0x2998657a1C195B3D9909cB51dB3E57836159732C', fee: '100' }],
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

        // Convert the relay transaction to a Crossmint UserOp
        const crossmintUserOp = await transactionsToCrossmintUserOp({
          crossmintClient,
          crossmintAccountAddress: smartAccountAddress,
          permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
          transactions: [
            {
              to: txData.to as `0x${string}`,
              data: txData.data as `0x${string}`,
              value: txData.value || '0',
            },
          ],
          chain: base,
        });

        console.log('[crossmint userOp]', util.inspect(crossmintUserOp, { depth: 10 }));

        // Get the userOperation from the Crossmint response for signing
        if (!('userOperationHash' in crossmintUserOp.onChain)) {
          throw new Error('Missing userOperationHash in Crossmint response');
        }

        const userOpForSigning = crossmintUserOp.onChain.userOperation;

        // Convert to Vincent UserOp format for the ability
        const vincentUserOp = toVincentUserOp(userOpForSigning as any);

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

        // Submit the signed UserOp via Crossmint
        const userOpHash = await sendPermittedCrossmintUserOperation({
          crossmintClient,
          accountAddress: smartAccountAddress,
          signature: executeResult.result.signature,
          signerAddress: agentPkpInfo.ethAddress as `0x${string}`,
          userOp: crossmintUserOp,
        });

        console.log('[swap completed from Crossmint smart account]', {
          userOpHash,
          smartAccountAddress,
          signerPkp: agentPkpInfo.ethAddress,
        });

        expect(userOpHash).toMatch(/^0x[a-fA-F0-9]+$/);

        // Wait for transaction to be included
        await new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));
      });
    });

    describe('Execute USDC -> ETH Transaction (ERC20 approval flow)', () => {
      it('should build, sign, and execute a USDC -> ETH UserOp with ERC20 approval', async () => {
        const relayClient = getVincentAbilityClient({
          bundledVincentAbility: relayLinkAbility,
          ethersSigner: wallets.appDelegatee,
          debug: false,
        });

        const crossmintClient = smartAccount.client;
        const smartAccountAddress = smartAccount.account.address as `0x${string}`;

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
          appFees: [{ recipient: '0x2998657a1C195B3D9909cB51dB3E57836159732C', fee: '100' }],
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

        // Convert all relay transactions to a single batched Crossmint UserOp
        const crossmintUserOp = await transactionsToCrossmintUserOp({
          crossmintClient,
          crossmintAccountAddress: smartAccountAddress,
          permittedAddress: agentPkpInfo.ethAddress as `0x${string}`,
          transactions: allTransactions,
          chain: base,
        });

        console.log('[crossmint userOp]', util.inspect(crossmintUserOp, { depth: 10 }));

        // Get the userOperation from the Crossmint response for signing
        if (!('userOperationHash' in crossmintUserOp.onChain)) {
          throw new Error('Missing userOperationHash in Crossmint response');
        }

        const userOpForSigning = crossmintUserOp.onChain.userOperation;

        // Convert to Vincent UserOp format for the ability
        const vincentUserOp = toVincentUserOp(userOpForSigning as any);

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

        // Submit the signed UserOp via Crossmint
        const userOpHash = await sendPermittedCrossmintUserOperation({
          crossmintClient,
          accountAddress: smartAccountAddress,
          signature: executeResult.result.signature,
          signerAddress: agentPkpInfo.ethAddress as `0x${string}`,
          userOp: crossmintUserOp,
        });

        console.log('[USDC -> ETH swap completed from Crossmint smart account]', {
          userOpHash,
        });

        expect(userOpHash).toMatch(/^0x[a-fA-F0-9]+$/);
      });
    });
  },
);
