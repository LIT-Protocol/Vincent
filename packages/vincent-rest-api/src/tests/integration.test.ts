// TODO: Add integration tests
// WIP Since we're moving to RTK Query, we'll need to rewrite these tests

/*import { Api, ApiError } from '../generated/api';
import { ICreateAppDef } from '../generated/api/models/ICreateAppDef';
import { VersionChanges } from '../generated/api/models/VersionChanges';
import { ICreateAppVersionDef } from '../generated/api/models/ICreateAppVersionDef';
import { IAppDef } from '../generated/api/models/IAppDef';
import { IAppVersionDef } from '../generated/api/models/IAppVersionDef';
import { IAppVersionWithToolsDef } from '../generated/api/models/IAppVersionWithToolsDef';
const waitBetweenRequests = () => new Promise((r) => setTimeout(r, 100));

describe('Integration tests', () => {
  const apiClient = new Api({
    BASE: 'http://localhost:3000',
  });

  let appIdentity: string;
  let versionIdentity: string;

  // App endpoint tests
  describe('App endpoints', () => {
    test('create app - valid', async () => {
      const app: ICreateAppDef = {
        name: 'Integration Test App',
        description: 'An app for integration testing',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://example.com',
        logo: 'base64encodedlogo',
        redirectUris: ['https://example.com/callback'],
        deploymentStatus: ICreateAppDef.deploymentStatus.DEV,
        managerAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
      };

      const response = (await apiClient.app.createApp(app)) as IAppDef;

      expect(response).toMatchObject({
        name: app.name,
        description: app.description,
        appId: expect.any(Number),
        identity: expect.any(String),
      });

      appIdentity = response.identity;
      console.log('Created app with identity:', appIdentity);

      await waitBetweenRequests();
    });

    test('create app - invalid schema', async () => {
      const invalidApp = {
        name: 'Invalid Test App',
      };

      await expect(apiClient.app.createApp(invalidApp as any)).rejects.toMatchObject({
        status: 422,
        body: expect.arrayContaining([
          expect.objectContaining({
            path: expect.arrayContaining(['description']),
          }),
          expect.objectContaining({
            path: expect.arrayContaining(['contactEmail']),
          }),
        ]),
      });

      await waitBetweenRequests();
    });

    test('get app - valid', async () => {
      if (!appIdentity) {
        console.warn('Skipping get app test - no app identity available');
        return;
      }

      const response = (await apiClient.app.getApp(appIdentity)) as IAppDef;

      expect(response).toMatchObject({
        identity: appIdentity,
        name: 'Integration Test App',
        description: 'An app for integration testing',
        appId: expect.any(Number),
      });

      await waitBetweenRequests();
    });

    test('update app - valid', async () => {
      if (!appIdentity) {
        console.warn('Skipping update app test - no app identity available');
        return;
      }

      const updatedApp: ICreateAppDef = {
        name: 'Updated Integration Test App',
        description: 'Updated description for integration testing',
        contactEmail: 'updated@example.com',
        appUserUrl: 'https://updated-example.com',
        logo: 'updatedbase64encodedlogo',
        redirectUris: ['https://updated-example.com/callback'],
        deploymentStatus: ICreateAppDef.deploymentStatus.TEST,
        managerAddress: '0xa723407AdB396a55aCd843D276daEa0d787F8db5',
      };

      const response = (await apiClient.app.editApp(appIdentity, updatedApp)) as IAppDef;

      expect(response).toMatchObject({
        identity: appIdentity,
        name: 'Updated Integration Test App',
        description: 'Updated description for integration testing',
        appId: expect.any(Number),
      });

      await waitBetweenRequests();
    });
  });

  // App Version endpoint tests
  describe('App Version endpoints', () => {
    beforeAll(async () => {
      if (!appIdentity) {
        console.warn('Skipping version setup - no app identity available');
        return;
      }

      const versionData: ICreateAppVersionDef = {
        tools: ['@vincent/foo-bar@1.0.0'],
        changes: 'Initial version',
      };

      const versionResponse = (await apiClient.appVersion.createAppVersion(
        appIdentity,
        versionData,
      )) as IAppVersionDef;

      versionIdentity = versionResponse.identity;
      console.log('Created version with identity:', versionIdentity);

      await waitBetweenRequests();
    });

    test('get app versions - valid', async () => {
      if (!appIdentity) {
        console.warn('Skipping get app versions test - no app identity available');
        return;
      }

      const response = (await apiClient.app.getAppVersions(appIdentity)) as IAppVersionDef[];

      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
      expect(response[0]).toMatchObject({
        identity: expect.any(String),
        appId: expect.any(Number),
        changes: 'Initial version',
      });

      await waitBetweenRequests();
    });

    test('get app version - valid', async () => {
      if (!versionIdentity) {
        console.warn('Skipping get app version test - no version identity available');
        return;
      }

      const response = (await apiClient.appVersion.getAppVersion(
        versionIdentity,
      )) as IAppVersionWithToolsDef;

      expect(response).toMatchObject({
        version: {
          identity: versionIdentity,
        },
        tools: expect.arrayContaining([
          expect.objectContaining({
            toolIdentity: '@vincent/foo-bar@1.0.0',
          }),
        ]),
      });

      await waitBetweenRequests();
    });

    test('edit app version - valid', async () => {
      if (!versionIdentity) {
        console.warn('Skipping edit app version test - no version identity available');
        return;
      }

      const updateData: VersionChanges = {
        changes: 'Updated changelog',
      };

      const response = (await apiClient.appVersion.editAppVersion(
        versionIdentity,
        updateData,
      )) as IAppVersionDef;

      expect(response).toMatchObject({
        identity: versionIdentity,
        changes: 'Updated changelog',
      });

      await waitBetweenRequests();
    });

    test('toggle app version - valid', async () => {
      if (!versionIdentity) {
        console.warn('Skipping toggle app version test - no version identity available');
        return;
      }

      const originalVersionResponse = (await apiClient.appVersion.getAppVersion(
        versionIdentity,
      )) as IAppVersionWithToolsDef;
      const originalEnabled = originalVersionResponse.version.enabled;

      await waitBetweenRequests();

      const response = (await apiClient.appVersion.toggleAppVersion(
        versionIdentity,
      )) as IAppVersionDef;

      expect(response).toMatchObject({
        identity: versionIdentity,
        enabled: !originalEnabled,
      });

      await waitBetweenRequests();
    });
  });
});
*/
