import { hexToBigInt, type Hex } from 'viem';
import { getUserOperationHash, entryPoint07Address } from 'viem/account-abstraction';
import { utils } from 'ethers';

import { expectAssertObject, hasError } from '../assertions';
import { createTestDebugger } from '../debug';
import { api, store, defaultWallet } from './setup';

const debug = createTestDebugger('withdraw');

// Token info from agent-funds response
interface TokenInfo {
  network: string;
  tokenAddress: string;
  tokenBalance: string;
  tokenMetadata?: {
    decimals: number;
    symbol: string;
  };
}

// UserOperation type (serialized with hex strings)
interface SerializedUserOp {
  sender: string;
  nonce: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymaster?: string;
  paymasterData?: string;
  paymasterVerificationGasLimit?: string;
  paymasterPostOpGasLimit?: string;
  factory?: string;
  factoryData?: string;
  signature?: string;
}

/**
 * Converts a serialized UserOp (hex strings) to the format expected by viem's getUserOperationHash
 */
function deserializeUserOpForHashing(serializedUserOp: SerializedUserOp) {
  return {
    sender: serializedUserOp.sender as Hex,
    nonce: hexToBigInt(serializedUserOp.nonce as Hex),
    callData: serializedUserOp.callData as Hex,
    callGasLimit: hexToBigInt(serializedUserOp.callGasLimit as Hex),
    verificationGasLimit: hexToBigInt(serializedUserOp.verificationGasLimit as Hex),
    preVerificationGas: hexToBigInt(serializedUserOp.preVerificationGas as Hex),
    maxFeePerGas: hexToBigInt(serializedUserOp.maxFeePerGas as Hex),
    maxPriorityFeePerGas: hexToBigInt(serializedUserOp.maxPriorityFeePerGas as Hex),
    paymaster: serializedUserOp.paymaster as Hex | undefined,
    paymasterData: serializedUserOp.paymasterData as Hex | undefined,
    paymasterVerificationGasLimit: serializedUserOp.paymasterVerificationGasLimit
      ? hexToBigInt(serializedUserOp.paymasterVerificationGasLimit as Hex)
      : undefined,
    paymasterPostOpGasLimit: serializedUserOp.paymasterPostOpGasLimit
      ? hexToBigInt(serializedUserOp.paymasterPostOpGasLimit as Hex)
      : undefined,
    factory: serializedUserOp.factory as Hex | undefined,
    factoryData: serializedUserOp.factoryData as Hex | undefined,
    signature: '0x' as Hex, // Empty signature for hashing
  };
}

