import { createClient } from './setup';

describe('Policy API Integration Tests', () => {
  const client = createClient();
  const testPolicyPackageName = 'express';
  const testPolicyVersion = '4.18.2';

  describe('GET /policies', () => {
    it('should return a list of policies', async () => {
      const response = await client.get('/policies');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /policy', () => {
    it('should create a new policy', async () => {
      const policyData = {
        packageName: testPolicyPackageName,
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test policy for integration tests',
        activeVersion: testPolicyVersion,
        version: {
          repository: 'https://github.com/expressjs/express',
          description: 'Test policy version description',
          keywords: ['test', 'policy'],
          dependencies: [],
          contributors: [],
        },
      };

      const response = await client.post('/policy').send(policyData);
      expect(response.status).toBe(201);
      expect(response.body.packageName).toBe(testPolicyPackageName);
      expect(response.body.description).toBe(policyData.description);
    });

    it('should reject invalid package names', async () => {
      const invalidPolicyData = {
        packageName: 'Invalid Package Name', // Contains spaces, which is invalid
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test policy with invalid package name',
        activeVersion: '4.18.2', // Valid version
        version: {
          repository: 'https://github.com/expressjs/express',
          description: 'Test policy version description',
          keywords: ['test', 'policy'],
          dependencies: [],
          contributors: [],
        },
      };

      const response = await client.post('/policy').send(invalidPolicyData);
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid NPM package name');
    });

    it('should reject invalid versions', async () => {
      const invalidVersionData = {
        packageName: 'express-test',
        authorWalletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        description: 'Test policy with invalid version',
        activeVersion: 'not-a-valid-version', // Not a valid semver
        version: {
          repository: 'https://github.com/expressjs/express',
          description: 'Test policy version description',
          keywords: ['test', 'policy'],
          dependencies: [],
          contributors: [],
        },
      };

      const response = await client.post('/policy').send(invalidVersionData);
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid semantic version');
    });
  });

  describe('GET /policy/:packageName', () => {
    it('should return a specific policy', async () => {
      const response = await client.get(`/policy/${testPolicyPackageName}`);
      expect(response.status).toBe(200);
      expect(response.body.packageName).toBe(testPolicyPackageName);
    });

    it('should return 404 for non-existent policy', async () => {
      const response = await client.get('/policy/non-existent-policy');
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /policy/:packageName', () => {
    it('should update a policy', async () => {
      const updateData = {
        description: 'Updated test policy description',
      };

      const response = await client.put(`/policy/${testPolicyPackageName}`).send(updateData);
      expect(response.status).toBe(200);

      // Verify the update
      const getResponse = await client.get(`/policy/${testPolicyPackageName}`);
      expect(getResponse.body.description).toBe(updateData.description);
    });
  });

  describe('POST /policy/:packageName/owner', () => {
    it('should change the policy owner', async () => {
      const newOwnerData = {
        authorWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      };

      const response = await client
        .post(`/policy/${testPolicyPackageName}/owner`)
        .send(newOwnerData);
      expect(response.status).toBe(200);

      // Verify the owner change
      const getResponse = await client.get(`/policy/${testPolicyPackageName}`);
      expect(getResponse.body.authorWalletAddress).toBe(newOwnerData.authorWalletAddress);
    });
  });

  describe('POST /policy/:packageName/version/:version', () => {
    it('should create a new policy version', async () => {
      const newVersion = '4.18.1';
      const versionData = {
        changes: 'Added new features',
        description: 'New version description',
        repository: 'https://github.com/test/test-policy',
        keywords: ['test', 'policy', 'updated'],
        dependencies: [],
        contributors: [],
      };

      const response = await client
        .post(`/policy/${testPolicyPackageName}/version/${newVersion}`)
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
        repository: 'https://github.com/expressjs/express',
        keywords: ['test', 'policy', 'invalid'],
        dependencies: [],
        contributors: [],
      };

      const response = await client
        .post(`/policy/${testPolicyPackageName}/version/${invalidVersion}`)
        .send(versionData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid semantic version');
    });
  });

  describe('GET /policy/:packageName/versions', () => {
    it('should list all versions of a policy', async () => {
      const response = await client.get(`/policy/${testPolicyPackageName}/versions`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /policy/:packageName/version/:version', () => {
    it('should get a specific policy version', async () => {
      const response = await client.get(
        `/policy/${testPolicyPackageName}/version/${testPolicyVersion}`,
      );
      expect(response.status).toBe(200);
      expect(response.body.version).toBe(testPolicyVersion);
    });

    it('should return 404 for non-existent version', async () => {
      const response = await client.get(`/policy/${testPolicyPackageName}/version/999.999.999`);
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /policy/:packageName/version/:version', () => {
    it('should update a policy version', async () => {
      const updateData = {
        changes: 'Updated changes description',
      };

      const response = await client
        .put(`/policy/${testPolicyPackageName}/version/${testPolicyVersion}`)
        .send(updateData);

      expect(response.status).toBe(200);

      // Verify the update
      const getResponse = await client.get(
        `/policy/${testPolicyPackageName}/version/${testPolicyVersion}`,
      );
      expect(getResponse.body.changes).toBe(updateData.changes);
    });
  });

  describe('DELETE /policy/:packageName', () => {
    it('should delete a policy and its versions', async () => {
      const response = await client.delete(`/policy/${testPolicyPackageName}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify the deletion
      const getResponse = await client.get(`/policy/${testPolicyPackageName}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
