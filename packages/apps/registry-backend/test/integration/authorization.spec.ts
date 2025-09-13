import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { Wallet } from 'ethers';

import { nodeClient } from '@lit-protocol/vincent-registry-sdk';

import { expectAssertObject, hasError } from '../assertions';
import { createTestDebugger } from '../debug';
import {
  api,
  store,
  withAuth,
  generateRandomEthAddresses,
  createWithAuth,
  getDefaultWalletContractClient,
} from './setup';

// Create a debug instance for this file
const debug = createTestDebugger('authorization');

// For backwards compatibility
const verboseLog = (value: any) => {
  debug(value);
};

// Create a different wallet for unauthorized access tests
const unauthorizedWallet = new Wallet(
  '0xaaaabbbbccccddddeeeeffff0000111122223333444455556666777788889999',
);

// Create a withSiweAuth function that uses the unauthorized wallet
const withUnauthorizedSiweAuth = createWithAuth(unauthorizedWallet);

describe('Authorization Integration Tests', () => {
  // Test data for entities
  let testAppId: number;
  let testAppVersion: number;
  let secondAppVersion: number;
  let testAbilityPackageName: string;
  let testAbilityVersion: string;
  let testPolicyPackageName: string;
  let testPolicyVersion: string;

  // Test data for creating entities
  const appData = {
    name: 'Auth Test App',
    description: 'Test app for authorization tests',
    contactEmail: 'auth-test@example.com',
    appUserUrl: 'https://example.com/auth-app',
    logo: 'https://example.com/auth-logo.png',
    redirectUris: ['https://example.com/auth-callback'],
    delegateeAddresses: generateRandomEthAddresses(2),
  };

  const abilityData = {
    title: 'Auth Test Ability',
    description: 'Test ability for authorization tests',
    activeVersion: '1.0.0',
  };

  const policyData = {
    title: 'Auth Test Policy',
    description: 'Test policy for authorization tests',
    activeVersion: '1.0.0',
  };

  // Setup: Create all entities with the authorized wallet
  beforeAll(async () => {
    verboseLog('Authorization Integration Tests - Setup');

    // Create App
    const appResult = await store.dispatch(
      api.endpoints.createApp.initiate({
        appCreate: appData,
      }),
    );
    expect(appResult).not.toHaveProperty('error');
    const { data } = appResult;
    expectAssertObject(data);
    testAppId = data.appId;
    testAppVersion = 1; // Initial version

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

    // Create Ability
    testAbilityPackageName = `@lit-protocol/vincent-ability-uniswap-swap`;
    testAbilityVersion = abilityData.activeVersion;
    const abilityResult = await store.dispatch(
      api.endpoints.createAbility.initiate({
        packageName: testAbilityPackageName,
        abilityCreate: abilityData,
      }),
    );
    expect(abilityResult).not.toHaveProperty('error');

    // Create Policy
    testPolicyPackageName = `@lit-protocol/vincent-policy-spending-limit`;
    testPolicyVersion = policyData.activeVersion;
    const policyResult = await store.dispatch(
      api.endpoints.createPolicy.initiate({
        packageName: testPolicyPackageName,
        policyCreate: policyData,
      }),
    );
    expect(policyResult).not.toHaveProperty('error');

    // Create a second app version that is not on-chain
    const appVersionResult = await store.dispatch(
      api.endpoints.createAppVersion.initiate({
        appId: testAppId,
        appVersionCreate: {
          changes: 'Second version for authorization tests',
        },
      }),
    );
    expect(appVersionResult).not.toHaveProperty('error');
    const { data: secondVersionData } = appVersionResult;
    expectAssertObject(secondVersionData);
    secondAppVersion = secondVersionData.version;
    expect(secondAppVersion).toBe(2); // Second version should be 2

    // Create AppVersionAbility for the second app version (not on-chain)
    const appVersionAbilityResult = await store.dispatch(
      api.endpoints.createAppVersionAbility.initiate({
        appId: testAppId,
        appVersion: secondAppVersion,
        abilityPackageName: testAbilityPackageName,
        appVersionAbilityCreate: {
          abilityVersion: testAbilityVersion,
        },
      }),
    );
    expect(appVersionAbilityResult).not.toHaveProperty('error');

    // Setup the unauthorized API client
    const { setBaseQueryFn } = nodeClient;
    setBaseQueryFn(
      withUnauthorizedSiweAuth(
        fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` }),
      ),
    );
  });

  // Cleanup: Delete all entities with the authorized wallet
  afterAll(async () => {
    verboseLog('Authorization Integration Tests - Cleanup');

    // Reset the API client to use the authorized wallet
    const { setBaseQueryFn } = nodeClient;
    setBaseQueryFn(
      withAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
    );

    // Delete App (this will cascade delete AppVersions and AppVersionAbilities)
    await store.dispatch(api.endpoints.deleteApp.initiate({ appId: testAppId }));

    // Delete Ability
    await store.dispatch(
      api.endpoints.deleteAbility.initiate({ packageName: testAbilityPackageName }),
    );

    // Delete Policy
    await store.dispatch(
      api.endpoints.deletePolicy.initiate({ packageName: testPolicyPackageName }),
    );
  });

  // Test App mutation endpoints
  describe('App Mutation Endpoints', () => {
    it('should fail to update an app with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.editApp.initiate({
          appId: testAppId,
          appEdit: {
            description: 'Unauthorized update',
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
      }
    });

    it('should fail to delete an app with unauthorized wallet', async () => {
      const result = await store.dispatch(api.endpoints.deleteApp.initiate({ appId: testAppId }));

      verboseLog(result);
      expect(result).toHaveProperty('error');
      expect(hasError(result)).toBe(true);

      if (hasError(result)) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(403);
      }
    });
  });

  // Test AppVersion mutation endpoints
  describe('AppVersion Mutation Endpoints', () => {
    it('should fail to create a new app version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.createAppVersion.initiate({
          appId: testAppId,
          appVersionCreate: {
            changes: 'Unauthorized changes',
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
      }
    });

    it('should fail to update an app version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.editAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
          appVersionEdit: {
            changes: 'Unauthorized changes',
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
      }
    });

    it('should fail to enable an app version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.enableAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
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
      }
    });

    it('should fail to disable an app version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.disableAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
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
      }
    });

    it('should fail to delete an app version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteAppVersion.initiate({
          appId: testAppId,
          version: testAppVersion,
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
      }
    });
  });

  // Test AppVersionAbility mutation endpoints
  describe('AppVersionAbility Mutation Endpoints', () => {
    it('should fail to create a new app version ability with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.createAppVersionAbility.initiate({
          appId: testAppId,
          appVersion: secondAppVersion,
          abilityPackageName: testAbilityPackageName,
          appVersionAbilityCreate: {
            abilityVersion: testAbilityVersion,
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
      }
    });

    it('should fail to update an app version ability with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.editAppVersionAbility.initiate({
          appId: testAppId,
          appVersion: secondAppVersion,
          abilityPackageName: testAbilityPackageName,
          appVersionAbilityEdit: {
            hiddenSupportedPolicies: ['@vincent/policy1'],
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
      }
    });

    it('should fail to delete an app version ability with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteAppVersionAbility.initiate({
          appId: testAppId,
          appVersion: secondAppVersion,
          abilityPackageName: testAbilityPackageName,
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
      }
    });
  });

  // Test Ability mutation endpoints
  describe('Ability Mutation Endpoints', () => {
    it('should fail to update an ability with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.editAbility.initiate({
          packageName: testAbilityPackageName,
          abilityEdit: {
            description: 'Unauthorized update',
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
      }
    });

    it('should fail to delete an ability with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteAbility.initiate({ packageName: testAbilityPackageName }),
      );

      verboseLog(result);
      expect(result).toHaveProperty('error');
      expect(hasError(result)).toBe(true);

      if (hasError(result)) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(403);
      }
    });
  });

  // Test AbilityVersion mutation endpoints
  describe('AbilityVersion Mutation Endpoints', () => {
    it('should fail to create a new ability version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.createAbilityVersion.initiate({
          packageName: testAbilityPackageName,
          version: '1.0.1',
          abilityVersionCreate: {
            changes: 'Unauthorized changes',
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
      }
    });

    it('should fail to update an ability version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.editAbilityVersion.initiate({
          packageName: testAbilityPackageName,
          version: testAbilityVersion,
          abilityVersionEdit: {
            changes: 'Unauthorized changes',
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
      }
    });

    it('should fail to delete an ability version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteAbilityVersion.initiate({
          packageName: testAbilityPackageName,
          version: testAbilityVersion,
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
      }
    });
  });

  // Test Policy mutation endpoints
  describe('Policy Mutation Endpoints', () => {
    it('should fail to update a policy with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.editPolicy.initiate({
          packageName: testPolicyPackageName,
          policyEdit: {
            description: 'Unauthorized update',
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
      }
    });

    it('should fail to change policy owner with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.changePolicyOwner.initiate({
          packageName: testPolicyPackageName,
          changeOwner: { authorWalletAddress: '0x30981948dfede87e987ef987ef987ef987ef987e' },
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
      }
    });

    it('should fail to delete a policy with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.deletePolicy.initiate({ packageName: testPolicyPackageName }),
      );

      verboseLog(result);
      expect(result).toHaveProperty('error');
      expect(hasError(result)).toBe(true);

      if (hasError(result)) {
        const { error } = result;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(403);
      }
    });
  });

  // Test PolicyVersion mutation endpoints
  describe('PolicyVersion Mutation Endpoints', () => {
    it('should fail to create a new policy version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.createPolicyVersion.initiate({
          packageName: testPolicyPackageName,
          version: '2.0.0',
          policyVersionCreate: {
            changes: 'Unauthorized changes',
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
      }
    });

    it('should fail to update a policy version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.editPolicyVersion.initiate({
          packageName: testPolicyPackageName,
          version: testPolicyVersion,
          policyVersionEdit: {
            changes: 'Unauthorized changes',
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
      }
    });

    it('should fail to delete a policy version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.deletePolicyVersion.initiate({
          packageName: testPolicyPackageName,
          version: testPolicyVersion,
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
      }
    });
  });
  // Test ownership change and authorization flow
  describe('Ownership Change Tests', () => {
    // Test data for new entities to be created for ownership tests
    let ownershipTestAbilityPackageName: string;
    let ownershipTestPolicyPackageName: string;

    // Create new ability and policy for ownership tests
    beforeAll(async () => {
      verboseLog('Ownership Change Tests - Setup');

      // Reset the API client to use the authorized wallet
      const { setBaseQueryFn } = nodeClient;
      setBaseQueryFn(
        withAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
      );

      // Explicitly delete both abilities and the policy before creating new ones
      try {
        await store.dispatch(
          api.endpoints.deleteAbility.initiate({
            packageName: '@lit-protocol/vincent-ability-uniswap-swap',
          }),
        );
        verboseLog('Deleted @lit-protocol/vincent-ability-uniswap-swap');
      } catch (error: any) {
        verboseLog(
          `Error deleting @lit-protocol/vincent-ability-uniswap-swap (may not exist): ${error.message}`,
        );
      }

      try {
        await store.dispatch(
          api.endpoints.deleteAbility.initiate({
            packageName: '@lit-protocol/vincent-ability-erc20-approval',
          }),
        );
        verboseLog('Deleted @lit-protocol/vincent-ability-erc20-approval');
      } catch (error: any) {
        verboseLog(
          `Error deleting @lit-protocol/vincent-ability-erc20-approval (may not exist): ${error.message}`,
        );
      }

      try {
        await store.dispatch(
          api.endpoints.deletePolicy.initiate({
            packageName: '@lit-protocol/vincent-policy-spending-limit',
          }),
        );
        verboseLog('Deleted @lit-protocol/vincent-policy-spending-limit');
      } catch (error: any) {
        verboseLog(
          `Error deleting @lit-protocol/vincent-policy-spending-limit (may not exist): ${error.message}`,
        );
      }

      // Create a new ability for ownership tests
      ownershipTestAbilityPackageName = `@lit-protocol/vincent-ability-uniswap-swap`;
      const abilityResult = await store.dispatch(
        api.endpoints.createAbility.initiate({
          packageName: ownershipTestAbilityPackageName,
          abilityCreate: {
            title: 'Ownership Test Ability',
            description: 'Ability for testing ownership changes',
            activeVersion: '1.0.0',
          },
        }),
      );
      expect(abilityResult).not.toHaveProperty('error');

      // Create a new policy for ownership tests
      ownershipTestPolicyPackageName = `@lit-protocol/vincent-policy-spending-limit`;
      const policyResult = await store.dispatch(
        api.endpoints.createPolicy.initiate({
          packageName: ownershipTestPolicyPackageName,
          policyCreate: {
            title: 'Ownership Test Policy',
            description: 'Policy for testing ownership changes',
            activeVersion: '1.0.0',
          },
        }),
      );
      expect(policyResult).not.toHaveProperty('error');
    });

    // Clean up the test entities
    afterAll(async () => {
      verboseLog('Ownership Change Tests - Cleanup');

      // Reset the API client to use the authorized wallet
      const { setBaseQueryFn } = nodeClient;
      setBaseQueryFn(
        withAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
      );

      // Delete the test ability and policy
      await store.dispatch(
        api.endpoints.deleteAbility.initiate({
          packageName: ownershipTestAbilityPackageName,
        }),
      );
      await store.dispatch(
        api.endpoints.deletePolicy.initiate({
          packageName: ownershipTestPolicyPackageName,
        }),
      );
    });

    describe('Ability Ownership Change', () => {
      it('should change ability owner to unauthorized wallet address', async () => {
        // Reset the API client to use the authorized wallet
        const { setBaseQueryFn } = nodeClient;
        setBaseQueryFn(
          withAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
        );

        const result = await store.dispatch(
          api.endpoints.changeAbilityOwner.initiate({
            packageName: ownershipTestAbilityPackageName,
            changeOwner: {
              authorWalletAddress: unauthorizedWallet.address,
            },
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);

        // Verify the owner was changed
        expect(data.authorWalletAddress).toBe(unauthorizedWallet.address);
      });

      it('should allow the new owner (previously unauthorized) to edit the ability', async () => {
        // Set the API client to use the previously unauthorized wallet
        const { setBaseQueryFn } = nodeClient;
        setBaseQueryFn(
          withUnauthorizedSiweAuth(
            fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` }),
          ),
        );

        const updateData = {
          description: 'Updated by the new owner (previously unauthorized)',
        };

        const result = await store.dispatch(
          api.endpoints.editAbility.initiate({
            packageName: ownershipTestAbilityPackageName,
            abilityEdit: updateData,
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);

        // Verify the update was successful
        expect(data.description).toBe(updateData.description);
      });

      it('should allow the new owner (previously unauthorized) to delete the ability', async () => {
        // Create a new ability version to delete
        const versionResult = await store.dispatch(
          api.endpoints.createAbilityVersion.initiate({
            packageName: ownershipTestAbilityPackageName,
            version: '1.0.1',
            abilityVersionCreate: {
              changes: 'Version to be deleted by new owner',
            },
          }),
        );

        expect(versionResult).not.toHaveProperty('error');

        // Delete the ability version
        const deleteResult = await store.dispatch(
          api.endpoints.deleteAbilityVersion.initiate({
            packageName: ownershipTestAbilityPackageName,
            version: '1.0.1',
          }),
        );

        verboseLog(deleteResult);
        expect(deleteResult).not.toHaveProperty('error');

        const { data } = deleteResult;
        expectAssertObject(data);

        // Verify the message in the response
        expect(data).toHaveProperty('message');
        expect(data.message).toContain('deleted successfully');
      });
    });

    describe('Policy Ownership Change', () => {
      it('should change policy owner to unauthorized wallet address', async () => {
        // Reset the API client to use the authorized wallet
        const { setBaseQueryFn } = nodeClient;
        setBaseQueryFn(
          withAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
        );

        const result = await store.dispatch(
          api.endpoints.changePolicyOwner.initiate({
            packageName: ownershipTestPolicyPackageName,
            changeOwner: {
              authorWalletAddress: unauthorizedWallet.address,
            },
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);

        // Verify the owner was changed
        expect(data.authorWalletAddress).toBe(unauthorizedWallet.address);
      });

      it('should allow the new owner (previously unauthorized) to edit the policy', async () => {
        // Set the API client to use the previously unauthorized wallet
        const { setBaseQueryFn } = nodeClient;
        setBaseQueryFn(
          withUnauthorizedSiweAuth(
            fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` }),
          ),
        );

        const updateData = {
          description: 'Updated by the new owner (previously unauthorized)',
        };

        const result = await store.dispatch(
          api.endpoints.editPolicy.initiate({
            packageName: ownershipTestPolicyPackageName,
            policyEdit: updateData,
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);

        // Verify the update was successful
        expect(data.description).toBe(updateData.description);
      });

      it('should allow the new owner (previously unauthorized) to delete the policy', async () => {
        // Create a new policy version to delete
        const versionResult = await store.dispatch(
          api.endpoints.createPolicyVersion.initiate({
            packageName: ownershipTestPolicyPackageName,
            version: '1.0.1',
            policyVersionCreate: {
              changes: 'Version to be deleted by new owner',
            },
          }),
        );

        expect(versionResult).not.toHaveProperty('error');

        // Delete the policy version
        const deleteResult = await store.dispatch(
          api.endpoints.deletePolicyVersion.initiate({
            packageName: ownershipTestPolicyPackageName,
            version: '1.0.1',
          }),
        );

        verboseLog(deleteResult);
        expect(deleteResult).not.toHaveProperty('error');

        const { data } = deleteResult;
        expectAssertObject(data);

        // Verify the message in the response
        expect(data).toHaveProperty('message');
        expect(data.message).toContain('deleted successfully');
      });
    });
  });
});
