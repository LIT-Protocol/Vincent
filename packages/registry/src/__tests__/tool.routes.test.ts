import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { toolRouter } from '../routes/tool.routes';
import { Tool } from '../models/tool.model';
import { ToolVersion } from '../models/tool-version.model';

describe('Tool Routes', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vincent-test');
    app = express();
    app.use(express.json());
    app.use('/tools', toolRouter);
  });

  afterAll(async () => {
    // Clean up database and close connection
    await Tool.deleteMany({});
    await ToolVersion.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Tool.deleteMany({});
    await ToolVersion.deleteMany({});
  });

  describe('GET /tools', () => {
    it('should return empty array when no tools exist', async () => {
      const response = await request(app).get('/tools');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all tools', async () => {
      // Create test tool
      const tool = await Tool.create({
        packageName: 'test-package',
        identity: 'ToolDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test tool',
        activeVersion: '1.0.0',
      });

      const response = await request(app).get('/tools');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].packageName).toBe(tool.packageName);
    });
  });

  describe('POST /tools', () => {
    it('should create a new tool with version', async () => {
      const toolData = {
        packageName: 'new-package',
        authorWalletAddress: '0x456',
        description: 'New test tool',
        repository: 'https://github.com/test/repo',
        keywords: ['test', 'tool'],
        dependencies: [],
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          url: 'https://example.com',
        },
        contributors: [],
        homepage: 'https://example.com',
        ipfsCid: 'QmTest123',
      };

      const response = await request(app).post('/tools').send(toolData);

      expect(response.status).toBe(201);
      expect(response.body.packageName).toBe(toolData.packageName);
      expect(response.body.authorWalletAddress).toBe(toolData.authorWalletAddress);

      // Verify tool was created in database
      const tool = await Tool.findOne({ packageName: toolData.packageName });
      expect(tool).toBeTruthy();
      expect(tool?.authorWalletAddress).toBe(toolData.authorWalletAddress);

      // Verify version was created
      const version = await ToolVersion.findOne({
        packageName: toolData.packageName,
        version: '0.1.0', // Initial version
      });
      expect(version).toBeTruthy();
      expect(version?.repository).toBe(toolData.repository);
    });
  });

  describe('GET /tools/identity/:identity', () => {
    it('should return 404 for non-existent tool', async () => {
      const response = await request(app).get('/tools/identity/ToolDef|non-existent');
      expect(response.status).toBe(404);
    });

    it('should return tool by identity', async () => {
      const tool = await Tool.create({
        packageName: 'test-package',
        identity: 'ToolDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test tool',
        activeVersion: '1.0.0',
      });

      const response = await request(app).get(`/tools/identity/${tool.identity}`);
      expect(response.status).toBe(200);
      expect(response.body.packageName).toBe(tool.packageName);
    });
  });

  describe('PUT /tools/:identity', () => {
    it('should update tool description and active version', async () => {
      const tool = await Tool.create({
        packageName: 'test-package',
        identity: 'ToolDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Original description',
        activeVersion: '1.0.0',
      });

      const updateData = {
        description: 'Updated description',
        activeVersion: '2.0.0',
      };

      const response = await request(app).put(`/tools/${tool.identity}`).send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.activeVersion).toBe(updateData.activeVersion);
    });
  });

  describe('POST /tools/:identity/owner', () => {
    it('should update tool owner', async () => {
      const tool = await Tool.create({
        packageName: 'test-package',
        identity: 'ToolDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test tool',
        activeVersion: '1.0.0',
      });

      const newOwner = '0x456';
      const response = await request(app)
        .post(`/tools/${tool.identity}/owner`)
        .send({ authorWalletAddress: newOwner });

      expect(response.status).toBe(200);
      expect(response.body.authorWalletAddress).toBe(newOwner);
    });
  });

  describe('POST /tools/:identity/version/:version', () => {
    it('should create a new tool version', async () => {
      const tool = await Tool.create({
        packageName: 'test-package',
        identity: 'ToolDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test tool',
        activeVersion: '1.0.0',
      });

      const versionData = {
        changes: 'New version changes',
        repository: 'https://github.com/test/repo',
        description: 'Test tool version',
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          url: 'https://example.com',
        },
        ipfsCid: 'QmTest123',
      };

      const response = await request(app)
        .post(`/tools/${tool.identity}/version/2.0.0`)
        .send(versionData);

      expect(response.status).toBe(201);
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.changes).toBe(versionData.changes);

      // Verify version was created in database
      const version = await ToolVersion.findOne({
        packageName: tool.packageName,
        version: '2.0.0',
      });
      expect(version).toBeTruthy();
      expect(version?.changes).toBe(versionData.changes);
    });
  });

  describe('GET /tools/:identity/versions', () => {
    it('should return all versions for a tool', async () => {
      const tool = await Tool.create({
        packageName: 'test-package',
        identity: 'ToolDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test tool',
        activeVersion: '1.0.0',
      });

      // Create two versions
      await ToolVersion.create([
        {
          packageName: tool.packageName,
          version: '1.0.0',
          identity: `ToolVersionDef|${tool.packageName}@1.0.0`,
          changes: 'Initial version',
          repository: 'https://github.com/test/repo',
          description: 'Test tool version 1',
          author: {
            name: 'Test Author',
            email: 'test@example.com',
            url: 'https://example.com',
          },
          ipfsCid: 'QmTest123',
          status: 'validating',
        },
        {
          packageName: tool.packageName,
          version: '2.0.0',
          identity: `ToolVersionDef|${tool.packageName}@2.0.0`,
          changes: 'Second version',
          repository: 'https://github.com/test/repo',
          description: 'Test tool version 2',
          author: {
            name: 'Test Author',
            email: 'test@example.com',
            url: 'https://example.com',
          },
          ipfsCid: 'QmTest456',
          status: 'validating',
        },
      ]);

      const response = await request(app).get(`/tools/${tool.identity}/versions`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].version).toBe('1.0.0');
      expect(response.body[1].version).toBe('2.0.0');
    });
  });

  describe('GET /tools/:identity/version/:version', () => {
    it('should return specific version of a tool', async () => {
      const tool = await Tool.create({
        packageName: 'test-package',
        identity: 'ToolDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test tool',
        activeVersion: '1.0.0',
      });

      const version = await ToolVersion.create({
        packageName: tool.packageName,
        version: '1.0.0',
        identity: `ToolVersionDef|${tool.packageName}@1.0.0`,
        changes: 'Initial version',
        repository: 'https://github.com/test/repo',
        description: 'Test tool version',
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          url: 'https://example.com',
        },
        ipfsCid: 'QmTest123',
        status: 'validating',
      });

      const response = await request(app).get(`/tools/${tool.identity}/version/1.0.0`);
      expect(response.status).toBe(200);
      expect(response.body.version).toBe(version.version);
      expect(response.body.changes).toBe(version.changes);
    });
  });

  describe('PUT /tools/:identity/version/:version', () => {
    it('should update tool version changes', async () => {
      const tool = await Tool.create({
        packageName: 'test-package',
        identity: 'ToolDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test tool',
        activeVersion: '1.0.0',
      });

      await ToolVersion.create({
        packageName: tool.packageName,
        version: '1.0.0',
        identity: `ToolVersionDef|${tool.packageName}@1.0.0`,
        changes: 'Initial version',
        repository: 'https://github.com/test/repo',
        description: 'Test tool version',
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          url: 'https://example.com',
        },
        ipfsCid: 'QmTest123',
        status: 'validating',
      });

      const updateData = {
        changes: 'Updated changes',
      };

      const response = await request(app)
        .put(`/tools/${tool.identity}/version/1.0.0`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.changes).toBe(updateData.changes);
    });
  });

  describe('DELETE /tools/:id', () => {
    it('should delete a tool', async () => {
      const tool = await Tool.create({
        packageName: 'test-package',
        identity: 'ToolDef|test-package',
        authorWalletAddress: '0x123',
        description: 'Test tool',
        activeVersion: '1.0.0',
      });

      const response = await request(app).delete(`/tools/${tool._id}`);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Tool deleted successfully');

      // Verify tool was deleted
      const deletedTool = await Tool.findById(tool._id);
      expect(deletedTool).toBeNull();
    });
  });
});
