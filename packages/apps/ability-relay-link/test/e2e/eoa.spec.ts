import {
  setupVincentDevelopmentEnvironment,
  getEnv,
  type PkpInfo,
  type VincentDevEnvironment,
} from '@lit-protocol/vincent-e2e-test-utils';
import {
  disconnectVincentAbilityClients,
  getVincentAbilityClient,
} from '@lit-protocol/vincent-app-sdk/abilityClient';
import * as util from 'node:util';
import { JsonRpcProvider } from 'ethers-v6';
import {
  serializeTransaction,
  hexToBigInt,
  hexToNumber,
  type Hex,
  type TransactionSerializable,
} from 'viem';

import {
  bundledVincentAbility as relayLinkAbility,
  getRelayLinkQuote,
  toVincentTransaction,
  type Transaction,
} from '../../src';

jest.setTimeout(300000);

describe('Relay.link Ability E2E Tests', () => {
  const ENV = getEnv();

  let agentPkpInfo: PkpInfo;
  let wallets: VincentDevEnvironment['wallets'];
  let baseRpcProvider: JsonRpcProvider;

  beforeAll(async () => {
    const PERMISSION_DATA = {
      [relayLinkAbility.ipfsCid]: {},
    };

    const setupResult = await setupVincentDevelopmentEnvironment({
      permissionData: PERMISSION_DATA,
    });

    agentPkpInfo = setupResult.agentPkpInfo;
    wallets = setupResult.wallets;

    // Use ethers v6 provider for gas estimation
    baseRpcProvider = new JsonRpcProvider(ENV.BASE_RPC_URL);
  });

  afterAll(async () => {
    await disconnectVincentAbilityClients();
  });

  /**
   * Helper to prepare a full transaction with nonce and gas params
   */
  async function prepareTransaction(txData: {
    to: string;
    data: string;
    value: string;
    chainId: number;
  }): Promise<Transaction> {
    const userAddress = agentPkpInfo.ethAddress as `0x${string}`;

    // Get nonce (ethers v6 returns number)
    const nonce = await baseRpcProvider.getTransactionCount(userAddress);

    // Get gas estimates (ethers v6 returns bigint directly)
    const feeData = await baseRpcProvider.getFeeData();
    const gasEstimate = await baseRpcProvider.estimateGas({
      from: userAddress,
      to: txData.to,
      data: txData.data,
      value: txData.value,
    });

    // Add 20% buffer to gas estimate (using bigint arithmetic)
    const gasLimit = (gasEstimate * 120n) / 100n;

    return toVincentTransaction({
      to: txData.to as `0x${string}`,
      data: txData.data as `0x${string}`,
      value: BigInt(txData.value || '0'),
      from: userAddress,
      chainId: txData.chainId,
      nonce,
      // Use 'gas' field (not 'gasLimit') - the ability SDK's signTransaction checks for 'gas'
      gas: gasLimit,
      maxFeePerGas: feeData.maxFeePerGas || 0n,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas || 0n,
    });
  }

  describe('Get Quote from Relay.link', () => {
    it('should successfully get a quote from Relay.link API', async () => {
      const userAddress = agentPkpInfo.ethAddress;

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
      });

      console.log('[should successfully get a quote]', util.inspect(quote, { depth: 10 }));

      expect(quote).toBeDefined();
      expect(quote.steps).toBeDefined();
      expect(quote.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Execute Relay.link Transaction', () => {
    it('should validate and sign a Relay.link transaction', async () => {
      const relayClient = getVincentAbilityClient({
        bundledVincentAbility: relayLinkAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const userAddress = agentPkpInfo.ethAddress;

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
      });

      expect(quote.steps).toBeDefined();
      expect(quote.steps.length).toBeGreaterThan(0);

      // Find the transaction step
      const txStep = quote.steps.find((step: any) => step.kind === 'transaction');
      expect(txStep).toBeDefined();

      const txItem = txStep?.items?.[0];
      expect(txItem?.data).toBeDefined();

      const txData = txItem!.data;

      const transaction = await prepareTransaction({
        to: txData.to,
        data: txData.data,
        value: txData.value || '0',
        chainId: txData.chainId,
      });

      console.log('[prepared transaction]', util.inspect(transaction, { depth: 10 }));

      // Precheck the transaction
      const precheckResult = await relayClient.precheck(
        {
          alchemyRpcUrl: ENV.BASE_RPC_URL!,
          transaction,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

      console.log('[precheck result]', util.inspect(precheckResult, { depth: 10 }));

      expect(precheckResult).toBeDefined();
      expect(precheckResult.success).toBe(true);

      if (precheckResult.success === false) {
        throw new Error(precheckResult.runtimeError);
      }

      // Execute to get the signature
      const executeResult = await relayClient.execute(
        {
          alchemyRpcUrl: ENV.BASE_RPC_URL!,
          transaction,
        },
        {
          delegatorPkpEthAddress: agentPkpInfo.ethAddress,
        },
      );

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

      // Verify simulation changes are returned
      expect(executeResult.result.simulationChanges).toBeDefined();
      expect(Array.isArray(executeResult.result.simulationChanges)).toBe(true);

      // Broadcast the signed transaction
      const signature = executeResult.result.signature;

      // Build signable transaction matching how the ability's signTransaction works
      // Must spread original transaction, then override numeric fields with proper types
      const signableTransaction = {
        ...transaction,
        accessList: transaction.accessList || [],
        gas: transaction.gas ? hexToBigInt(transaction.gas as Hex) : undefined,
        gasLimit: transaction.gasLimit ? hexToBigInt(transaction.gasLimit as Hex) : undefined,
        gasPrice: transaction.gasPrice ? hexToBigInt(transaction.gasPrice as Hex) : undefined,
        maxFeePerGas: transaction.maxFeePerGas
          ? hexToBigInt(transaction.maxFeePerGas as Hex)
          : undefined,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
          ? hexToBigInt(transaction.maxPriorityFeePerGas as Hex)
          : undefined,
        nonce: hexToNumber(transaction.nonce as Hex),
        value: hexToBigInt(transaction.value as Hex),
      };

      const serializedTx = serializeTransaction(signableTransaction as TransactionSerializable, {
        r: signature.slice(0, 66) as `0x${string}`,
        s: `0x${signature.slice(66, 130)}` as `0x${string}`,
        yParity: parseInt(signature.slice(130, 132), 16) as 0 | 1,
      });

      // Broadcast the transaction (ethers v6 uses broadcastTransaction)
      const txResponse = await baseRpcProvider.broadcastTransaction(serializedTx);
      console.log('[transaction hash]', txResponse.hash);

      // Wait for transaction to be mined
      const receipt = await txResponse.wait();
      console.log('[transaction receipt]', util.inspect(receipt, { depth: 5 }));

      expect(receipt).toBeDefined();
      expect(receipt!.status).toBe(1); // Transaction succeeded
      expect(receipt!.hash).toBeDefined();

      console.log(`[swap completed] TX: https://basescan.org/tx/${receipt!.hash}`);
    });
  });

  describe('Execute USDC -> ETH Transaction (ERC20 approval flow)', () => {
    it('should validate and sign a USDC -> ETH swap with ERC20 approval', async () => {
      const relayClient = getVincentAbilityClient({
        bundledVincentAbility: relayLinkAbility,
        ethersSigner: wallets.appDelegatee,
        debug: false,
      });

      const userAddress = agentPkpInfo.ethAddress;

      // Get quote for USDC -> ETH swap on Base (reverse of the other test)
      const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';
      const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

      const quote = await getRelayLinkQuote({
        user: userAddress,
        originChainId: 8453,
        destinationChainId: 8453,
        originCurrency: USDC_ADDRESS, // Swapping FROM USDC
        destinationCurrency: ETH_ADDRESS, // TO ETH
        amount: '50000', // 0.05 USDC (6 decimals)
        tradeType: 'EXACT_INPUT',
        useReceiver: true,
        protocolVersion: 'preferV2',
      });

      console.log('[USDC -> ETH quote]', util.inspect(quote, { depth: 10 }));

      expect(quote.steps).toBeDefined();
      expect(quote.steps.length).toBeGreaterThan(0);

      // Process all transaction steps (may include approval + swap)
      for (const step of quote.steps) {
        if (step.kind !== 'transaction') continue;

        for (const txItem of step.items || []) {
          if (!txItem?.data) continue;

          const txData = txItem.data;
          console.log('[processing tx step]', {
            id: step.id,
            action: step.action,
            to: txData.to,
          });

          const transaction = await prepareTransaction({
            to: txData.to,
            data: txData.data,
            value: txData.value || '0',
            chainId: txData.chainId,
          });

          console.log('[prepared transaction]', util.inspect(transaction, { depth: 10 }));

          // Precheck the transaction
          const precheckResult = await relayClient.precheck(
            {
              alchemyRpcUrl: ENV.BASE_RPC_URL!,
              transaction,
            },
            {
              delegatorPkpEthAddress: agentPkpInfo.ethAddress,
            },
          );

          console.log('[precheck result]', util.inspect(precheckResult, { depth: 10 }));

          expect(precheckResult).toBeDefined();
          expect(precheckResult.success).toBe(true);

          if (precheckResult.success === false) {
            throw new Error(precheckResult.runtimeError);
          }

          // Execute to get the signature
          const executeResult = await relayClient.execute(
            {
              alchemyRpcUrl: ENV.BASE_RPC_URL!,
              transaction,
            },
            {
              delegatorPkpEthAddress: agentPkpInfo.ethAddress,
            },
          );

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

          // Broadcast the signed transaction
          const signature = executeResult.result.signature;

          const signableTransaction = {
            ...transaction,
            accessList: transaction.accessList || [],
            gas: transaction.gas ? hexToBigInt(transaction.gas as Hex) : undefined,
            gasLimit: transaction.gasLimit ? hexToBigInt(transaction.gasLimit as Hex) : undefined,
            gasPrice: transaction.gasPrice ? hexToBigInt(transaction.gasPrice as Hex) : undefined,
            maxFeePerGas: transaction.maxFeePerGas
              ? hexToBigInt(transaction.maxFeePerGas as Hex)
              : undefined,
            maxPriorityFeePerGas: transaction.maxPriorityFeePerGas
              ? hexToBigInt(transaction.maxPriorityFeePerGas as Hex)
              : undefined,
            nonce: hexToNumber(transaction.nonce as Hex),
            value: hexToBigInt(transaction.value as Hex),
          };

          const serializedTx = serializeTransaction(
            signableTransaction as TransactionSerializable,
            {
              r: signature.slice(0, 66) as `0x${string}`,
              s: `0x${signature.slice(66, 130)}` as `0x${string}`,
              yParity: parseInt(signature.slice(130, 132), 16) as 0 | 1,
            },
          );

          // Broadcast the transaction
          const txResponse = await baseRpcProvider.broadcastTransaction(serializedTx);
          console.log('[transaction hash]', txResponse.hash);

          // Wait for transaction to be mined
          const receipt = await txResponse.wait();
          console.log('[transaction receipt]', util.inspect(receipt, { depth: 5 }));

          expect(receipt).toBeDefined();
          expect(receipt!.status).toBe(1);

          console.log(`[step completed] TX: https://basescan.org/tx/${receipt!.hash}`);

          // Need to re-fetch nonce for next transaction
          // The prepareTransaction helper will get fresh nonce each time
        }
      }

      console.log('[USDC -> ETH swap completed successfully]');
    });
  });
});
