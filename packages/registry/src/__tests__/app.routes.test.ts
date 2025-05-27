import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { appRouter } from '../routes/app.routes';
import { App } from '../models/app.model';
import { AppVersion } from '../models/app-version.model';
import { AppTool } from '../models/app-tool.model';

describe('App Routes', () => {
  let expressApp: express.Application;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vincent-test');
    expressApp = express();
    expressApp.use(express.json());
    expressApp.use('/apps', appRouter);
  });

  afterAll(async () => {
    // Clean up database and close connection
    await App.deleteMany({});
    await AppVersion.deleteMany({});
    await AppTool.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await App.deleteMany({});
    await AppVersion.deleteMany({});
    await AppTool.deleteMany({});
  });

  describe('GET /apps', () => {
    it('should return paginated apps', async () => {
      // Create test apps
      await App.create([
        {
          appId: 1,
          id: 1,
          identity: 'AppDef|test-app-1',
          name: 'Test App 1',
          description: 'Test app 1 description',
          contactEmail: 'test1@example.com',
          appUserUrl: 'https://app1.example.com',
          logo: 'https://app1.example.com/logo.png',
          redirectUrls: ['https://app1.example.com/callback'],
          deploymentStatus: 'dev',
          managerAddress: '0x123',
          activeVersion: 1,
          lastUpdated: new Date(),
        },
        {
          appId: 2,
          id: 2,
          identity: 'AppDef|test-app-2',
          name: 'Test App 2',
          description: 'Test app 2 description',
          contactEmail: 'test2@example.com',
          appUserUrl: 'https://app2.example.com',
          logo: 'https://app2.example.com/logo.png',
          redirectUrls: ['https://app2.example.com/callback'],
          deploymentStatus: 'dev',
          managerAddress: '0x456',
          activeVersion: 1,
          lastUpdated: new Date(),
        },
      ]);

      const response = await request(expressApp).get('/apps?page=1&limit=1');
      expect(response.status).toBe(200);
      expect(response.body.apps).toHaveLength(1);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pages).toBe(2);
    });
  });

  describe('GET /apps/:identity', () => {
    it('should return 404 for non-existent app', async () => {
      const response = await request(expressApp).get('/apps/AppDef|non-existent');
      expect(response.status).toBe(404);
    });

    it('should return app by identity', async () => {
      const testApp = await App.create({
        appId: 1,
        id: 1,
        identity: 'AppDef|test-app',
        name: 'Test App',
        description: 'Test app description',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://app.example.com',
        logo: 'https://app.example.com/logo.png',
        redirectUrls: ['https://app.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x123',
        activeVersion: 1,
        lastUpdated: new Date(),
      });

      const response = await request(expressApp).get(`/apps/${testApp.identity}`);
      expect(response.status).toBe(200);
      expect(response.body.appId).toBe(testApp.appId);
      expect(response.body.name).toBe(testApp.name);
    });
  });

  describe('POST /apps', () => {
    it('should create a new app with initial version', async () => {
      const appData = {
        appId: 3,
        name: 'New App',
        description: 'New app description',
        contactEmail: 'new@example.com',
        appUserUrl: 'https://new.example.com',
        logo: 'https://new.example.com/logo.png',
        redirectUrls: ['https://new.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x789',
      };

      const response = await request(expressApp).post('/apps').send(appData);

      expect(response.status).toBe(201);
      expect(response.body.appId).toBe(appData.appId);
      expect(response.body.name).toBe(appData.name);
      expect(response.body.activeVersion).toBe(1);

      // Verify app was created in database
      const createdApp = await App.findOne({ appId: appData.appId });
      expect(createdApp).toBeTruthy();
      expect(createdApp?.name).toBe(appData.name);

      // Verify initial version was created
      const version = await AppVersion.findOne({
        appId: appData.appId,
        versionNumber: 1,
      });
      expect(version).toBeTruthy();
      expect(version?.enabled).toBe(true);
    });
  });

  describe('PUT /apps/:identity', () => {
    it('should update app details', async () => {
      const testApp = await App.create({
        appId: 1,
        id: 1,
        identity: 'AppDef|test-app',
        name: 'Original Name',
        description: 'Original description',
        contactEmail: 'original@example.com',
        appUserUrl: 'https://original.example.com',
        logo: 'https://original.example.com/logo.png',
        redirectUrls: ['https://original.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x123',
        activeVersion: 1,
        lastUpdated: new Date(),
      });

      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        contactEmail: 'updated@example.com',
      };

      const response = await request(expressApp).put(`/apps/${testApp.identity}`).send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.contactEmail).toBe(updateData.contactEmail);
    });
  });

  describe('POST /apps/:identity/owner', () => {
    it('should update app owner', async () => {
      const testApp = await App.create({
        appId: 1,
        id: 1,
        identity: 'AppDef|test-app',
        name: 'Test App',
        description: 'Test app description',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://app.example.com',
        logo: 'https://app.example.com/logo.png',
        redirectUrls: ['https://app.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x123',
        activeVersion: 1,
        lastUpdated: new Date(),
      });

      const newOwner = '0x456';
      const response = await request(expressApp)
        .post(`/apps/${testApp.identity}/owner`)
        .send({ managerAddress: newOwner });

      expect(response.status).toBe(200);
      expect(response.body.managerAddress).toBe(newOwner);
    });
  });

  describe('POST /apps/:identity/version/:version', () => {
    it('should create a new app version', async () => {
      const testApp = await App.create({
        appId: 1,
        id: 1,
        identity: 'AppDef|test-app',
        name: 'Test App',
        description: 'Test app description',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://app.example.com',
        logo: 'https://app.example.com/logo.png',
        redirectUrls: ['https://app.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x123',
        activeVersion: 1,
        lastUpdated: new Date(),
      });

      const versionData = {
        changes: 'New version changes',
      };

      const response = await request(expressApp)
        .post(`/apps/${testApp.identity}/version/2`)
        .send(versionData);

      expect(response.status).toBe(201);
      expect(response.body.versionNumber).toBe(2);
      expect(response.body.changes).toBe(versionData.changes);

      // Verify version was created in database
      const version = await AppVersion.findOne({
        appId: testApp.appId,
        versionNumber: 2,
      });
      expect(version).toBeTruthy();
      expect(version?.changes).toBe(versionData.changes);
    });
  });

  describe('GET /apps/:identity/versions', () => {
    it('should return all versions for an app', async () => {
      const testApp = await App.create({
        appId: 1,
        id: 1,
        identity: 'AppDef|test-app',
        name: 'Test App',
        description: 'Test app description',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://app.example.com',
        logo: 'https://app.example.com/logo.png',
        redirectUrls: ['https://app.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x123',
        activeVersion: 1,
        lastUpdated: new Date(),
      });

      // Create two versions
      await AppVersion.create([
        {
          appId: testApp.appId,
          versionNumber: 1,
          identity: `AppVersionDef|${testApp.appId}@1`,
          changes: 'Initial version',
          enabled: true,
          id: testApp.appId * 1000 + 1,
        },
        {
          appId: testApp.appId,
          versionNumber: 2,
          identity: `AppVersionDef|${testApp.appId}@2`,
          changes: 'Second version',
          enabled: true,
          id: testApp.appId * 1000 + 2,
        },
      ]);

      const response = await request(expressApp).get(`/apps/${testApp.identity}/versions`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].versionNumber).toBe(1);
      expect(response.body[1].versionNumber).toBe(2);
    });
  });

  describe('GET /apps/:identity/version/:version', () => {
    it('should return app version with associated tools', async () => {
      const testApp = await App.create({
        appId: 1,
        id: 1,
        identity: 'AppDef|test-app',
        name: 'Test App',
        description: 'Test app description',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://app.example.com',
        logo: 'https://app.example.com/logo.png',
        redirectUrls: ['https://app.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x123',
        activeVersion: 1,
        lastUpdated: new Date(),
      });

      const version = await AppVersion.create({
        appId: testApp.appId,
        versionNumber: 1,
        identity: `AppVersionDef|${testApp.appId}@1`,
        changes: 'Initial version',
        enabled: true,
        id: testApp.appId * 1000 + 1,
      });

      const tool = await AppTool.create({
        appId: testApp.appId,
        appVersionNumber: 1,
        toolPackageName: 'test-tool',
        toolVersion: '1.0.0',
        appVersionIdentity: `AppVersionDef|${testApp.appId}@1`,
        toolIdentity: 'ToolDef|test-tool',
        identity: `AppToolDef|${testApp.appId}@1|test-tool@1.0.0`,
      });

      const response = await request(expressApp).get(`/apps/${testApp.identity}/version/1`);
      expect(response.status).toBe(200);
      expect(response.body.version.versionNumber).toBe(1);
      expect(response.body.tools).toHaveLength(1);
      expect(response.body.tools[0].toolPackageName).toBe(tool.toolPackageName);
    });
  });

  describe('PUT /apps/:identity/version/:version', () => {
    it('should update app version changes', async () => {
      const testApp = await App.create({
        appId: 1,
        id: 1,
        identity: 'AppDef|test-app',
        name: 'Test App',
        description: 'Test app description',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://app.example.com',
        logo: 'https://app.example.com/logo.png',
        redirectUrls: ['https://app.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x123',
        activeVersion: 1,
        lastUpdated: new Date(),
      });

      await AppVersion.create({
        appId: testApp.appId,
        versionNumber: 1,
        identity: `AppVersionDef|${testApp.appId}@1`,
        changes: 'Original changes',
        enabled: true,
        id: testApp.appId * 1000 + 1,
      });

      const updateData = {
        changes: 'Updated changes',
      };

      const response = await request(expressApp)
        .put(`/apps/${testApp.identity}/version/1`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.changes).toBe(updateData.changes);
    });
  });

  describe('POST /apps/:identity/version/:version/disable', () => {
    it('should disable app version', async () => {
      const testApp = await App.create({
        appId: 1,
        id: 1,
        identity: 'AppDef|test-app',
        name: 'Test App',
        description: 'Test app description',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://app.example.com',
        logo: 'https://app.example.com/logo.png',
        redirectUrls: ['https://app.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x123',
        activeVersion: 1,
        lastUpdated: new Date(),
      });

      await AppVersion.create({
        appId: testApp.appId,
        versionNumber: 1,
        identity: `AppVersionDef|${testApp.appId}@1`,
        changes: 'Initial version',
        enabled: true,
        id: testApp.appId * 1000 + 1,
      });

      const response = await request(expressApp).post(
        `/apps/${testApp.identity}/version/1/disable`,
      );

      expect(response.status).toBe(200);
      expect(response.body.enabled).toBe(false);
    });
  });

  describe('POST /apps/:identity/version/:version/enable', () => {
    it('should enable app version', async () => {
      const testApp = await App.create({
        appId: 1,
        id: 1,
        identity: 'AppDef|test-app',
        name: 'Test App',
        description: 'Test app description',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://app.example.com',
        logo: 'https://app.example.com/logo.png',
        redirectUrls: ['https://app.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x123',
        activeVersion: 1,
        lastUpdated: new Date(),
      });

      await AppVersion.create({
        appId: testApp.appId,
        versionNumber: 1,
        identity: `AppVersionDef|${testApp.appId}@1`,
        changes: 'Initial version',
        enabled: false,
        id: testApp.appId * 1000 + 1,
      });

      const response = await request(expressApp).post(`/apps/${testApp.identity}/version/1/enable`);

      expect(response.status).toBe(200);
      expect(response.body.enabled).toBe(true);
    });
  });

  describe('DELETE /apps/:identity', () => {
    it('should delete app and associated data', async () => {
      const testApp = await App.create({
        appId: 1,
        id: 1,
        identity: 'AppDef|test-app',
        name: 'Test App',
        description: 'Test app description',
        contactEmail: 'test@example.com',
        appUserUrl: 'https://app.example.com',
        logo: 'https://app.example.com/logo.png',
        redirectUrls: ['https://app.example.com/callback'],
        deploymentStatus: 'dev',
        managerAddress: '0x123',
        activeVersion: 1,
        lastUpdated: new Date(),
      });

      await AppVersion.create({
        appId: testApp.appId,
        versionNumber: 1,
        identity: `AppVersionDef|${testApp.appId}@1`,
        changes: 'Initial version',
        enabled: true,
        id: testApp.appId * 1000 + 1,
      });

      await AppTool.create({
        appId: testApp.appId,
        appVersionNumber: 1,
        toolPackageName: 'test-tool',
        toolVersion: '1.0.0',
        appVersionIdentity: `AppVersionDef|${testApp.appId}@1`,
        toolIdentity: 'ToolDef|test-tool',
        identity: `AppToolDef|${testApp.appId}@1|test-tool@1.0.0`,
      });

      const response = await request(expressApp).delete(`/apps/${testApp.identity}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('App and associated data deleted successfully');

      // Verify app and associated data were deleted
      const deletedApp = await App.findOne({ appId: testApp.appId });
      expect(deletedApp).toBeNull();

      const version = await AppVersion.findOne({ appId: testApp.appId });
      expect(version).toBeNull();

      const tool = await AppTool.findOne({ appId: testApp.appId });
      expect(tool).toBeNull();
    });
  });
});
