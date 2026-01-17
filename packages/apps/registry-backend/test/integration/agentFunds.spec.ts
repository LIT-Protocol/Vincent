import { expectAssertObject, hasError } from '../assertions';
import { createTestDebugger } from '../debug';
import { api, store, defaultWallet } from './setup';

const debug = createTestDebugger('agentFunds');

describe('Agent Funds API Integration Tests', () => {
  // Use an existing app registered on-chain (avoids gas costs and setup time)
  const testAppId = 66;

  beforeAll(async () => {
    store.dispatch(api.util.resetApiState());

    // Create the app in the database if it doesn't exist
    const createAppResult = await store.dispatch(
      api.endpoints.createApp.initiate({
        appCreate: {
          appId: testAppId,
          name: 'Agent Funds Test App',
          description: 'Test app for agent funds integration tests',
          contactEmail: 'agentfunds@example.com',
          appUrl: 'https://example.com/agentfunds',
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

  describe('POST /user/:appId/agent-funds', () => {
    it('should return agent address and tokens array', async () => {
      const result = await store.dispatch(
        api.endpoints.getAgentFunds.initiate({
          appId: testAppId,
          getAgentFundsRequest: {
            userControllerAddress: defaultWallet.address,
            networks: ['base-mainnet', 'base-sepolia'],
          },
        }),
      );

      if (hasError(result)) {
        console.error('getAgentFunds failed:', result.error);
      }
      expectAssertObject(result.data);

      // Should have agentAddress
      expect(result.data).toHaveProperty('agentAddress');
      expect(result.data.agentAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

      // Should have tokens array
      expect(result.data).toHaveProperty('tokens');
      expect(Array.isArray(result.data.tokens)).toBe(true);

      console.log('Agent funds result:', JSON.stringify(result.data, null, 2));

      debug({
        agentAddress: result.data.agentAddress,
        tokens: result.data.tokens,
      });
    }, 30000);

    it('should work with a single network', async () => {
      const result = await store.dispatch(
        api.endpoints.getAgentFunds.initiate({
          appId: testAppId,
          getAgentFundsRequest: {
            userControllerAddress: defaultWallet.address,
            networks: ['base-mainnet'],
          },
        }),
      );

      if (hasError(result)) {
        console.error('getAgentFunds failed:', result.error);
      }
      expectAssertObject(result.data);

      expect(result.data).toHaveProperty('agentAddress');
      expect(result.data).toHaveProperty('tokens');

      console.log('Agent funds with base-mainnet only:', JSON.stringify(result.data, null, 2));
    }, 30000);

    it('should return 400 for missing userControllerAddress', async () => {
      const result = await store.dispatch(
        api.endpoints.getAgentFunds.initiate({
          appId: testAppId,
          getAgentFundsRequest: {
            networks: ['base-mainnet'],
          } as { userControllerAddress: string; networks: string[] },
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
        api.endpoints.getAgentFunds.initiate({
          appId: testAppId,
          getAgentFundsRequest: {
            userControllerAddress: 'invalid-address',
            networks: ['base-mainnet'],
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
        api.endpoints.getAgentFunds.initiate({
          appId: 999999,
          getAgentFundsRequest: {
            userControllerAddress: defaultWallet.address,
            networks: ['base-mainnet'],
          },
        }),
      );

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        // @ts-expect-error accessing error status
        expect(result.error.status).toBe(404);
      }
    });

    it('should return consistent agent address for same user and app', async () => {
      // Call the endpoint twice with the same parameters
      const result1 = await store.dispatch(
        api.endpoints.getAgentFunds.initiate({
          appId: testAppId,
          getAgentFundsRequest: {
            userControllerAddress: defaultWallet.address,
            networks: ['base-mainnet'],
          },
        }),
      );

      // Reset cache to force a fresh call
      store.dispatch(api.util.resetApiState());

      const result2 = await store.dispatch(
        api.endpoints.getAgentFunds.initiate({
          appId: testAppId,
          getAgentFundsRequest: {
            userControllerAddress: defaultWallet.address,
            networks: ['base-mainnet'],
          },
        }),
      );

      expectAssertObject(result1.data);
      expectAssertObject(result2.data);

      // Agent address should be deterministic
      expect(result1.data.agentAddress).toBe(result2.data.agentAddress);
    }, 30000);
  });
});
