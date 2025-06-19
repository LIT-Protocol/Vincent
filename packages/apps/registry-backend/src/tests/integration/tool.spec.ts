import { createClient } from './setup';

describe('Tool API Integration Tests', () => {
  const client = createClient();
  const testToolPackageName = 'lodash';
  const testToolVersion = '4.17.21';

  describe('GET /tools', () => {
    it('should return a list of tools', async () => {
      const response = await client.get('/tools');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /tool', () => {
    it('should create a new tool', async () => {
      const toolData = {
        packageName: testToolPackageName,
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test tool for integration tests',
        version: testToolVersion,
      };

      const response = await client.post('/tool').send(toolData);
      expect(response.status).toBe(201);
      expect(response.body.packageName).toBe(testToolPackageName);
      expect(response.body.description).toBe(toolData.description);
    });

    it('should reject invalid package names', async () => {
      const invalidToolData = {
        packageName: 'Invalid Package Name', // Contains spaces, which is invalid
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test tool with invalid package name',
        version: '4.17.21', // Valid version
      };

      const response = await client.post('/tool').send(invalidToolData);
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid NPM package name');
    });

    it('should reject invalid versions', async () => {
      const invalidVersionData = {
        packageName: 'lodash-test',
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test tool with invalid version',
        version: 'not-a-valid-version', // Not a valid semver
      };

      const response = await client.post('/tool').send(invalidVersionData);
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid semantic version');
    });
  });

  describe('GET /tool/:packageName', () => {
    it('should return a specific tool', async () => {
      const response = await client.get(`/tool/${testToolPackageName}`);
      expect(response.status).toBe(200);
      expect(response.body.packageName).toBe(testToolPackageName);
    });

    it('should return 404 for non-existent tool', async () => {
      const response = await client.get('/tool/non-existent-tool');
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /tool/:packageName', () => {
    it('should update a tool', async () => {
      const updateData = {
        description: 'Updated test tool description',
      };

      const response = await client.put(`/tool/${testToolPackageName}`).send(updateData);
      expect(response.status).toBe(200);

      // Verify the update
      const getResponse = await client.get(`/tool/${testToolPackageName}`);
      expect(getResponse.body.description).toBe(updateData.description);
    });
  });

  describe('POST /tool/:packageName/owner', () => {
    it('should change the tool owner', async () => {
      const newOwnerData = {
        authorWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      };

      const response = await client.post(`/tool/${testToolPackageName}/owner`).send(newOwnerData);
      expect(response.status).toBe(200);

      // Verify the owner change
      const getResponse = await client.get(`/tool/${testToolPackageName}`);
      expect(getResponse.body.authorWalletAddress).toBe(newOwnerData.authorWalletAddress);
    });
  });

  describe('POST /tool/:packageName/version/:version', () => {
    it('should create a new tool version', async () => {
      const newVersion = '4.17.20';
      const versionData = {
        changes: 'Added new features',
        description: 'New version description',
      };

      const response = await client
        .post(`/tool/${testToolPackageName}/version/${newVersion}`)
        .send(versionData);

      expect(response.status).toBe(201);
      expect(response.body.version).toBe(newVersion);
      expect(response.body.changes).toBe(versionData.changes);
    });

    it('should reject invalid versions', async () => {
      const invalidVersion = 'not-a-valid-version';
      const versionData = {
        changes: 'This should fail',
        description: 'Version with invalid format',
        repository: 'https://github.com/lodash/lodash',
      };

      const response = await client
        .post(`/tool/${testToolPackageName}/version/${invalidVersion}`)
        .send(versionData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid semantic version');
    });
  });

  describe('GET /tool/:packageName/versions', () => {
    it('should list all versions of a tool', async () => {
      const response = await client.get(`/tool/${testToolPackageName}/versions`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /tool/:packageName/version/:version', () => {
    it('should get a specific tool version', async () => {
      const response = await client.get(`/tool/${testToolPackageName}/version/${testToolVersion}`);
      expect(response.status).toBe(200);
      expect(response.body.version).toBe(testToolVersion);
    });

    it('should return 404 for non-existent version', async () => {
      const response = await client.get(`/tool/${testToolPackageName}/version/999.999.999`);
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /tool/:packageName/version/:version', () => {
    it('should update a tool version', async () => {
      const updateData = {
        changes: 'Updated changes description',
      };

      const response = await client
        .put(`/tool/${testToolPackageName}/version/${testToolVersion}`)
        .send(updateData);

      expect(response.status).toBe(200);

      // Verify the update
      const getResponse = await client.get(
        `/tool/${testToolPackageName}/version/${testToolVersion}`,
      );
      expect(getResponse.body.changes).toBe(updateData.changes);
    });
  });

  describe('DELETE /tool/:packageName', () => {
    it('should delete a tool and its versions', async () => {
      const response = await client.delete(`/tool/${testToolPackageName}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify the deletion
      const getResponse = await client.get(`/tool/${testToolPackageName}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
