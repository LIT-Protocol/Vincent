import { api, store } from './setup';
import { expectAssertArray, expectAssertObject, hasError } from '../assertions';
import { createTestDebugger } from '../debug';

// Create a debug instance for this file
const debug = createTestDebugger('tool');

// For backwards compatibility
const verboseLog = (value: any) => {
  debug(value);
};

describe('Tool API Integration Tests', () => {
  beforeAll(async () => {
    verboseLog('Tool API Integration Tests');
  });

  let testPackageName: string;
  let testToolVersion: string;

  // Expected IPFS CID for the tool package
  const expectedToolIpfsCid = 'QmWWBMDT3URSp8sX9mFZjhAoufSk5kia7bpp84yxq9WHFd';

  // Test data for creating a tool
  const toolData = {
    title: 'Test Tool',
    description: 'Test tool for integration tests',
    activeVersion: '1.0.0',
  };

  // Test data for creating a tool version
  const toolVersionData = {
    changes: 'Initial version',
  };

  describe('GET /tools', () => {
    it('should return a list of tools', async () => {
      const result = await store.dispatch(api.endpoints.listAllTools.initiate());

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      expectAssertArray(result.data);
    });
  });

  describe('POST /tool/{packageName}', () => {
    it('should create a new tool', async () => {
      // Generate a unique package name for testing
      testPackageName = `@lit-protocol/vincent-tool-erc20-approval`;
      testToolVersion = toolData.activeVersion;

      const result = await store.dispatch(
        api.endpoints.createTool.initiate({
          packageName: testPackageName,
          toolCreate: toolData,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        packageName: testPackageName,
        ...toolData,
      });
    });
  });

  describe('GET /tool/{packageName}', () => {
    it('should return a specific tool', async () => {
      const result = await store.dispatch(
        api.endpoints.getTool.initiate({ packageName: testPackageName }),
      );
      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        packageName: testPackageName,
        ...toolData,
      });
    });

    it('should return 404 for non-existent tool', async () => {
      const result = await store.dispatch(
        api.endpoints.getTool.initiate({ packageName: `@vincent/non-existent-tool-${Date.now()}` }),
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

  describe('PUT /tool/{packageName}', () => {
    it('should update a tool', async () => {
      const updateData = {
        description: 'Updated test tool description!',
        deploymentStatus: 'test' as const,
      };

      const result = await store.dispatch(
        api.endpoints.editTool.initiate({
          packageName: testPackageName,
          toolEdit: updateData,
        }),
      );
      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      // Reset the API cache so we can verify the change
      store.dispatch(api.util.resetApiState());

      const getResult = await store.dispatch(
        api.endpoints.getTool.initiate({ packageName: testPackageName }),
      );

      verboseLog(getResult);

      const { data } = getResult;
      expectAssertObject(data);

      expect(data).toHaveProperty('description', updateData.description);
      expect(data).toHaveProperty('deploymentStatus', updateData.deploymentStatus);
    });
  });

  describe('POST /tool/{packageName}/version/{version}', () => {
    it('should create a new tool version', async () => {
      const result = await store.dispatch(
        api.endpoints.createToolVersion.initiate({
          packageName: testPackageName,
          version: '1.0.1',
          toolVersionCreate: toolVersionData,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toHaveProperty('changes', toolVersionData.changes);
      expect(data).toHaveProperty('version', '1.0.1');

      // Verify ipfsCid is set
      expect(data).toHaveProperty('ipfsCid', 'QmWHK5KsJitDwW1zHRoiJQdQECASzSjjphp4Rg8YqB6BsX');
    });
  });

  describe('GET /tool/{packageName}/versions', () => {
    it('should list all versions of a tool', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.getToolVersions.initiate({ packageName: testPackageName }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertArray(data);

      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /tool/{packageName}/version/{version}', () => {
    it('should get a specific tool version', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.getToolVersion.initiate({
          packageName: testPackageName,
          version: testToolVersion,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toHaveProperty('version', testToolVersion);
      expect(data).toHaveProperty('changes', toolVersionData.changes);

      // Verify ipfsCid is set
      expect(data).toHaveProperty('ipfsCid', expectedToolIpfsCid);
    });

    it('should return 404 for non-existent version', async () => {
      const result = await store.dispatch(
        api.endpoints.getToolVersion.initiate({
          packageName: testPackageName,
          version: '999.999.999',
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

  describe('PUT /tool/{packageName}/version/{version}', () => {
    it('should update a tool version', async () => {
      store.dispatch(api.util.resetApiState());

      const changes = 'Updated changes description for tool version' as const;

      {
        const result = await store.dispatch(
          api.endpoints.editToolVersion.initiate({
            packageName: testPackageName,
            version: testToolVersion,
            toolVersionEdit: {
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
          api.endpoints.getToolVersion.initiate({
            packageName: testPackageName,
            version: testToolVersion,
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

  describe('DELETE /tool/{packageName}/version/{version}', () => {
    it('should delete a tool version', async () => {
      // Create a new version to delete
      const versionToDelete = '1.0.1';

      const result = await store.dispatch(
        api.endpoints.deleteToolVersion.initiate({
          packageName: testPackageName,
          version: versionToDelete,
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

      // Verify the version is deleted by checking for a 404
      const getResult = await store.dispatch(
        api.endpoints.getToolVersion.initiate({
          packageName: testPackageName,
          version: versionToDelete,
        }),
      );

      verboseLog(getResult);
      expect(getResult).toHaveProperty('error');
      expect(hasError(getResult)).toBe(true);

      if (hasError(getResult)) {
        const { error } = getResult;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(404);
      }
    });
  });

  describe('DELETE /tool/{packageName}', () => {
    it('should delete a tool and all its versions', async () => {
      // First, delete the tool
      const result = await store.dispatch(
        api.endpoints.deleteTool.initiate({ packageName: testPackageName }),
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

      // Verify the tool is deleted by checking for a 404
      const getResult = await store.dispatch(
        api.endpoints.getTool.initiate({ packageName: testPackageName }),
      );

      verboseLog(getResult);
      expect(getResult).toHaveProperty('error');
      expect(hasError(getResult)).toBe(true);

      if (hasError(getResult)) {
        const { error } = getResult;
        expectAssertObject(error);
        // @ts-expect-error it's a test
        expect(error.status).toBe(404);
      }
    });
  });
});
