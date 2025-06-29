import { api, store, withSiweAuth } from './setup';
import { expectAssertObject, hasError } from '../assertions';
import { createTestDebugger } from '../debug';
import { nodeClient } from '@lit-protocol/vincent-registry-sdk';
import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import { Wallet } from 'ethers';
import { createWithSiweAuth } from './setup';

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
const withUnauthorizedSiweAuth = createWithSiweAuth(unauthorizedWallet);

describe('Authorization Integration Tests', () => {
  // Test data for entities
  let testAppId: number;
  let testAppVersion: number;
  let testToolPackageName: string;
  let testToolVersion: string;
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
  };

  const toolData = {
    title: 'Auth Test Tool',
    description: 'Test tool for authorization tests',
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

    // Create Tool
    testToolPackageName = `@lit-protocol/vincent-tool-uniswap-swap`;
    testToolVersion = toolData.activeVersion;
    const toolResult = await store.dispatch(
      api.endpoints.createTool.initiate({
        packageName: testToolPackageName,
        toolCreate: toolData,
      }),
    );
    expect(toolResult).not.toHaveProperty('error');

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

    // Create AppVersionTool
    const appVersionToolResult = await store.dispatch(
      api.endpoints.createAppVersionTool.initiate({
        appId: testAppId,
        appVersion: testAppVersion,
        toolPackageName: testToolPackageName,
        appVersionToolCreate: {
          toolVersion: testToolVersion,
        },
      }),
    );
    expect(appVersionToolResult).not.toHaveProperty('error');

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
      withSiweAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
    );

    // Delete App (this will cascade delete AppVersions and AppVersionTools)
    await store.dispatch(api.endpoints.deleteApp.initiate({ appId: testAppId }));

    // Delete Tool
    await store.dispatch(api.endpoints.deleteTool.initiate({ packageName: testToolPackageName }));

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

  // Test AppVersionTool mutation endpoints
  describe('AppVersionTool Mutation Endpoints', () => {
    it('should fail to create a new app version tool with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.createAppVersionTool.initiate({
          appId: testAppId,
          appVersion: testAppVersion,
          toolPackageName: testToolPackageName,
          appVersionToolCreate: {
            toolVersion: testToolVersion,
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

    it('should fail to update an app version tool with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.editAppVersionTool.initiate({
          appId: testAppId,
          appVersion: testAppVersion,
          toolPackageName: testToolPackageName,
          appVersionToolEdit: {
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

    it('should fail to delete an app version tool with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteAppVersionTool.initiate({
          appId: testAppId,
          appVersion: testAppVersion,
          toolPackageName: testToolPackageName,
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

  // Test Tool mutation endpoints
  describe('Tool Mutation Endpoints', () => {
    it('should fail to update a tool with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.editTool.initiate({
          packageName: testToolPackageName,
          toolEdit: {
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

    it('should fail to delete a tool with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteTool.initiate({ packageName: testToolPackageName }),
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

  // Test ToolVersion mutation endpoints
  describe('ToolVersion Mutation Endpoints', () => {
    it('should fail to create a new tool version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.createToolVersion.initiate({
          packageName: testToolPackageName,
          version: '1.0.1',
          toolVersionCreate: {
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

    it('should fail to update a tool version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.editToolVersion.initiate({
          packageName: testToolPackageName,
          version: testToolVersion,
          toolVersionEdit: {
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

    it('should fail to delete a tool version with unauthorized wallet', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteToolVersion.initiate({
          packageName: testToolPackageName,
          version: testToolVersion,
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
    let ownershipTestToolPackageName: string;
    let ownershipTestPolicyPackageName: string;

    // Create new tool and policy for ownership tests
    beforeAll(async () => {
      verboseLog('Ownership Change Tests - Setup');

      // Reset the API client to use the authorized wallet
      const { setBaseQueryFn } = nodeClient;
      setBaseQueryFn(
        withSiweAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
      );

      // Explicitly delete both tools and the policy before creating new ones
      try {
        await store.dispatch(
          api.endpoints.deleteTool.initiate({
            packageName: '@lit-protocol/vincent-tool-uniswap-swap',
          }),
        );
        verboseLog('Deleted @lit-protocol/vincent-tool-uniswap-swap');
      } catch (error: any) {
        verboseLog(
          `Error deleting @lit-protocol/vincent-tool-uniswap-swap (may not exist): ${error.message}`,
        );
      }

      try {
        await store.dispatch(
          api.endpoints.deleteTool.initiate({
            packageName: '@lit-protocol/vincent-tool-erc20-approval',
          }),
        );
        verboseLog('Deleted @lit-protocol/vincent-tool-erc20-approval');
      } catch (error: any) {
        verboseLog(
          `Error deleting @lit-protocol/vincent-tool-erc20-approval (may not exist): ${error.message}`,
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

      // Create a new tool for ownership tests
      ownershipTestToolPackageName = `@lit-protocol/vincent-tool-uniswap-swap`;
      const toolResult = await store.dispatch(
        api.endpoints.createTool.initiate({
          packageName: ownershipTestToolPackageName,
          toolCreate: {
            title: 'Ownership Test Tool',
            description: 'Tool for testing ownership changes',
            activeVersion: '1.0.0',
          },
        }),
      );
      expect(toolResult).not.toHaveProperty('error');

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
        withSiweAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
      );

      // Delete the test tool and policy
      await store.dispatch(
        api.endpoints.deleteTool.initiate({
          packageName: ownershipTestToolPackageName,
        }),
      );
      await store.dispatch(
        api.endpoints.deletePolicy.initiate({
          packageName: ownershipTestPolicyPackageName,
        }),
      );
    });

    describe('Tool Ownership Change', () => {
      it('should change tool owner to unauthorized wallet address', async () => {
        // Reset the API client to use the authorized wallet
        const { setBaseQueryFn } = nodeClient;
        setBaseQueryFn(
          withSiweAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
        );

        const result = await store.dispatch(
          api.endpoints.changeToolOwner.initiate({
            packageName: ownershipTestToolPackageName,
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

      it('should allow the new owner (previously unauthorized) to edit the tool', async () => {
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
          api.endpoints.editTool.initiate({
            packageName: ownershipTestToolPackageName,
            toolEdit: updateData,
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertObject(data);

        // Verify the update was successful
        expect(data.description).toBe(updateData.description);
      });

      it('should allow the new owner (previously unauthorized) to delete the tool', async () => {
        // Create a new tool version to delete
        const versionResult = await store.dispatch(
          api.endpoints.createToolVersion.initiate({
            packageName: ownershipTestToolPackageName,
            version: '1.0.1',
            toolVersionCreate: {
              changes: 'Version to be deleted by new owner',
            },
          }),
        );

        expect(versionResult).not.toHaveProperty('error');

        // Delete the tool version
        const deleteResult = await store.dispatch(
          api.endpoints.deleteToolVersion.initiate({
            packageName: ownershipTestToolPackageName,
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
          withSiweAuth(fetchBaseQuery({ baseUrl: `http://localhost:${process.env.PORT || 3000}` })),
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
