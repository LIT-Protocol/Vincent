import { Tool, ToolVersion } from '../../mongo/tool';
import { requireTool, withTool } from './requireTool';
import { requireToolVersion, withToolVersion } from './requireToolVersion';

import type { Express } from 'express';
import { withSession } from '../../mongo/withSession';

export function registerRoutes(app: Express) {
  // Get all tools
  app.get('/tools', async (_req, res) => {
    const tools = await Tool.find().lean();
    res.json(tools);
  });

  // Get Tool by packageName
  app.get(
    '/tool/:packageName',
    requireTool(),
    withTool(async (req, res) => {
      const { vincentTool } = req;
      res.json(vincentTool);
      return;
    }),
  );

  // Create new Tool
  app.post('/tool', async (req, res) => {
    await withSession(async (mongoSession) => {
      const { packageName, authorWalletAddress, description } = req.body;

      // FIXME: This must be a real package version that we've verified
      const initialVersion = '0.1.0';
      const toolVersion = new ToolVersion({
        packageName,
        version: initialVersion,
        changes: 'Initial version',
        repository: req.body.repository,
        description,
        keywords: req.body.keywords || [],
        dependencies: req.body.dependencies || [],
        author: req.body.author,
        contributors: req.body.contributors || [],
        homepage: req.body.homepage,
        status: 'validating',
        supportedPolicies: [],
        policiesNotInRegistry: [],
        ipfsCid: req.body.ipfsCid,
      });

      const tool = new Tool({
        packageName,
        authorWalletAddress,
        description,
        activeVersion: initialVersion,
      });

      let /*savedToolVersion,*/ savedTool;

      await mongoSession.withTransaction(async (session) => {
        await toolVersion.save({ session });
        savedTool = await tool.save({ session });
      });

      // FIXME: If we take a toolVersion as an input, should we return both docs in the response?
      res.status(201).json(savedTool);
      return;
    });
  });

  // Edit Tool
  app.put(
    '/tool/:packageName',
    requireTool(),
    withTool(async (req, res) => {
      const { packageName } = req.params;

      const updatedTool = await req.vincentTool.updateOne(req.body, { new: true }).lean();

      res.json(updatedTool);
      return;
    }),
  );

  // Change Tool Owner
  app.post(
    '/tool/:packageName/owner',
    requireTool(),
    withTool(async (req, res) => {
      const { packageName } = req.params;
      const { authorWalletAddress } = req.body;

      const updatedTool = await req.vincentTool
        .updateOne({ authorWalletAddress }, { new: true })
        .lean();

      res.json(updatedTool);
      return;
    }),
  );

  // Create new Tool Version
  app.post(
    '/tool/:packageName/version/:version',
    requireTool(),
    withTool(async (req, res) => {
      const { version } = req.params;

      // FIXME: Check the package version.
      const toolVersion = new ToolVersion({
        packageName: req.vincentTool.packageName,
        version,
        changes: req.body.changes,
        repository: req.body.repository,
        description: req.body.description,
        keywords: req.body.keywords || [],
        dependencies: req.body.dependencies || [],
        author: req.body.author,
        contributors: req.body.contributors || [],
        homepage: req.body.homepage,
        status: 'validating',
        supportedPolicies: [],
        policiesNotInRegistry: [],
        ipfsCid: req.body.ipfsCid,
      });

      const savedVersion = await toolVersion.save();
      res.status(201).json(savedVersion);
      return;
    }),
  );

  // List Tool Versions
  app.get(
    '/tool/:packageName/versions',
    requireTool(),
    withTool(async (req, res) => {
      const versions = await ToolVersion.find({ packageName: req.vincentTool.packageName })
        .sort({ version: 1 })
        .lean();
      res.json(versions);
      return;
    }),
  );

  // Get Tool Version
  app.get(
    '/tool/:packageName/version/:version',
    requireTool(),
    requireToolVersion(),
    withToolVersion(async (req, res) => {
      const { vincentToolVersion } = req;
      res.json(vincentToolVersion);
      return;
    }),
  );

  // Edit Tool Version
  app.put(
    '/tool/:packageName/version/:version',
    requireTool(),
    requireToolVersion(),
    withToolVersion(async (req, res) => {
      const { vincentTool, vincentToolVersion } = req;

      const updatedVersion = await vincentToolVersion
        .updateOne({ changes: req.body.changes }, { new: true })
        .lean();

      res.json(updatedVersion);
      return;
    }),
  );

  // Delete a tool, along with all of its tool versions
  app.delete('/tool/:packageName', async (req, res) => {
    await withSession(async (mongoSession) => {
      const { packageName } = req.params;

      await mongoSession.withTransaction(async (session) => {
        await Tool.findOneAndDelete({ packageName }).session(session);
        await ToolVersion.deleteMany({ packageName }).session(session);
      });

      res.json({ message: 'Tool and associated versions deleted successfully' });
      return;
    });
  });
}
