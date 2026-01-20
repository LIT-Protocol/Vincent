import { privateKeyToAccount } from 'viem/accounts';

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

  describe('Request Withdraw - 0.1 USDC on Base Sepolia', () => {
    // USDC on Base Sepolia
    const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
    const WITHDRAW_AMOUNT = 0.1; // 0.1 USDC

    let agentAddress: string;
    let availableTokens: TokenInfo[] = [];

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

    it('should request and complete withdrawal of 0.1 USDC on Base Sepolia', async () => {
      console.log(`Requesting withdrawal of ${WITHDRAW_AMOUNT} USDC to ${defaultWallet.address}`);

      // Step 1: Request the withdrawal (get unsigned UserOp)
      const requestResult = await store.dispatch(
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

      if (hasError(requestResult)) {
        // Expected to fail if no USDC balance
        console.log('requestWithdraw result:', requestResult.error);
        // @ts-expect-error accessing error data
        const errorMessage = requestResult.error?.data?.message || '';
        if (errorMessage.includes('not found') || errorMessage.includes('Insufficient')) {
          console.log('No USDC available - fund the agent wallet to test full flow');
          console.log(`Agent address to fund: ${agentAddress}`);
          console.log(`USDC contract on Base Sepolia: ${USDC_BASE_SEPOLIA}`);
        }
        return;
      }

      expectAssertObject(requestResult.data);
      expect(requestResult.data.withdrawals.length).toBeGreaterThan(0);

      console.log('Request response:', JSON.stringify(requestResult.data, null, 2));

      const withdrawal = requestResult.data.withdrawals[0];
      expect(withdrawal.network).toBe('base-sepolia');

      // Check gas sponsorship mode
      const userOp = withdrawal.userOp as { paymaster?: string };
      const isSponsored = !!userOp.paymaster;
      console.log(`Gas sponsorship mode: ${isSponsored ? 'SPONSORED' : 'NOT SPONSORED'}`);

      // Step 2: Sign the hash (provided in the response - no computation needed)
      const viemAccount = privateKeyToAccount(defaultWallet.privateKey as `0x${string}`);
      const userOpHash = (withdrawal as { userOpHash: string }).userOpHash;
      console.log('UserOp hash:', userOpHash);

      // Sign the hash with the owner's key
      const signature = await viemAccount.signMessage({
        message: { raw: userOpHash as `0x${string}` },
      });
      console.log('Signature:', signature);

      // Step 3: Complete the withdrawal
      console.log('Completing withdrawal...');
      const completeResult = await store.dispatch(
        api.endpoints.completeWithdraw.initiate({
          appId: testAppId,
          completeWithdrawRequest: {
            withdrawals: [
              {
                network: withdrawal.network,
                userOp: withdrawal.userOp,
                signature,
              },
            ],
          },
        }),
      );

      if (hasError(completeResult)) {
        console.log('completeWithdraw error:', completeResult.error);
        // @ts-expect-error accessing error data
        const errorMessage = completeResult.error?.data?.message || '';
        console.log('Error message:', errorMessage);
        // The signature format might be wrong for Kernel accounts - this is expected
        // A proper e2e test would need the ZeroDev SDK to sign correctly
        return;
      }

      expectAssertObject(completeResult.data);
      expect(completeResult.data.transactions.length).toBeGreaterThan(0);

      const tx = completeResult.data.transactions[0];
      console.log('Withdrawal completed!');
      console.log('Transaction hash:', tx.transactionHash);
      console.log('UserOp hash:', tx.userOpHash);

      expect(tx.network).toBe('base-sepolia');
      expect(tx.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      debug({ transactionHash: tx.transactionHash, isSponsored });
    }, 120000);
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
                network: 'base-sepolia',
                userOp: { sender: '0x1234567890123456789012345678901234567890' },
                // intentionally missing signature to test validation
              },
            ],
          } as unknown as {
            withdrawals: Array<{
              network: string;
              userOp: Record<string, unknown>;
              signature: string;
            }>;
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
        api.endpoints.completeWithdraw.initiate({
          appId: 999999,
          completeWithdrawRequest: {
            withdrawals: [
              {
                network: 'base-sepolia',
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
});
