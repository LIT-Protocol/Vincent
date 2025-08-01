import { expectAssertArray, expectAssertObject } from '../assertions';
import { createTestDebugger } from '../debug';
import { api, store } from './setup';

// Create a debug instance for this file
const debug = createTestDebugger('supportedPolicies');

// For backwards compatibility
const verboseLog = (value: any) => {
  debug(value);
};

describe('Supported Policies Integration Tests', () => {
  beforeAll(async () => {
    verboseLog('Supported Policies Integration Tests');
  });

  // Package names for testing
  const policyPackageName = '@lit-protocol/vincent-policy-spending-limit';
  const abilityPackageName = '@lit-protocol/vincent-ability-uniswap-swap';

  // Test data for creating a policy
  const policyData = {
    title: 'Spending Limit Policy',
    description: 'A policy that enforces spending limits',
    activeVersion: '1.0.0',
  };

  // Test data for creating an ability
  const abilityData = {
    title: 'Uniswap Swap Ability',
    description: 'An ability for swapping tokens on Uniswap',
    activeVersion: '1.0.0',
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
      // Ignore errors if the policy doesn't exist
    }

    // Delete the ability if it exists
    try {
      await store.dispatch(
        api.endpoints.deleteAbility.initiate({ packageName: abilityPackageName }),
      );
    } catch (error) {
      // Ignore errors if the ability doesn't exist
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
      // Ignore errors if the policy doesn't exist
    }

    // Delete the ability if it exists
    try {
      await store.dispatch(
        api.endpoints.deleteAbility.initiate({ packageName: abilityPackageName }),
      );
    } catch (error) {
      // Ignore errors if the ability doesn't exist
    }

    // Reset the API cache
    store.dispatch(api.util.resetApiState());
  });

  describe('Ability with supported policy', () => {
    it('should register policy v1.0.0 and then successfully register ability v1.0.0 that depends on it', async () => {
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
          version: '1.0.0',
        }),
      );

      verboseLog(abilityVersionResult);
      expect(abilityVersionResult).not.toHaveProperty('error');

      const { data: abilityVersionData } = abilityVersionResult;
      expectAssertObject(abilityVersionData);

      // Verify supportedPolicies contains the policy
      expect(abilityVersionData).toHaveProperty('supportedPolicies');
      expect(abilityVersionData.supportedPolicies).toHaveProperty(policyPackageName);
      expect(abilityVersionData.supportedPolicies[policyPackageName]).toBe('1.0.0');

      // Verify policiesNotInRegistry is empty
      expect(abilityVersionData).toHaveProperty('policiesNotInRegistry');
      expect(abilityVersionData.policiesNotInRegistry).toHaveLength(0);
    });
  });

  describe('Ability with policy not in registry', () => {
    it('should identify when registering v1.0.1 when policy v1.0.1 is not in registry', async () => {
      // Try to create ability version 1.0.1 that depends on policy version 1.0.1 (which doesn't exist yet)
      const abilityVersionResult = await store.dispatch(
        api.endpoints.createAbilityVersion.initiate({
          packageName: abilityPackageName,
          version: '1.0.1',
          abilityVersionCreate: abilityVersionData,
        }),
      );

      verboseLog(abilityVersionResult);
      expect(abilityVersionResult).not.toHaveProperty('error');

      const getAbilityVersion = await store.dispatch(
        api.endpoints.getAbilityVersion.initiate({
          packageName: abilityPackageName,
          version: '1.0.1',
        }),
      );

      const { data: abilityVersionResultData } = getAbilityVersion;
      expectAssertObject(abilityVersionResultData);

      expect(abilityVersionResultData).toHaveProperty('policiesNotInRegistry');
      expectAssertArray(abilityVersionResultData.policiesNotInRegistry);
      expect(abilityVersionResultData.policiesNotInRegistry).toContain(
        `${policyPackageName}@1.0.1`,
      );
    });

    it('should successfully register ability v1.0.1 after registering policy v1.0.1', async () => {
      // Delete the ability if it exists
      try {
        await store.dispatch(
          api.endpoints.deleteAbility.initiate({ packageName: abilityPackageName }),
        );
      } catch (error) {
        // Ignore errors if the ability doesn't exist
      }
      store.dispatch(api.util.resetApiState());

      // Now create the ability that depends on the policy
      await store.dispatch(
        api.endpoints.createAbility.initiate({
          packageName: abilityPackageName,
          abilityCreate: abilityData,
        }),
      );

      // Create policy version 1.0.1
      const policyVersionResult = await store.dispatch(
        api.endpoints.createPolicyVersion.initiate({
          packageName: policyPackageName,
          version: '1.0.1',
          policyVersionCreate: {
            changes: 'Updated version',
          },
        }),
      );

      verboseLog(policyVersionResult);
      expect(policyVersionResult).not.toHaveProperty('error');

      // Now try to create ability version 1.0.1 again
      const abilityVersionResult = await store.dispatch(
        api.endpoints.createAbilityVersion.initiate({
          packageName: abilityPackageName,
          version: '1.0.1',
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
      expect(abilityVersionResultData.supportedPolicies[policyPackageName]).toBe('1.0.1');

      // Verify policiesNotInRegistry is empty
      expect(abilityVersionResultData).toHaveProperty('policiesNotInRegistry');
      expect(abilityVersionResultData.policiesNotInRegistry).toHaveLength(0);
    });
  });
});
