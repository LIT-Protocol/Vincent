import { api, store } from './setup';
import { expectAssertArray, expectAssertObject } from '../assertions';
import { createTestDebugger } from '../debug';

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
    it('should create an app version tool for the first app version using the first tool', async () => {
      const result = await store.dispatch(
        api.endpoints.createAppVersionTool.initiate({
          appId: testAppId!,
          appVersion: firstAppVersion,
          toolPackageName: testToolPackageName1,
          appVersionToolCreate: appVersionToolData1,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        appId: testAppId,
        appVersion: firstAppVersion,
        toolPackageName: testToolPackageName1,
        toolVersion: appVersionToolData1.toolVersion,
        hiddenSupportedPolicies: appVersionToolData1.hiddenSupportedPolicies,
      });
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

      expect(data).toHaveLength(1);
      // @ts-expect-error It's a test
      expect(data[0]).toMatchObject({
        appId: testAppId,
        appVersion: firstAppVersion,
        toolPackageName: testToolPackageName1,
        toolVersion: appVersionToolData1.toolVersion,
      });
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
    it('should edit an app version tool', async () => {
      const updatedPolicies = [
        '@vincent/updated-policy1',
        '@vincent/updated-policy2',
        '@vincent/updated-policy3',
      ];

      {
        // Use the generated client to update the hiddenSupportedPolicies
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
            version: firstAppVersion,
          }),
        );

        verboseLog(result);
        expect(result).not.toHaveProperty('error');

        const { data } = result;
        expectAssertArray(data);

        expect(data).toHaveLength(1);
        // @ts-expect-error It's a test
        expect(data[0]).toMatchObject({
          appId: testAppId,
          appVersion: firstAppVersion,
          toolPackageName: testToolPackageName1,
          toolVersion: appVersionToolData1.toolVersion,
          hiddenSupportedPolicies: updatedPolicies,
        });
      }
    });
  });

  describe('DELETE /app/:appId/version/:version/tool/:toolPackageName', () => {
    it('should delete an app version tool', async () => {
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
