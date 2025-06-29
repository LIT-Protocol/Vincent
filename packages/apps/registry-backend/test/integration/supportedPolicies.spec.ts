import { api, store } from './setup';
import { expectAssertArray, expectAssertObject } from '../assertions';
import { createTestDebugger } from '../debug';

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
  const toolPackageName = '@lit-protocol/vincent-tool-uniswap-swap';

  // Test data for creating a policy
  const policyData = {
    title: 'Spending Limit Policy',
    description: 'A policy that enforces spending limits',
    activeVersion: '1.0.0',
  };

  // Test data for creating a tool
  const toolData = {
    title: 'Uniswap Swap Tool',
    description: 'A tool for swapping tokens on Uniswap',
    activeVersion: '1.0.0',
  };

  // Test data for creating a tool version
  const toolVersionData = {
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

    // Delete the tool if it exists
    try {
      await store.dispatch(api.endpoints.deleteTool.initiate({ packageName: toolPackageName }));
    } catch (error) {
      // Ignore errors if the tool doesn't exist
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

    // Delete the tool if it exists
    try {
      await store.dispatch(api.endpoints.deleteTool.initiate({ packageName: toolPackageName }));
    } catch (error) {
      // Ignore errors if the tool doesn't exist
    }

    // Reset the API cache
    store.dispatch(api.util.resetApiState());
  });

  describe('Tool with supported policy', () => {
    it('should register policy v1.0.0 and then successfully register tool v1.0.0 that depends on it', async () => {
      // First, create the policy
      const policyResult = await store.dispatch(
        api.endpoints.createPolicy.initiate({
          packageName: policyPackageName,
          policyCreate: policyData,
        }),
      );

      verboseLog(policyResult);
      expect(policyResult).not.toHaveProperty('error');

      // Now create the tool that depends on the policy
      const toolResult = await store.dispatch(
        api.endpoints.createTool.initiate({
          packageName: toolPackageName,
          toolCreate: toolData,
        }),
      );

      verboseLog(toolResult);
      expect(toolResult).not.toHaveProperty('error');

      // Verify the tool was created successfully
      const { data: toolResultData } = toolResult;
      expectAssertObject(toolResultData);
      expect(toolResultData).toHaveProperty('packageName', toolPackageName);

      // Get the tool version to verify supportedPolicies
      const toolVersionResult = await store.dispatch(
        api.endpoints.getToolVersion.initiate({
          packageName: toolPackageName,
          version: '1.0.0',
        }),
      );

      verboseLog(toolVersionResult);
      expect(toolVersionResult).not.toHaveProperty('error');

      const { data: toolVersionData } = toolVersionResult;
      expectAssertObject(toolVersionData);

      // Verify supportedPolicies contains the policy
      expect(toolVersionData).toHaveProperty('supportedPolicies');
      expect(toolVersionData.supportedPolicies).toHaveProperty(policyPackageName);
      expect(toolVersionData.supportedPolicies[policyPackageName]).toBe('1.0.0');

      // Verify policiesNotInRegistry is empty
      expect(toolVersionData).toHaveProperty('policiesNotInRegistry');
      expect(toolVersionData.policiesNotInRegistry).toHaveLength(0);
    });
  });

  describe('Tool with policy not in registry', () => {
    it('should identify when registering v1.0.1 when policy v1.0.1 is not in registry', async () => {
      // Try to create tool version 1.0.1 that depends on policy version 1.0.1 (which doesn't exist yet)
      const toolVersionResult = await store.dispatch(
        api.endpoints.createToolVersion.initiate({
          packageName: toolPackageName,
          version: '1.0.1',
          toolVersionCreate: toolVersionData,
        }),
      );

      verboseLog(toolVersionResult);
      expect(toolVersionResult).not.toHaveProperty('error');

      const getToolVersion = await store.dispatch(
        api.endpoints.getToolVersion.initiate({
          packageName: toolPackageName,
          version: '1.0.1',
        }),
      );

      const { data: toolVersionResultData } = getToolVersion;
      expectAssertObject(toolVersionResultData);

      expect(toolVersionResultData).toHaveProperty('policiesNotInRegistry');
      expectAssertArray(toolVersionResultData.policiesNotInRegistry);
      expect(toolVersionResultData.policiesNotInRegistry).toContain(`${policyPackageName}@1.0.1`);
    });

    it('should successfully register tool v1.0.1 after registering policy v1.0.1', async () => {
      // Delete the tool if it exists
      try {
        await store.dispatch(api.endpoints.deleteTool.initiate({ packageName: toolPackageName }));
      } catch (error) {
        // Ignore errors if the tool doesn't exist
      }
      store.dispatch(api.util.resetApiState());

      // Now create the tool that depends on the policy
      await store.dispatch(
        api.endpoints.createTool.initiate({
          packageName: toolPackageName,
          toolCreate: toolData,
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

      // Now try to create tool version 1.0.1 again
      const toolVersionResult = await store.dispatch(
        api.endpoints.createToolVersion.initiate({
          packageName: toolPackageName,
          version: '1.0.1',
          toolVersionCreate: toolVersionData,
        }),
      );

      verboseLog(toolVersionResult);
      expect(toolVersionResult).not.toHaveProperty('error');

      const { data: toolVersionResultData } = toolVersionResult;
      expectAssertObject(toolVersionResultData);

      // Verify supportedPolicies contains the policy
      expect(toolVersionResultData).toHaveProperty('supportedPolicies');
      expect(toolVersionResultData.supportedPolicies).toHaveProperty(policyPackageName);
      expect(toolVersionResultData.supportedPolicies[policyPackageName]).toBe('1.0.1');

      // Verify policiesNotInRegistry is empty
      expect(toolVersionResultData).toHaveProperty('policiesNotInRegistry');
      expect(toolVersionResultData.policiesNotInRegistry).toHaveLength(0);
    });
  });
});
