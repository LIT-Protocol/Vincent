import { expectAssertArray, expectAssertObject } from '../assertions';
import { createTestDebugger } from '../debug';
import { api, store } from './setup';

// Create a debug instance for this file
const debug = createTestDebugger('supportedPolicies');

// For backwards compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const verboseLog = (value: any) => {
  debug(value);
};

describe('Supported Policies Integration Tests', () => {
  beforeAll(async () => {
    verboseLog('Supported Policies Integration Tests');
  });

  // Package names for testing
  const policyPackageName = 'vincent-demo-policy';
  const abilityPackageName = 'vincent-demo-ability';

  // Test data for creating a policy
  const policyData = {
    title: 'Spending Limit Policy',
    description: 'A policy that enforces spending limits',
    activeVersion: '0.0.2',
  };

  // Test data for creating an ability
  const abilityData = {
    title: 'Uniswap Swap Ability',
    description: 'An ability for swapping tokens on Uniswap',
    activeVersion: '0.0.2',
  };

  // Test data for creating an ability version
  const abilityVersionData = {
    changes: 'Initial version',
  };

  // Clean up any existing test data before running tests
  beforeAll(async () => {
    // Delete the policy if it exists
    try {
      await store.dispatch(api.endpoints.deletePolicy.initiate({ packageName: policyPackageName }));
    } catch (error) {
      console.error("Ignoring error deleting policy since it doesn't exist:", error);
    }

    // Delete the ability if it exists
    try {
      await store.dispatch(
        api.endpoints.deleteAbility.initiate({ packageName: abilityPackageName }),
      );
    } catch (error) {
      console.error("Ignoring error deleting ability since it doesn't exist:", error);
    }

    // Reset the API cache
    store.dispatch(api.util.resetApiState());
  });

  // Clean up test data after running tests
  afterAll(async () => {
    // Delete the policy if it exists
    try {
      await store.dispatch(api.endpoints.deletePolicy.initiate({ packageName: policyPackageName }));
    } catch (error) {
      console.error("Ignoring error deleting policy since it doesn't exist:", error);
    }

    // Delete the ability if it exists
    try {
      await store.dispatch(
        api.endpoints.deleteAbility.initiate({ packageName: abilityPackageName }),
      );
    } catch (error) {
      console.error("Ignoring error deleting ability since it doesn't exist:", error);
    }

    // Reset the API cache
    store.dispatch(api.util.resetApiState());
  });

  describe('Ability with supported policy', () => {
    it('should register policy v0.0.2 and then successfully register ability v0.0.2 that depends on it', async () => {
      // First, create the policy
      const policyResult = await store.dispatch(
        api.endpoints.createPolicy.initiate({
          packageName: policyPackageName,
          policyCreate: policyData,
        }),
      );

      verboseLog(policyResult);
      expect(policyResult).not.toHaveProperty('error');

      // Now create the ability that depends on the policy
      const abilityResult = await store.dispatch(
        api.endpoints.createAbility.initiate({
          packageName: abilityPackageName,
          abilityCreate: abilityData,
        }),
      );

      verboseLog(abilityResult);
      expect(abilityResult).not.toHaveProperty('error');

      // Verify the ability was created successfully
      const { data: abilityResultData } = abilityResult;
      expectAssertObject(abilityResultData);
      expect(abilityResultData).toHaveProperty('packageName', abilityPackageName);

      // Get the ability version to verify supportedPolicies
      const abilityVersionResult = await store.dispatch(
        api.endpoints.getAbilityVersion.initiate({
          packageName: abilityPackageName,
          version: '0.0.2',
        }),
      );

      verboseLog(abilityVersionResult);
      expect(abilityVersionResult).not.toHaveProperty('error');

      const { data: abilityVersionData } = abilityVersionResult;
      expectAssertObject(abilityVersionData);

      // Verify supportedPolicies contains the policy
      expect(abilityVersionData).toHaveProperty('supportedPolicies');
      expect(abilityVersionData.supportedPolicies).toHaveProperty(policyPackageName);
      expect(abilityVersionData.supportedPolicies[policyPackageName]).toBe('0.0.2');

      // Verify policiesNotInRegistry is empty
      expect(abilityVersionData).toHaveProperty('policiesNotInRegistry');
      expect(abilityVersionData.policiesNotInRegistry).toHaveLength(0);
    });
  });

  describe('Ability with policy not in registry', () => {
    it('should identify when registering v0.0.3 when policy v0.0.3 is not in registry', async () => {
      // Try to create ability version 0.0.3 that depends on policy version 0.0.3 (which doesn't exist yet)
      const abilityVersionResult = await store.dispatch(
        api.endpoints.createAbilityVersion.initiate({
          packageName: abilityPackageName,
          version: '0.0.3',
          abilityVersionCreate: abilityVersionData,
        }),
      );

      verboseLog(abilityVersionResult);
      expect(abilityVersionResult).not.toHaveProperty('error');

      const getAbilityVersion = await store.dispatch(
        api.endpoints.getAbilityVersion.initiate({
          packageName: abilityPackageName,
          version: '0.0.3',
        }),
      );

      const { data: abilityVersionResultData } = getAbilityVersion;
      expectAssertObject(abilityVersionResultData);

      expect(abilityVersionResultData).toHaveProperty('policiesNotInRegistry');
      expectAssertArray(abilityVersionResultData.policiesNotInRegistry);
      expect(abilityVersionResultData.policiesNotInRegistry).toContain(
        `${policyPackageName}@0.0.3`,
      );
    });

    it('should successfully register ability v0.0.3 after registering policy v0.0.3', async () => {
      // Delete the ability if it exists
      try {
        await store.dispatch(
          api.endpoints.deleteAbility.initiate({ packageName: abilityPackageName }),
        );
      } catch (error) {
        console.error("Ignoring error deleting ability since it doesn't exist:", error);
      }
      store.dispatch(api.util.resetApiState());

      // Now create the ability that depends on the policy
      await store.dispatch(
        api.endpoints.createAbility.initiate({
          packageName: abilityPackageName,
          abilityCreate: abilityData,
        }),
      );

      // Create policy version 0.0.3
      const policyVersionResult = await store.dispatch(
        api.endpoints.createPolicyVersion.initiate({
          packageName: policyPackageName,
          version: '0.0.3',
          policyVersionCreate: {
            changes: 'Updated version',
          },
        }),
      );

      verboseLog(policyVersionResult);
      expect(policyVersionResult).not.toHaveProperty('error');

      // Now try to create ability version 0.0.3 again
      const abilityVersionResult = await store.dispatch(
        api.endpoints.createAbilityVersion.initiate({
          packageName: abilityPackageName,
          version: '0.0.3',
          abilityVersionCreate: abilityVersionData,
        }),
      );

      verboseLog(abilityVersionResult);
      expect(abilityVersionResult).not.toHaveProperty('error');

      const { data: abilityVersionResultData } = abilityVersionResult;
      expectAssertObject(abilityVersionResultData);

      // Verify supportedPolicies contains the policy
      expect(abilityVersionResultData).toHaveProperty('supportedPolicies');
      expect(abilityVersionResultData.supportedPolicies).toHaveProperty(policyPackageName);
      expect(abilityVersionResultData.supportedPolicies[policyPackageName]).toBe('0.0.3');

      // Verify policiesNotInRegistry is empty
      expect(abilityVersionResultData).toHaveProperty('policiesNotInRegistry');
      expect(abilityVersionResultData.policiesNotInRegistry).toHaveLength(0);
    });
  });
});
