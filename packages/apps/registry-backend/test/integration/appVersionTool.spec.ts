import { expectAssertArray, expectAssertObject, hasError } from '../assertions';
import { createTestDebugger } from '../debug';
import { api, store, generateRandomEthAddresses, getDefaultWalletContractClient } from './setup';

// Create a debug instance for this file
const debug = createTestDebugger('appVersionTool');

// For backwards compatibility
const verboseLog = (value: any) => {
  debug(value);
};

/* eslint-disable @typescript-eslint/no-non-null-assertion */
describe('AppVersionTool API Integration Tests', () => {
  beforeAll(async () => {
    verboseLog('AppVersionTool API Integration Tests');
  });

  // Variables to store test data
  let testAppId: number | undefined;
  let testToolPackageName1: string;
  let testToolPackageName2: string;
  const firstAppVersion = 1; // Initial app version
  let secondAppVersion: number;

  // Test data for creating an app
  const appData = {
    name: 'Test App for AppVersionTool',
    description: 'Test app for AppVersionTool integration tests',
    contactEmail: 'test@example.com',
    appUserUrl: 'https://example.com/app',
    logo: 'https://example.com/logo.png',
    redirectUris: ['https://example.com/callback'],
    deploymentStatus: 'dev' as const,
    delegateeAddresses: generateRandomEthAddresses(2),
  };

  // Test data for creating tools
  const toolData1 = {
    title: 'Test Tool 1',
    description: 'Test tool 1 for AppVersionTool integration tests',
    activeVersion: '1.0.0',
  };

  const toolData2 = {
    title: 'Test Tool 2',
    description: 'Test tool 2 for AppVersionTool integration tests',
    activeVersion: '1.0.0',
  };

  // Test data for creating app versions
  const appVersionData = {
    changes: 'Second version for AppVersionTool tests',
  };

  // Test data for creating app version tools
  const appVersionToolData1 = {
    toolVersion: '1.0.0',
    hiddenSupportedPolicies: ['@vincent/policy1', '@vincent/policy2'],
  };

  const appVersionToolData2 = {
    toolVersion: '1.0.0',
  };

  describe('Setup: Create tools', () => {
    it('should create the first tool', async () => {
      // Generate a unique package name for testing
      testToolPackageName1 = `@lit-protocol/vincent-tool-erc20-approval`;

      const result = await store.dispatch(
        api.endpoints.createTool.initiate({
          packageName: testToolPackageName1,
          toolCreate: toolData1,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        packageName: testToolPackageName1,
        ...toolData1,
      });
    });

    it('should create the second tool', async () => {
      // Generate a unique package name for testing
      testToolPackageName2 = `@lit-protocol/vincent-tool-uniswap-swap`;

      const result = await store.dispatch(
        api.endpoints.createTool.initiate({
          packageName: testToolPackageName2,
          toolCreate: toolData2,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        packageName: testToolPackageName2,
        ...toolData2,
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

  describe('GET /app/:appId/version/:version/tools', () => {
    it('should return an empty list of tools for a new app version', async () => {
      const result = await store.dispatch(
        api.endpoints.listAppVersionTools.initiate({
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

  describe('POST /app/:appId/version/:version/tool/:toolPackageName', () => {
    it('should fail to create an app version tool for an app version that is already on-chain', async () => {
      const result = await store.dispatch(
        api.endpoints.createAppVersionTool.initiate({
          appId: testAppId!,
          appVersion: firstAppVersion,
          toolPackageName: testToolPackageName1,
          appVersionToolCreate: appVersionToolData1,
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

    it('should create app version tools for the second app version using both tools', async () => {
      // Create app version tool for the second app version using the first tool
      const result1 = await store.dispatch(
        api.endpoints.createAppVersionTool.initiate({
          appId: testAppId!,
          appVersion: secondAppVersion,
          toolPackageName: testToolPackageName1,
          appVersionToolCreate: appVersionToolData1,
        }),
      );

      verboseLog(result1);
      expect(result1).not.toHaveProperty('error');

      const { data: data1 } = result1;
      expectAssertObject(data1);

      expect(data1).toMatchObject({
        appId: testAppId,
        appVersion: secondAppVersion,
        toolPackageName: testToolPackageName1,
        toolVersion: appVersionToolData1.toolVersion,
        hiddenSupportedPolicies: appVersionToolData1.hiddenSupportedPolicies,
      });

      // Create app version tool for the second app version using the second tool
      const result2 = await store.dispatch(
        api.endpoints.createAppVersionTool.initiate({
          appId: testAppId!,
          appVersion: secondAppVersion,
          toolPackageName: testToolPackageName2,
          appVersionToolCreate: appVersionToolData2,
        }),
      );

      verboseLog(result2);
      expect(result2).not.toHaveProperty('error');

      const { data: data2 } = result2;
      expectAssertObject(data2);

      expect(data2).toMatchObject({
        appId: testAppId,
        appVersion: secondAppVersion,
        toolPackageName: testToolPackageName2,
        toolVersion: appVersionToolData2.toolVersion,
      });
    });

    it('should return 409 when trying to create a duplicate app version tool', async () => {
      const result = await store.dispatch(
        api.endpoints.createAppVersionTool.initiate({
          appId: testAppId!,
          appVersion: firstAppVersion,
          toolPackageName: testToolPackageName1,
          appVersionToolCreate: appVersionToolData1,
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

  describe('GET /app/:appId/version/:version/tools', () => {
    it('should list all tools for the first app version', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.listAppVersionTools.initiate({
          appId: testAppId!,
          version: firstAppVersion,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertArray(data);

      // The first app version is on-chain, so tool creation should be blocked
      // Therefore, it should have 0 tools, not 1
      expect(data).toHaveLength(0);
    });

    it('should list all tools for the second app version', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.listAppVersionTools.initiate({
          appId: testAppId!,
          version: secondAppVersion,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertArray(data);

      expect(data).toHaveLength(2);

      // Check that both tools are in the list
      // @ts-expect-error It's a test
      const toolPackageNames = data.map((tool) => tool.toolPackageName);
      expect(toolPackageNames).toContain(testToolPackageName1);
      expect(toolPackageNames).toContain(testToolPackageName2);
    });
  });

  describe('PUT /app/:appId/version/:version/tool/:toolPackageName', () => {
    it('should fail to edit an app version tool for an app version that is already on-chain', async () => {
      const updatedPolicies = [
        '@vincent/updated-policy1',
        '@vincent/updated-policy2',
        '@vincent/updated-policy3',
      ];

      {
        // Try to update a tool for the first app version which is already on-chain
        const result = await store.dispatch(
          api.endpoints.editAppVersionTool.initiate({
            appId: testAppId!,
            appVersion: firstAppVersion,
            toolPackageName: testToolPackageName1,
            appVersionToolEdit: {
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

    it('should edit an app version tool for an app version that is not on-chain', async () => {
      const updatedPolicies = [
        '@vincent/updated-policy1',
        '@vincent/updated-policy2',
        '@vincent/updated-policy3',
      ];

      {
        // Use the generated client to update the hiddenSupportedPolicies for a tool in the second app version
        const result = await store.dispatch(
          api.endpoints.editAppVersionTool.initiate({
            appId: testAppId!,
            appVersion: secondAppVersion,
            toolPackageName: testToolPackageName1,
            appVersionToolEdit: {
              hiddenSupportedPolicies: updatedPolicies,
            },
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data: updatedTool } = result;
        expectAssertObject(updatedTool);
        expect(updatedTool).toHaveProperty('hiddenSupportedPolicies');
        expect(updatedTool.hiddenSupportedPolicies).toEqual(updatedPolicies);
      }

      // Verify the update by fetching the tool again
      store.dispatch(api.util.resetApiState());

      {
        const result = await store.dispatch(
          api.endpoints.listAppVersionTools.initiate({
            appId: testAppId!,
            version: secondAppVersion,
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertArray(data);

        // Find the updated tool
        // @ts-expect-error It's a test
        const updatedTool = data.find((tool) => tool.toolPackageName === testToolPackageName1);
        expect(updatedTool).toBeDefined();
        expect(updatedTool).toMatchObject({
          appId: testAppId,
          appVersion: secondAppVersion,
          toolPackageName: testToolPackageName1,
          toolVersion: appVersionToolData1.toolVersion,
          hiddenSupportedPolicies: updatedPolicies,
        });
      }
    });
  });

  describe('DELETE /app/:appId/version/:version/tool/:toolPackageName', () => {
    it('should fail to delete an app version tool for an app version that is already on-chain', async () => {
      // Try to delete a tool from the first app version which is already on-chain
      const result = await store.dispatch(
        api.endpoints.deleteAppVersionTool.initiate({
          appId: testAppId!,
          appVersion: firstAppVersion,
          toolPackageName: testToolPackageName1,
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

    it('should delete an app version tool for an app version that is not on-chain', async () => {
      // Delete the second tool from the second app version
      const result = await store.dispatch(
        api.endpoints.deleteAppVersionTool.initiate({
          appId: testAppId!,
          appVersion: secondAppVersion,
          toolPackageName: testToolPackageName2,
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

      // Verify the tool is deleted by checking the list of tools
      const getToolsResult = await store.dispatch(
        api.endpoints.listAppVersionTools.initiate({
          appId: testAppId!,
          version: secondAppVersion,
        }),
      );

      expect(getToolsResult).not.toHaveProperty('error');
      const { data: toolsData } = getToolsResult;
      expectAssertArray(toolsData);

      // Should now only have one tool for the second app version
      expect(toolsData).toHaveLength(1);

      // And it should be the first tool, not the deleted second tool
      // @ts-expect-error It's a test
      expect(toolsData[0].toolPackageName).toBe(testToolPackageName1);
      // @ts-expect-error It's a test
      expect(toolsData[0].toolPackageName).not.toBe(testToolPackageName2);
    });
  });

  describe('DELETE /app/:appId', () => {
    it('should delete an app and all its versions and tools', async () => {
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

      // Verify the app version tools are deleted by checking for an empty list
      const getToolsResult = await store.dispatch(
        api.endpoints.listAppVersionTools.initiate({
          appId: testAppId!,
          version: firstAppVersion,
        }),
      );

      // This should either return an error or an empty array
      if (!getToolsResult.isError) {
        const { data: toolsData } = getToolsResult;
        expectAssertArray(toolsData);
        expect(toolsData).toHaveLength(0);
      }
    });
  });

  // Clean up the tools created for the test
  describe('Cleanup: Delete tools', () => {
    it('should delete the first tool', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteTool.initiate({ packageName: testToolPackageName1 }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');
    });

    it('should delete the second tool', async () => {
      const result = await store.dispatch(
        api.endpoints.deleteTool.initiate({ packageName: testToolPackageName2 }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');
    });
  });
});
