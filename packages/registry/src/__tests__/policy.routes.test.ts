import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { policyRouter } from '../routes/policy.routes';
import { Policy } from '../models/policy.model';
import { PolicyVersion } from '../models/policy-version.model';

describe('Policy Routes', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vincent-test');
    app = express();
    app.use(express.json());
    app.use('/policies', policyRouter);
  });

  afterAll(async () => {
    // Clean up database and close connection
    await Policy.deleteMany({});
    await PolicyVersion.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Policy.deleteMany({});
    await PolicyVersion.deleteMany({});
  });

  describe('GET /policies', () => {
    it('should return empty array when no policies exist', async () => {
      const response = await request(app).get('/policies');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all policies', async () => {
      // Create test policy
      const policy = await Policy.create({
        packageName: 'test-package',
        identity: 'PolicyDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test policy',
        activeVersion: '1.0.0',
      });

      const response = await request(app).get('/policies');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].packageName).toBe(policy.packageName);
    });
  });

  describe('POST /policies', () => {
    it('should create a new policy with version', async () => {
      const policyData = {
        packageName: 'new-package',
        authorWalletAddress: '0x456',
        description: 'New test policy',
        activeVersion: '1.0.0',
        version: {
          version: '1.0.0',
          changes: 'Initial version',
          repository: 'https://github.com/test/repo',
          description: 'Test policy version',
          author: {
            name: 'Test Author',
            email: 'test@example.com',
            url: 'https://example.com',
          },
          ipfsCid: 'QmTest123',
          parameters: {
            uiSchema: '{}',
            jsonSchema: '{}',
          },
        },
      };

      const response = await request(app).post('/policies').send(policyData);

      expect(response.status).toBe(201);
      expect(response.body.policy.packageName).toBe(policyData.packageName);
      expect(response.body.version.version).toBe(policyData.version.version);

      // Verify policy was created in database
      const policy = await Policy.findOne({ packageName: policyData.packageName });
      expect(policy).toBeTruthy();
      expect(policy?.authorWalletAddress).toBe(policyData.authorWalletAddress);

      // Verify version was created
      const version = await PolicyVersion.findOne({
        packageName: policyData.packageName,
        version: policyData.version.version,
      });
      expect(version).toBeTruthy();
    });
  });

  describe('GET /policies/:identity', () => {
    it('should return 404 for non-existent policy', async () => {
      const response = await request(app).get('/policies/PolicyDef|non-existent');
      expect(response.status).toBe(404);
    });

    it('should return policy by identity', async () => {
      const policy = await Policy.create({
        packageName: 'test-package',
        identity: 'PolicyDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test policy',
        activeVersion: '1.0.0',
      });

      const response = await request(app).get(`/policies/${policy.identity}`);
      expect(response.status).toBe(200);
      expect(response.body.packageName).toBe(policy.packageName);
    });
  });

  describe('PUT /policies/:identity', () => {
    it('should update policy description and active version', async () => {
      const policy = await Policy.create({
        packageName: 'test-package',
        identity: 'PolicyDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Original description',
        activeVersion: '1.0.0',
      });

      const updateData = {
        description: 'Updated description',
        activeVersion: '2.0.0',
      };

      const response = await request(app).put(`/policies/${policy.identity}`).send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.activeVersion).toBe(updateData.activeVersion);
    });
  });

  describe('POST /policies/:identity/version/:version', () => {
    it('should create a new policy version', async () => {
      const policy = await Policy.create({
        packageName: 'test-package',
        identity: 'PolicyDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test policy',
        activeVersion: '1.0.0',
      });

      const versionData = {
        changes: 'New version changes',
        repository: 'https://github.com/test/repo',
        description: 'Test policy version',
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          url: 'https://example.com',
        },
        ipfsCid: 'QmTest123',
        parameters: {
          uiSchema: '{}',
          jsonSchema: '{}',
        },
      };

      const response = await request(app)
        .post(`/policies/${policy.identity}/version/2.0.0`)
        .send(versionData);

      expect(response.status).toBe(201);
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.changes).toBe(versionData.changes);

      // Verify version was created in database
      const version = await PolicyVersion.findOne({
        packageName: policy.packageName,
        version: '2.0.0',
      });
      expect(version).toBeTruthy();
      expect(version?.changes).toBe(versionData.changes);
    });
  });
});