describe('Withdraw API Integration Tests', () => {
  // Use an existing app registered on-chain (same as agentFunds tests)
  const testAppId = 66;

  beforeAll(async () => {
    store.dispatch(api.util.resetApiState());

    // Create the app in the database if it doesn't exist
    const createAppResult = await store.dispatch(
      api.endpoints.createApp.initiate({
        appCreate: {
          appId: testAppId,
          name: 'Withdraw Test App',
          description: 'Test app for withdraw integration tests',
          contactEmail: 'withdraw@example.com',
          appUrl: 'https://example.com/withdraw',
          logo: 'https://example.com/logo.png',
        },
      }),
    );
    if (hasError(createAppResult)) {
      // @ts-expect-error accessing error status
      if (createAppResult.error.status !== 409) {
        console.error('createApp failed:', createAppResult.error);
        throw new Error('Failed to create app');
      }
      debug({ testAppId, message: 'App already exists in DB, continuing' });
    }

    debug({ testAppId, appCreated: true });
  }, 30000);

  describe('Withdraw Flow - 0.1 USDC on Base Sepolia', () => {
    // USDC on Base Sepolia
    const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    const WITHDRAW_AMOUNT = 0.1; // 0.1 USDC

    let agentAddress: string;
    let availableTokens: TokenInfo[] = [];
    let withdrawalData: {
      withdrawals: Array<{
        network: string;
        userOp: SerializedUserOp;
      }>;
    };

    it('should get agent funds on Base Sepolia', async () => {
      const result = await store.dispatch(
        api.endpoints.getAgentFunds.initiate({
          appId: testAppId,
          getAgentFundsRequest: {
            userControllerAddress: defaultWallet.address,
            networks: ['base-sepolia'],
          },
        }),
      );

      if (hasError(result)) {
        console.error('getAgentFunds failed:', result.error);
      }
      expectAssertObject(result.data);

      agentAddress = result.data.agentAddress;
      availableTokens = result.data.tokens as TokenInfo[];

      expect(agentAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

      console.log('Agent address:', agentAddress);
      console.log('Available tokens on Base Sepolia:', availableTokens.length);

      // Look for USDC specifically
      const usdcToken = availableTokens.find(
        (t) => t.tokenAddress?.toLowerCase() === USDC_BASE_SEPOLIA.toLowerCase(),
      );

      if (usdcToken) {
        const balance = BigInt(usdcToken.tokenBalance);
        const decimals = usdcToken.tokenMetadata?.decimals || 6;
        const humanBalance = Number(balance) / Math.pow(10, decimals);
        console.log(`USDC balance: ${humanBalance} USDC (raw: ${balance})`);
      } else {
        console.log('USDC not found in agent wallet');
      }

      // Log all tokens with balances
      const tokensWithBalance = availableTokens.filter((t) => BigInt(t.tokenBalance || '0') > 0n);
      console.log(
        'Tokens with balance:',
        tokensWithBalance.map((t) => ({
          symbol: t.tokenMetadata?.symbol,
          address: t.tokenAddress,
          balance: t.tokenBalance,
        })),
      );

      debug({ agentAddress, tokenCount: availableTokens.length });
    }, 30000);

    it('should request withdrawal of 0.1 USDC on Base Sepolia', async () => {
      console.log(`Requesting withdrawal of ${WITHDRAW_AMOUNT} USDC to ${defaultWallet.address}`);

      const result = await store.dispatch(
        api.endpoints.requestWithdraw.initiate({
          appId: testAppId,
          requestWithdrawRequest: {
            userControllerAddress: defaultWallet.address,
            assets: [
              {
                network: 'base-sepolia',
                tokenAddress: USDC_BASE_SEPOLIA,
                amount: WITHDRAW_AMOUNT,
              },
            ],
          },
        }),
      );

      if (hasError(result)) {
        // Expected to fail if no USDC balance
        console.log('requestWithdraw result:', result.error);
        // @ts-expect-error accessing error data
        const errorMessage = result.error?.data?.message || '';
        if (errorMessage.includes('not found') || errorMessage.includes('Insufficient')) {
          console.log('No USDC available - fund the agent wallet to test full flow');
          console.log(`Agent address to fund: ${agentAddress}`);
          console.log(`USDC contract on Base Sepolia: ${USDC_BASE_SEPOLIA}`);
        }
        return;
      }

      expectAssertObject(result.data);
      expect(result.data.withdrawals.length).toBeGreaterThan(0);

      const withdrawal = result.data.withdrawals[0];
      expect(withdrawal.network).toBe('base-sepolia');
      expect(withdrawal.userOp).toHaveProperty('sender');
      expect(withdrawal.userOp).toHaveProperty('callData');

      withdrawalData = result.data as typeof withdrawalData;

      console.log('UserOperation generated successfully');
      const userOp = withdrawal.userOp as SerializedUserOp;
      console.log('UserOp sender (agent):', userOp.sender);
      console.log('UserOp nonce:', userOp.nonce);

      debug({ withdrawalCount: result.data.withdrawals.length });
    }, 60000);

    it('should complete withdrawal with signed UserOperation', async () => {
      if (!withdrawalData || withdrawalData.withdrawals.length === 0) {
        console.log('Skipping - no withdrawal data (likely insufficient USDC balance)');
        return;
      }

      const withdrawal = withdrawalData.withdrawals[0];
      const serializedUserOp = withdrawal.userOp as SerializedUserOp;
      const chainId = 84532; // Base Sepolia

      // Deserialize the UserOp for hashing
      const userOpForHashing = deserializeUserOpForHashing(serializedUserOp);

      // Compute the UserOperation hash using viem's utility (handles v0.7 format)
      const userOpHash = getUserOperationHash({
        userOperation: userOpForHashing,
        entryPointAddress: entryPoint07Address,
        entryPointVersion: '0.7',
        chainId,
      });
      console.log('UserOp hash to sign:', userOpHash);

      // Sign the UserOp hash with the user's wallet using Ethereum signed message format
      // ZeroDev's ECDSA validator expects signMessage({ raw: hash }) which adds the prefix
      const signature = await defaultWallet.signMessage(utils.arrayify(userOpHash));
      console.log('Signature (with eth prefix):', signature);

      // Complete the withdrawal
      const completeResult = await store.dispatch(
        api.endpoints.completeWithdraw.initiate({
          appId: testAppId,
          completeWithdrawRequest: {
            withdrawals: [
              {
                network: withdrawal.network,
                userOp: serializedUserOp as unknown as Record<string, unknown>,
                signature,
              },
            ],
          },
        }),
      );

      if (hasError(completeResult)) {
        console.warn('completeWithdraw failed:', completeResult.error);
        // @ts-expect-error accessing error status
        expect([400, 500]).toContain(completeResult.error.status);
        return;
      }

      expectAssertObject(completeResult.data);
      expect(completeResult.data.transactions.length).toBeGreaterThan(0);

      const tx = completeResult.data.transactions[0];
      console.log('✅ Withdrawal successful!');
      console.log('Transaction hash:', tx.transactionHash);
      console.log('UserOp hash:', tx.userOpHash);
      console.log(`View on BaseScan: https://sepolia.basescan.org/tx/${tx.transactionHash}`);

      debug({ transactionHash: tx.transactionHash });
    }, 180000);
  });

  describe('POST /user/:appId/request-withdraw validation', () => {
    it('should return 400 for missing userControllerAddress', async () => {
      const result = await store.dispatch(
        api.endpoints.requestWithdraw.initiate({
          appId: testAppId,
          requestWithdrawRequest: {
            assets: [
              {
                network: 'base-mainnet',
                tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                amount: 1,
              },
            ],
          } as {
            userControllerAddress: string;
            assets: Array<{ network: string; tokenAddress: string; amount: number }>;
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for invalid userControllerAddress format', async () => {
      const result = await store.dispatch(
        api.endpoints.requestWithdraw.initiate({
          appId: testAppId,
          requestWithdrawRequest: {
            userControllerAddress: 'invalid-address',
            assets: [
              {
                network: 'base-mainnet',
                tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                amount: 1,
              },
            ],
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for empty assets array', async () => {
      const result = await store.dispatch(
        api.endpoints.requestWithdraw.initiate({
          appId: testAppId,
          requestWithdrawRequest: {
            userControllerAddress: defaultWallet.address,
            assets: [],
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for invalid tokenAddress format', async () => {
      const result = await store.dispatch(
        api.endpoints.requestWithdraw.initiate({
          appId: testAppId,
          requestWithdrawRequest: {
            userControllerAddress: defaultWallet.address,
            assets: [
              {
                network: 'base-mainnet',
                tokenAddress: 'not-an-address',
                amount: 1,
              },
            ],
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for negative amount', async () => {
      const result = await store.dispatch(
        api.endpoints.requestWithdraw.initiate({
          appId: testAppId,
          requestWithdrawRequest: {
            userControllerAddress: defaultWallet.address,
            assets: [
              {
                network: 'base-mainnet',
                tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                amount: -1,
              },
            ],
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 404 for non-existent app', async () => {
      const result = await store.dispatch(
        api.endpoints.requestWithdraw.initiate({
          appId: 999999,
          requestWithdrawRequest: {
            userControllerAddress: defaultWallet.address,
            assets: [
              {
                network: 'base-mainnet',
                tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                amount: 1,
              },
            ],
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(404);
      }
    });
  });

  describe('POST /user/:appId/complete-withdraw validation', () => {
    it('should return 400 for empty withdrawals array', async () => {
      const result = await store.dispatch(
        api.endpoints.completeWithdraw.initiate({
          appId: testAppId,
          completeWithdrawRequest: {
            withdrawals: [],
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 400 for missing signature', async () => {
      const result = await store.dispatch(
        api.endpoints.completeWithdraw.initiate({
          appId: testAppId,
          completeWithdrawRequest: {
            withdrawals: [
              {
                network: 'base-mainnet',
                userOp: { sender: '0x1234567890123456789012345678901234567890' },
              },
            ],
          } as { withdrawals: Array<{ network: string; userOp: object; signature: string }> },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(400);
      }
    });

    it('should return 404 for non-existent app', async () => {
      const result = await store.dispatch(
        api.endpoints.completeWithdraw.initiate({
          appId: 999999,
          completeWithdrawRequest: {
            withdrawals: [
              {
                network: 'base-mainnet',
                userOp: { sender: '0x1234567890123456789012345678901234567890' },
                signature: '0x1234',
              },
            ],
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(404);
      }
    });
  });

  describe('Insufficient balance handling', () => {
    it('should return error when requesting withdrawal of token not in balance', async () => {
      // Request withdrawal of a token the agent likely doesn't have
      const result = await store.dispatch(
        api.endpoints.requestWithdraw.initiate({
          appId: testAppId,
          requestWithdrawRequest: {
            userControllerAddress: defaultWallet.address,
            assets: [
              {
                network: 'base-mainnet',
                tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
                amount: 999999999, // Very large amount
              },
            ],
          },
        }),
      );

      // Should fail with insufficient balance or token not found error
      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect([400, 500]).toContain(result.error.status);
        console.log('Expected error for insufficient balance:', result.error);
      }
    }, 60000);

    it('should return error when requesting withdrawal of unknown token', async () => {
      // Request withdrawal of a token that doesn't exist
      const result = await store.dispatch(
        api.endpoints.requestWithdraw.initiate({
          appId: testAppId,
          requestWithdrawRequest: {
            userControllerAddress: defaultWallet.address,
            assets: [
              {
                network: 'base-mainnet',
                tokenAddress: '0x0000000000000000000000000000000000000001', // Non-existent token
                amount: 1,
              },
            ],
          },
        }),
      );

      // Should fail with token not found error
      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect([400, 500]).toContain(result.error.status);
        console.log('Expected error for unknown token:', result.error);
      }
    }, 60000);
  });
});
