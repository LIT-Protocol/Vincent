import { Tool, ToolVersion } from '../../mongo/tool';
import { requireTool, withTool } from './requireTool';
import { requireToolVersion, withToolVersion } from './requireToolVersion';

import type { Express } from 'express';

export function registerRoutes(app: Express) {
  // Get all tools
  app.get('/tools', async (_req, res) => {
    try {
      const tools = await Tool.find().lean();
      res.json(tools);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tools', error });
    }
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
    try {
      const { packageName, authorWalletAddress, description } = req.body;

      // Create initial tool version
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

      await toolVersion.save();

      // Create tool
      const tool = new Tool({
        packageName,
        authorWalletAddress,
        description,
        activeVersion: initialVersion,
      });

      const savedTool = await tool.save();
      res.status(201).json(savedTool);
      return;
    } catch (error) {
      res.status(400).json({ message: 'Error creating tool', error });
      return;
    }
  });

  // Edit Tool
  app.put(
    '/tool/:packageName',
    requireTool(),
    withTool(async (req, res) => {
      const { packageName } = req.params;

      try {
        const updatedTool = await req.vincentTool.updateOne(req.body, { new: true }).lean();

        res.json(updatedTool);
        return;
      } catch (error) {
        res.status(400).json({ message: `Error updating tool ${packageName}`, error });
        return;
      }
    }),
  );

  // Change Tool Owner
  app.post(
    '/tool/:packageName/owner',
    requireTool(),
    withTool(async (req, res) => {
      const { packageName } = req.params;
      const { authorWalletAddress } = req.body;

      if (!authorWalletAddress) {
        res.status(400).json({ message: 'authorWalletAddress is required' });
        return;
      }

      try {
        const updatedTool = await req.vincentTool
          .updateOne({ authorWalletAddress }, { new: true })
          .lean();

        res.json(updatedTool);
        return;
      } catch (error) {
        res.status(400).json({ message: `Error updating tool owner for ${packageName}`, error });
        return;
      }
    }),
  );

  // Create new Tool Version
  app.post(
    '/tool/:packageName/version/:version',
    requireTool(),
    withTool(async (req, res) => {
      const { version, packageName } = req.params;

      try {
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
      } catch (error) {
        res.status(400).json({ message: 'Error creating tool version', error });
        return;
      }
    }),
  );

  // List Tool Versions
  app.get(
    '/tool/:packageName/versions',
    requireTool(),
    withTool(async (req, res) => {
      const { packageName } = req.params;

      try {
        const versions = await ToolVersion.find({ packageName: req.vincentTool.packageName })
          .sort({ version: 1 })
          .lean();
        res.json(versions);
        return;
      } catch (error) {
        res.status(500).json({ message: 'Error fetching tool versions', error });
        return;
      }
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

      try {
        const updatedVersion = await vincentToolVersion
          .updateOne({ changes: req.body.changes }, { new: true })
          .lean();

        res.json(updatedVersion);
        return;
      } catch (error) {
        res.status(400).json({
          message: `Error updating tool version ${vincentToolVersion.version} for tool ${vincentTool.packageName}`,
          error,
        });
        return;
      }
    }),
  );

  // Delete a tool, along with all of its tool versions
  app.delete('/tool/:packageName', async (req, res) => {
    try {
      const { packageName } = req.params;

      // FIXME: Would be nice if this was an atomic transaction
      await Promise.all([
        Tool.findOneAndDelete({ packageName }),
        ToolVersion.deleteMany({ packageName }),
      ]);

      res.json({ message: 'Tool and associated versions deleted successfully' });
      return;
    } catch (error) {
      res.status(500).json({ message: 'Error deleting tool', error });
      return;
    }
  });
}
