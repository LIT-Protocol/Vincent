import { expectAssertArray, expectAssertObject, hasError } from '../assertions';
import { createTestDebugger } from '../debug';
import { api, store, generateRandomEthAddresses, getDefaultWalletContractClient } from './setup';

// Create a debug instance for this file
const debug = createTestDebugger('appVersionAbility');

// For backwards compatibility
const verboseLog = (value: any) => {
  debug(value);
};

/* eslint-disable @typescript-eslint/no-non-null-assertion */
describe('AppVersionAbility API Integration Tests', () => {
  beforeAll(async () => {
    verboseLog('AppVersionAbility API Integration Tests');
  });

  // Variables to store test data
  let testAppId: number | undefined;
  let testAbilityPackageName1: string;
  let testAbilityPackageName2: string;
  const firstAppVersion = 1; // Initial app version
  let secondAppVersion: number;

  // Test data for creating an app
  const appData = {
    name: 'Test App for AppVersionAbility',
    description: 'Test app for AppVersionAbility integration tests',
    contactEmail: 'test@example.com',
    appUserUrl: 'https://example.com/app',
    logo: 'https://example.com/logo.png',
    redirectUris: ['https://example.com/callback'],
    deploymentStatus: 'dev' as const,
    delegateeAddresses: generateRandomEthAddresses(2),
  };

  // Test data for creating abilities
  const abilityData1 = {
    title: 'Test Ability 1',
    description: 'Test ability 1 for AppVersionAbility integration tests',
    activeVersion: '1.0.0',
  };

  const abilityData2 = {
    title: 'Test Ability 2',
    description: 'Test ability 2 for AppVersionAbility integration tests',
    activeVersion: '1.0.0',
  };

  // Test data for creating app versions
  const appVersionData = {
    changes: 'Second version for AppVersionAbility tests',
  };

  // Test data for creating app version abilities
  const appVersionAbilityData1 = {
    abilityVersion: '1.0.0',
    hiddenSupportedPolicies: ['@vincent/policy1', '@vincent/policy2'],
  };

  const appVersionAbilityData2 = {
    abilityVersion: '1.0.0',
  };

  describe('Setup: Create abilities', () => {
    it('should create the first ability', async () => {
      // Generate a unique package name for testing
      testAbilityPackageName1 = `@lit-protocol/vincent-ability-erc20-approval`;

      const result = await store.dispatch(
        api.endpoints.createAbility.initiate({
          packageName: testAbilityPackageName1,
          abilityCreate: abilityData1,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        packageName: testAbilityPackageName1,
        ...abilityData1,
      });
    });

    it('should create the second ability', async () => {
      // Generate a unique package name for testing
      testAbilityPackageName2 = `@lit-protocol/vincent-ability-uniswap-swap`;

      const result = await store.dispatch(
        api.endpoints.createAbility.initiate({
          packageName: testAbilityPackageName2,
          abilityCreate: abilityData2,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        packageName: testAbilityPackageName2,
        ...abilityData2,
      });
    });
  });

  describe('Setup: Create app and app versions', () => {
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
      const abilityIpfsCid = 'QmWWBMDT3URSp8sX9mFZjhAoufSk5kia7bpp84yxq9WHFd'; // ERC20 approval ability
      const policyIpfsCid = 'QmSK8JoXxh7sR6MP7L6YJiUnzpevbNjjtde3PeP8FfLzV3'; // Spending limit policy

      try {
        const { txHash } = await getDefaultWalletContractClient().registerApp({
          appId: testAppId,
          delegateeAddresses: appData.delegateeAddresses,
          versionAbilities: {
            abilityIpfsCids: [abilityIpfsCid],
            abilityPolicies: [[policyIpfsCid]],
          },
        });

        verboseLog({ txHash });
      } catch (error) {
        console.error('Failed to register app on contracts:', error);
        throw error;
      }
    });

    it('should create a second app version', async () => {
      const result = await store.dispatch(
        api.endpoints.createAppVersion.initiate({
          appId: testAppId!,
          appVersionCreate: appVersionData,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toHaveProperty('changes', appVersionData.changes);
      expect(data).toHaveProperty('version');

      secondAppVersion = data.version;
    });
  });

  describe('GET /app/:appId/version/:version/abilities', () => {
    it('should return an empty list of abilities for a new app version', async () => {
      const result = await store.dispatch(
        api.endpoints.listAppVersionAbilities.initiate({
          appId: testAppId!,
          version: firstAppVersion,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertArray(data);

      expect(data).toHaveLength(0);
    });
  });

  describe('POST /app/:appId/version/:version/ability/:abilityPackageName', () => {
    it('should fail to create an app version ability for an app version that is already on-chain', async () => {
      const result = await store.dispatch(
        api.endpoints.createAppVersionAbility.initiate({
          appId: testAppId!,
          appVersion: firstAppVersion,
          abilityPackageName: testAbilityPackageName1,
          appVersionAbilityCreate: appVersionAbilityData1,
        }),
      );

      verboseLog(result);
      expect(result).toHaveProperty('error');
      expect(hasError(result)).toBe(true);

      if (hasError(result)) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(403);
        // @ts-expect-error it's a test
        expect(error.data.message).toBe(
          `Operation not allowed: App version ${firstAppVersion} for app ${testAppId} is already on-chain`,
        );
      }
    });

    it('should create app version abilities for the second app version using both abilities', async () => {
      // Create app version ability for the second app version using the first ability
      const result1 = await store.dispatch(
        api.endpoints.createAppVersionAbility.initiate({
          appId: testAppId!,
          appVersion: secondAppVersion,
          abilityPackageName: testAbilityPackageName1,
          appVersionAbilityCreate: appVersionAbilityData1,
        }),
      );

      verboseLog(result1);
      expect(result1).not.toHaveProperty('error');

      const { data: data1 } = result1;
      expectAssertObject(data1);

      expect(data1).toMatchObject({
        appId: testAppId,
        appVersion: secondAppVersion,
        abilityPackageName: testAbilityPackageName1,
        abilityVersion: appVersionAbilityData1.abilityVersion,
        hiddenSupportedPolicies: appVersionAbilityData1.hiddenSupportedPolicies,
      });

      // Create app version ability for the second app version using the second ability
      const result2 = await store.dispatch(
        api.endpoints.createAppVersionAbility.initiate({
          appId: testAppId!,
          appVersion: secondAppVersion,
          abilityPackageName: testAbilityPackageName2,
          appVersionAbilityCreate: appVersionAbilityData2,
        }),
      );

      verboseLog(result2);
      expect(result2).not.toHaveProperty('error');

      const { data: data2 } = result2;
      expectAssertObject(data2);

      expect(data2).toMatchObject({
        appId: testAppId,
        appVersion: secondAppVersion,
        abilityPackageName: testAbilityPackageName2,
        abilityVersion: appVersionAbilityData2.abilityVersion,
      });
    });

    it('should return 409 when trying to create a duplicate app version ability', async () => {
      const result = await store.dispatch(
        api.endpoints.createAppVersionAbility.initiate({
          appId: testAppId!,
          appVersion: firstAppVersion,
          abilityPackageName: testAbilityPackageName1,
          appVersionAbilityCreate: appVersionAbilityData1,
        }),
      );

      verboseLog(result);
      expect(result).toHaveProperty('error');

      // @ts-expect-error It's a test
      if (result.isError) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(409);
      }
    });
  });

  describe('GET /app/:appId/version/:version/abilities', () => {
    it('should list all abilities for the first app version', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.listAppVersionAbilities.initiate({
          appId: testAppId!,
          version: firstAppVersion,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertArray(data);

      // The first app version is on-chain, so ability creation should be blocked
      // Therefore, it should have 0 abilities, not 1
      expect(data).toHaveLength(0);
    });

    it('should list all abilities for the second app version', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.listAppVersionAbilities.initiate({
          appId: testAppId!,
          version: secondAppVersion,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertArray(data);

      expect(data).toHaveLength(2);

      // Check that both abilities are in the list
      // @ts-expect-error It's a test
      const abilityPackageNames = data.map((ability) => ability.abilityPackageName);
      expect(abilityPackageNames).toContain(testAbilityPackageName1);
      expect(abilityPackageNames).toContain(testAbilityPackageName2);
    });
  });

  describe('PUT /app/:appId/version/:version/ability/:abilityPackageName', () => {
    it('should fail to edit an app version ability for an app version that is already on-chain', async () => {
      const updatedPolicies = [
        '@vincent/updated-policy1',
        '@vincent/updated-policy2',
        '@vincent/updated-policy3',
      ];

      {
        // Try to update an ability for the first app version which is already on-chain
        const result = await store.dispatch(
          api.endpoints.editAppVersionAbility.initiate({
            appId: testAppId!,
            appVersion: firstAppVersion,
            abilityPackageName: testAbilityPackageName1,
            appVersionAbilityEdit: {
              hiddenSupportedPolicies: updatedPolicies,
            },
          }),
        );

        verboseLog(result);
        expect(result).toHaveProperty('error');
        expect(hasError(result)).toBe(true);

        if (hasError(result)) {
          const { error } = result;
          expectAssertObject(error);
          // @ts-expect-error it's a test
          expect(error.status).toBe(403);
          // @ts-expect-error it's a test
          expect(error.data.message).toBe(
            `Operation not allowed: App version ${firstAppVersion} for app ${testAppId} is already on-chain`,
          );
        }
      }
    });

    it('should edit an app version ability for an app version that is not on-chain', async () => {
      const updatedPolicies = [
        '@vincent/updated-policy1',
        '@vincent/updated-policy2',
        '@vincent/updated-policy3',
      ];

      {
        // Use the generated client to update the hiddenSupportedPolicies for an ability in the second app version
        const result = await store.dispatch(
          api.endpoints.editAppVersionAbility.initiate({
            appId: testAppId!,
            appVersion: secondAppVersion,
            abilityPackageName: testAbilityPackageName1,
            appVersionAbilityEdit: {
              hiddenSupportedPolicies: updatedPolicies,
            },
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data: updatedAbility } = result;
        expectAssertObject(updatedAbility);
        expect(updatedAbility).toHaveProperty('hiddenSupportedPolicies');
        expect(updatedAbility.hiddenSupportedPolicies).toEqual(updatedPolicies);
      }

      // Verify the update by fetching the ability again
      store.dispatch(api.util.resetApiState());

      {
        const result = await store.dispatch(
          api.endpoints.listAppVersionAbilities.initiate({
            appId: testAppId!,
            version: secondAppVersion,
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertArray(data);

        // Find the updated ability
        const updatedAbility = data.find(
          // @ts-expect-error It's a test
          (ability) => ability.abilityPackageName === testAbilityPackageName1,
        );
        expect(updatedAbility).toBeDefined();
        expect(updatedAbility).toMatchObject({
          appId: testAppId,
          appVersion: secondAppVersion,
          abilityPackageName: testAbilityPackageName1,
          abilityVersion: appVersionAbilityData1.abilityVersion,
          hiddenSupportedPolicies: updatedPolicies,
        });
      }
    });
  });

  describe('DELETE /app/:appId/version/:version/ability/:abilityPackageName', () => {
    it('should fail to delete an app version ability for an app version that is already on-chain', async () => {
      // Try to delete an ability from the first app version which is already on-chain
      const result = await store.dispatch(
        api.endpoints.deleteAppVersionAbility.initiate({
          appId: testAppId!,
          appVersion: firstAppVersion,
          abilityPackageName: testAbilityPackageName1,
        }),
      );

      verboseLog(result);
      expect(result).toHaveProperty('error');
      expect(hasError(result)).toBe(true);

      if (hasError(result)) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(403);
        // @ts-expect-error it's a test
        expect(error.data.message).toBe(
          `Operation not allowed: App version ${firstAppVersion} for app ${testAppId} is already on-chain`,
        );
      }
    });

    it('should delete an app version ability for an app version that is not on-chain', async () => {
      // Delete the second ability from the second app version
      const result = await store.dispatch(
        api.endpoints.deleteAppVersionAbility.initiate({
          appId: testAppId!,
          appVersion: secondAppVersion,
          abilityPackageName: testAbilityPackageName2,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      // Verify the message in the response
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('deleted successfully');

      // Reset the API cache
      store.dispatch(api.util.resetApiState());

      // Verify the ability is deleted by checking the list of abilities
      const getAbilitiesResult = await store.dispatch(
        api.endpoints.listAppVersionAbilities.initiate({
          appId: testAppId!,
          version: secondAppVersion,
        }),
      );

      expect(getAbilitiesResult).not.toHaveProperty('error');
      const { data: abilitiesData } = getAbilitiesResult;
      expectAssertArray(abilitiesData);

      // Should now only have one ability for the second app version
      expect(abilitiesData).toHaveLength(1);

      // And it should be the first ability, not the deleted second ability
      // @ts-expect-error It's a test
      expect(abilitiesData[0].abilityPackageName).toBe(testAbilityPackageName1);
      // @ts-expect-error It's a test
      expect(abilitiesData[0].abilityPackageName).not.toBe(testAbilityPackageName2);
    });
  });

  describe('DELETE /app/:appId', () => {
    it('should delete an app and all its versions and abilities', async () => {
      // First, delete the app
      const result = await store.dispatch(api.endpoints.deleteApp.initiate({ appId: testAppId! }));

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      // Verify the message in the response
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('deleted successfully');

      // Reset the API cache
      store.dispatch(api.util.resetApiState());

      // Verify the app is deleted by checking for a 404
      const getAppResult = await store.dispatch(
        api.endpoints.getApp.initiate({ appId: testAppId! }),
      );

      expect(getAppResult.isError).toBe(true);
      if (getAppResult.isError) {
        const { error } = getAppResult;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(404);
      }

      // Verify the app version abilities are deleted by checking for an empty list
      const getAbilitiesResult = await store.dispatch(
        api.endpoints.listAppVersionAbilities.initiate({
          appId: testAppId!,
          version: firstAppVersion,
        }),
      );

      // This should either return an error or an empty array
      if (!getAbilitiesResult.isError) {
        const { data: abilitiesData } = getAbilitiesResult;
        expectAssertArray(abilitiesData);
        expect(abilitiesData).toHaveLength(0);
      }
    });
  });

  // Clean up the abilities created for the test
  describe('Cleanup: Delete abilities', () => {
    it('should delete the first ability', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteAbility.initiate({ packageName: testAbilityPackageName1 }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');
    });

    it('should delete the second ability', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteAbility.initiate({ packageName: testAbilityPackageName2 }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');
    });
  });
});
