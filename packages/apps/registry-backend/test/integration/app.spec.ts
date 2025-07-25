import { expectAssertArray, expectAssertObject, hasError } from '../assertions';
import { createTestDebugger } from '../debug';
import { api, store, generateRandomEthAddresses, getDefaultWalletContractClient } from './setup';

// Create a debug instance for this file
const debug = createTestDebugger('app');

// For backwards compatibility
const verboseLog = (value: any) => {
  debug(value);
};

/* eslint-disable @typescript-eslint/no-non-null-assertion */
describe('App API Integration Tests', () => {
  beforeAll(async () => {
    verboseLog('App API Integration Tests');
  });

  let testAppId: number | undefined;

  const appData = {
    name: 'Test App',
    description: 'Test app for integration tests',
    contactEmail: 'test@example.com',
    appUserUrl: 'https://example.com/app',
    logo: 'https://example.com/logo.png',
    redirectUris: ['https://example.com/callback'],
    delegateeAddresses: generateRandomEthAddresses(2),
    // deploymentStatus: 'dev' as const,
  };

  describe('GET /apps', () => {
    it('should return a list of apps', async () => {
      const result = await store.dispatch(api.endpoints.listApps.initiate());

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      expectAssertArray(result.data);
    });
  });

  describe('POST /app', () => {
    it('should create a new app', async () => {
      const result = await store.dispatch(
        api.endpoints.createApp.initiate({
          appCreate: appData,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      testAppId = data.appId;

      expect(data).toMatchObject(appData);

      // Register the app on the contracts using contracts-sdk
      const toolIpfsCid = 'QmWWBMDT3URSp8sX9mFZjhAoufSk5kia7bpp84yxq9WHFd'; // ERC20 approval tool
      const policyIpfsCid = 'QmSK8JoXxh7sR6MP7L6YJiUnzpevbNjjtde3PeP8FfLzV3'; // Spending limit policy

      try {
        const { txHash } = await getDefaultWalletContractClient().registerApp({
          appId: testAppId,
          delegateeAddresses: appData.delegateeAddresses,
          versionTools: {
            toolIpfsCids: [toolIpfsCid],
            toolPolicies: [[policyIpfsCid]],
          },
        });

        verboseLog({ txHash });
      } catch (error) {
        console.error('Failed to register app on contracts:', error);
        throw error;
      }
    });
  });

  describe('GET /app/:appId', () => {
    it('should return a specific app', async () => {
      const result = await store.dispatch(api.endpoints.getApp.initiate({ appId: testAppId! }));
      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject(appData);
    });

    it('should return 404 for non-existent app', async () => {
      const result = await store.dispatch(
        api.endpoints.getApp.initiate({ appId: Number(Math.random() * 1000000) }),
      );

      expect(result).toHaveProperty('error');

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(404);
      }
    });
  });

  describe('PUT /app/:appId', () => {
    it('should update an app', async () => {
      const updateData = {
        description: 'Updated test app description!',
      };

      const result = await store.dispatch(
        api.endpoints.editApp.initiate({
          appId: testAppId!,
          appEdit: updateData,
        }),
      );
      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      // Reset the API cache so we can verify the change
      store.dispatch(api.util.resetApiState());

      const getResult = await store.dispatch(api.endpoints.getApp.initiate({ appId: testAppId! }));

      verboseLog(getResult);

      const { data } = getResult;
      expectAssertObject(data);

      expect(data).toHaveProperty('description', updateData.description);
    });

    it('should update delegateeAddresses', async () => {
      const newDelegateeAddresses = [
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002',
      ];
      const updateData = {
        delegateeAddresses: newDelegateeAddresses,
      };

      const result = await store.dispatch(
        api.endpoints.editApp.initiate({
          appId: testAppId!,
          appEdit: updateData,
        }),
      );
      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      // Reset the API cache so we can verify the change
      store.dispatch(api.util.resetApiState());

      const getResult = await store.dispatch(api.endpoints.getApp.initiate({ appId: testAppId! }));

      verboseLog(getResult);

      const { data } = getResult;
      expectAssertObject(data);

      expect(data).toHaveProperty('delegateeAddresses');
      expect(data.delegateeAddresses).toEqual(newDelegateeAddresses);
    });
  });

  describe('POST /app/:appId/version', () => {
    it('should create a new app version', async () => {
      const versionData = {
        changes: 'Added new features',
      };

      const result = await store.dispatch(
        api.endpoints.createAppVersion.initiate({
          appId: testAppId!,
          appVersionCreate: versionData,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toHaveProperty('changes', versionData.changes);
      expect(data).toHaveProperty('version', 2);
    });

    it('should fail to create a second pending app version', async () => {
      // Try to create a third app version without registering the second one
      const versionData = {
        changes: 'This should fail because there is already a pending app version',
      };

      const result = await store.dispatch(
        api.endpoints.createAppVersion.initiate({
          appId: testAppId!,
          appVersionCreate: versionData,
        }),
      );

      verboseLog(result);
      expect(result).toHaveProperty('error');
      expect(hasError(result)).toBe(true);

      if (hasError(result)) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(500);
        // @ts-expect-error it's a test
        expect(error.data.message).toBe(
          'There can only be 1 pending app version for an app on the registry.',
        );
      }
    });
  });

  describe('GET /app/:appId/versions', () => {
    it('should list all versions of an app', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.getAppVersions.initiate({ appId: testAppId! }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertArray(data);

      expect(data).toHaveLength(2);
    });
  });

  describe('GET /app/:appId/version/:version', () => {
    it('should get a specific app version', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.getAppVersion.initiate({
          appId: testAppId!,
          version: 2,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      store.dispatch(api.util.resetApiState());
      expect(data).toHaveProperty('version', 2);
    });

    it('should return 404 for non-existent version', async () => {
      const result = await store.dispatch(
        api.endpoints.getAppVersion.initiate({
          appId: testAppId!,
          version: 999,
        }),
      );

      verboseLog(result);
      expect(result).toHaveProperty('error');

      expect(hasError(result)).toBe(true);
      if (hasError(result)) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(404);
      }
    });
  });

  describe('PUT /app/:appId/version/:version', () => {
    it('should update an app version that is not on-chain', async () => {
      store.dispatch(api.util.resetApiState());

      const changes = 'Updated changes description for appVersion 2' as const;

      {
        const result = await store.dispatch(
          api.endpoints.editAppVersion.initiate({
            appId: testAppId!,
            version: 2, // This version is not on-chain
            appVersionEdit: {
              changes,
            },
          }),
        );
        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);
      }

      store.dispatch(api.util.resetApiState());

      {
        // Verify the update
        const getResult = await store.dispatch(
          api.endpoints.getAppVersion.initiate({
            appId: testAppId!,
            version: 2,
          }),
        );

        verboseLog(getResult);
        expect(getResult).not.toHaveProperty('error');

        const { data } = getResult;
        expectAssertObject(data);
        expect(data).toHaveProperty('changes', changes);
      }
    });
  });

  describe('POST /app/:appId/version/:version/disable', () => {
    it('should disable an app version that is not on-chain', async () => {
      {
        const result = await store.dispatch(
          api.endpoints.disableAppVersion.initiate({
            appId: testAppId!,
            version: 2, // This version is not on-chain
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);
      }

      store.dispatch(api.util.resetApiState());

      {
        const getResult = await store.dispatch(
          api.endpoints.getAppVersion.initiate({
            appId: testAppId!,
            version: 2,
          }),
        );

        verboseLog(getResult);
        expect(getResult).not.toHaveProperty('error');

        const { data } = getResult;
        expectAssertObject(data);
        expect(data).toHaveProperty('enabled', false);
      }
    });
  });

  describe('POST /app/:appId/version/:version/enable', () => {
    it('should enable an app version that is not on-chain', async () => {
      {
        const result = await store.dispatch(
          api.endpoints.enableAppVersion.initiate({
            appId: testAppId!,
            version: 2, // This version is not on-chain
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);
      }

      store.dispatch(api.util.resetApiState());

      {
        const getResult = await store.dispatch(
          api.endpoints.getAppVersion.initiate({
            appId: testAppId!,
            version: 2,
          }),
        );

        verboseLog(getResult);
        expect(getResult).not.toHaveProperty('error');

        const { data } = getResult;
        expectAssertObject(data);
        expect(data).toHaveProperty('enabled', true);
      }
    });
  });

  describe('DELETE /app/:appId/version/:version', () => {
    it('should delete an app version that is not on-chain', async () => {
      // Delete the second version which is not on-chain
      {
        const result = await store.dispatch(
          api.endpoints.deleteAppVersion.initiate({
            appId: testAppId!,
            version: 2,
          }),
        );
        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);

        expect(data).toHaveProperty('message');
        expect(data.message).toContain('deleted successfully');
      }

      store.dispatch(api.util.resetApiState());

      {
        // Verify the deletion
        const getResult = await store.dispatch(
          api.endpoints.getAppVersion.initiate({
            appId: testAppId!,
            version: 2,
          }),
        );

        expect(hasError(getResult)).toBe(true);
        if (hasError(getResult)) {
          const { error } = getResult;
          expectAssertObject(error);
          // @ts-expect-error it's a test
          expect(error.status).toBe(404);
        }
      }
    });
  });

  describe('DELETE /app/:appId', () => {
    it('should delete an app and its versions', async () => {
      {
        const result = await store.dispatch(
          api.endpoints.deleteApp.initiate({ appId: testAppId! }),
        );
        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);

        expect(data).toHaveProperty('message');
        expect(data.message).toContain('deleted successfully');
      }

      store.dispatch(api.util.resetApiState());

      {
        // Verify the deletion
        const getResult = await store.dispatch(
          api.endpoints.getApp.initiate({ appId: testAppId! }),
        );

        expect(hasError(getResult)).toBe(true);
        if (hasError(getResult)) {
          const { error } = getResult;
          expectAssertObject(error);
          // @ts-expect-error it's a test
          expect(error.status).toBe(404);
        }
      }
    });
  });
});
