import { createClient } from './setup';

describe('App API Integration Tests', () => {
  const client = createClient();
  const testAppId = Math.floor(Math.random() * 1000000);
  const testAppVersion = 1;

  describe('GET /apps', () => {
    it('should return a list of apps', async () => {
      const response = await client.get('/apps');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /app', () => {
    it('should create a new app', async () => {
      const appData = {
        appId: testAppId,
        name: 'Test App',
        description: 'Test app for integration tests',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://example.com/app',
        logo: 'https://example.com/logo.png',
        redirectUris: ['https://example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x1234567890abcdef1234567890abcdef12345678',
      };

      const response = await client.post('/app').send(appData);
      expect(response.status).toBe(201);
      expect(response.body.appId).toBe(testAppId);
      expect(response.body.name).toBe(appData.name);
      expect(response.body.description).toBe(appData.description);
    });
  });

  describe('GET /app/:appId', () => {
    it('should return a specific app', async () => {
      const response = await client.get(`/app/${testAppId}`);
      expect(response.status).toBe(200);
      expect(response.body.appId).toBe(testAppId);
    });

    it('should return 404 for non-existent app', async () => {
      const response = await client.get('/app/non-existent-app');
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /app/:appId', () => {
    it('should update an app', async () => {
      const updateData = {
        description: 'Updated test app description',
      };

      const response = await client.put(`/app/${testAppId}`).send(updateData);
      expect(response.status).toBe(200);

      // Verify the update
      const getResponse = await client.get(`/app/${testAppId}`);
      expect(getResponse.body.description).toBe(updateData.description);
    });
  });

  describe('POST /app/:appId/owner', () => {
    it('should change the app owner', async () => {
      const newOwnerData = {
        managerAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      };

      const response = await client.post(`/app/${testAppId}/owner`).send(newOwnerData);
      expect(response.status).toBe(200);

      // Verify the owner change
      const getResponse = await client.get(`/app/${testAppId}`);
      expect(getResponse.body.managerAddress).toBe(newOwnerData.managerAddress);
    });
  });

  describe('POST /app/:appId/version', () => {
    it('should create a new app version', async () => {
      const versionData = {
        changes: 'Added new features',
      };

      const response = await client.post(`/app/${testAppId}/version`).send(versionData);

      expect(response.status).toBe(201);
      expect(response.body.changes).toBe(versionData.changes);
      expect(response.body.version).toBe(2); // Since the first version is 1
    });
  });

  describe('GET /app/:appId/versions', () => {
    it('should list all versions of an app', async () => {
      const response = await client.get(`/app/${testAppId}/versions`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /app/:appId/version/:version', () => {
    it('should get a specific app version', async () => {
      const response = await client.get(`/app/${testAppId}/version/${testAppVersion}`);
      expect(response.status).toBe(200);
      expect(response.body.version).toBe(testAppVersion);
    });

    it('should return 404 for non-existent version', async () => {
      const response = await client.get(`/app/${testAppId}/version/999`);
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /app/:appId/version/:version', () => {
    it('should update an app version', async () => {
      const updateData = {
        changes: 'Updated changes description',
      };

      const response = await client
        .put(`/app/${testAppId}/version/${testAppVersion}`)
        .send(updateData);

      expect(response.status).toBe(200);

      // Verify the update
      const getResponse = await client.get(`/app/${testAppId}/version/${testAppVersion}`);
      expect(getResponse.body.version.changes).toBe(updateData.changes);
    });
  });

  describe('POST /app/:appId/version/:version/disable', () => {
    it('should disable an app version', async () => {
      const response = await client.post(`/app/${testAppId}/version/${testAppVersion}/disable`);
      expect(response.status).toBe(200);

      // Verify the version is disabled
      const getResponse = await client.get(`/app/${testAppId}/version/${testAppVersion}`);
      expect(getResponse.body.version.enabled).toBe(false);
    });
  });

  describe('POST /app/:appId/version/:version/enable', () => {
    it('should enable an app version', async () => {
      const response = await client.post(`/app/${testAppId}/version/${testAppVersion}/enable`);
      expect(response.status).toBe(200);

      // Verify the version is enabled
      const getResponse = await client.get(`/app/${testAppId}/version/${testAppVersion}`);
      expect(getResponse.body.version.enabled).toBe(true);
    });
  });

  describe('DELETE /app/:appId', () => {
    it('should delete an app and its versions', async () => {
      const response = await client.delete(`/app/${testAppId}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify the deletion
      const getResponse = await client.get(`/app/${testAppId}`);
      expect(getResponse.status).toBe(404);
    });
  });
});
