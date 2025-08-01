import { expectAssertArray, expectAssertObject, hasError } from '../assertions';
import { createTestDebugger } from '../debug';
import { api, store } from './setup';

// Create a debug instance for this file
const debug = createTestDebugger('ability');

// For backwards compatibility
const verboseLog = (value: any) => {
  debug(value);
};

describe('Ability API Integration Tests', () => {
  beforeAll(async () => {
    verboseLog('Ability API Integration Tests');
  });

  let testPackageName: string;
  let testAbilityVersion: string;

  // Expected IPFS CID for the ability package
  const expectedAbilityIpfsCid = 'QmWWBMDT3URSp8sX9mFZjhAoufSk5kia7bpp84yxq9WHFd';

  // Test data for creating an ability
  const abilityData = {
    title: 'Test Ability',
    description: 'Test ability for integration tests',
    activeVersion: '1.0.0',
    logo: 'iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAIAAAACDbGyAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOvwAADr8BOAVTJAAAAA5JREFUGFdj/M+ACAAAAAD//wE7AnsAAAAAAElFTkSuQmCC',
  };

  // Test data for creating an ability version
  const abilityVersionData = {
    changes: 'Initial version',
  };

  describe('GET /abilities', () => {
    it('should return a list of abilities', async () => {
      const result = await store.dispatch(api.endpoints.listAllAbilities.initiate());

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      expectAssertArray(result.data);
    });
  });

  describe('POST /ability/{packageName}', () => {
    it('should create a new ability', async () => {
      // Generate a unique package name for testing
      testPackageName = `@lit-protocol/vincent-ability-erc20-approval`;
      testAbilityVersion = abilityData.activeVersion;

      const result = await store.dispatch(
        api.endpoints.createAbility.initiate({
          packageName: testPackageName,
          abilityCreate: abilityData,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        packageName: testPackageName,
        ...abilityData,
      });
    });
  });

  describe('GET /ability/{packageName}', () => {
    it('should return a specific ability', async () => {
      const result = await store.dispatch(
        api.endpoints.getAbility.initiate({ packageName: testPackageName }),
      );
      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toMatchObject({
        packageName: testPackageName,
        ...abilityData,
      });
    });

    it('should return 404 for non-existent ability', async () => {
      const result = await store.dispatch(
        api.endpoints.getAbility.initiate({
          packageName: `@vincent/non-existent-ability-${Date.now()}`,
        }),
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

  describe('PUT /ability/{packageName}', () => {
    it('should update an ability', async () => {
      const updateData = {
        description: 'Updated test ability description!',
        deploymentStatus: 'test' as const,
      };

      const result = await store.dispatch(
        api.endpoints.editAbility.initiate({
          packageName: testPackageName,
          abilityEdit: updateData,
        }),
      );
      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      // Reset the API cache so we can verify the change
      store.dispatch(api.util.resetApiState());

      const getResult = await store.dispatch(
        api.endpoints.getAbility.initiate({ packageName: testPackageName }),
      );

      verboseLog(getResult);

      const { data } = getResult;
      expectAssertObject(data);

      expect(data).toHaveProperty('description', updateData.description);
      expect(data).toHaveProperty('deploymentStatus', updateData.deploymentStatus);
    });
  });

  describe('POST /ability/{packageName}/version/{version}', () => {
    it('should create a new ability version', async () => {
      const result = await store.dispatch(
        api.endpoints.createAbilityVersion.initiate({
          packageName: testPackageName,
          version: '1.0.1',
          abilityVersionCreate: abilityVersionData,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toHaveProperty('changes', abilityVersionData.changes);
      expect(data).toHaveProperty('version', '1.0.1');

      // Verify ipfsCid is set
      expect(data).toHaveProperty('ipfsCid', 'QmWHK5KsJitDwW1zHRoiJQdQECASzSjjphp4Rg8YqB6BsX');
    });
  });

  describe('GET /ability/{packageName}/versions', () => {
    it('should list all versions of an ability', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.getAbilityVersions.initiate({ packageName: testPackageName }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertArray(data);

      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('GET /ability/{packageName}/version/{version}', () => {
    it('should get a specific ability version', async () => {
      store.dispatch(api.util.resetApiState());

      const result = await store.dispatch(
        api.endpoints.getAbilityVersion.initiate({
          packageName: testPackageName,
          version: testAbilityVersion,
        }),
      );

      verboseLog(result);
      expect(result).not.toHaveProperty('error');

      const { data } = result;
      expectAssertObject(data);

      expect(data).toHaveProperty('version', testAbilityVersion);
      expect(data).toHaveProperty('changes', abilityVersionData.changes);

      // Verify ipfsCid is set
      expect(data).toHaveProperty('ipfsCid', expectedAbilityIpfsCid);
    });

    it('should return 404 for non-existent version', async () => {
      const result = await store.dispatch(
        api.endpoints.getAbilityVersion.initiate({
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

  describe('PUT /ability/{packageName}/version/{version}', () => {
    it('should update an ability version', async () => {
      store.dispatch(api.util.resetApiState());

      const changes = 'Updated changes description for ability version' as const;

      {
        const result = await store.dispatch(
          api.endpoints.editAbilityVersion.initiate({
            packageName: testPackageName,
            version: testAbilityVersion,
            abilityVersionEdit: {
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
          api.endpoints.getAbilityVersion.initiate({
            packageName: testPackageName,
            version: testAbilityVersion,
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

  describe('DELETE /ability/{packageName}/version/{version}', () => {
    it('should delete an ability version', async () => {
      // Create a new version to delete
      const versionToDelete = '1.0.1';

      const result = await store.dispatch(
        api.endpoints.deleteAbilityVersion.initiate({
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
        api.endpoints.getAbilityVersion.initiate({
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

  describe('DELETE /ability/{packageName}', () => {
    it('should delete an ability and all its versions', async () => {
      // First, delete the ability
      const result = await store.dispatch(
        api.endpoints.deleteAbility.initiate({ packageName: testPackageName }),
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

      // Verify the ability is deleted by checking for a 404
      const getResult = await store.dispatch(
        api.endpoints.getAbility.initiate({ packageName: testPackageName }),
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
