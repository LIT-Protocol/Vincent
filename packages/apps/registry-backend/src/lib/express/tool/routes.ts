import { Tool, ToolVersion } from '../../mongo/tool';
import { requireTool, withTool } from './requireTool';
import { requireToolVersion, withToolVersion } from './requireToolVersion';
import { requirePackage, withValidPackage } from '../package/requirePackage';

import type { Express } from 'express';
import { withSession } from '../../mongo/withSession';
import { Features } from '../../../features';
import { importPackage } from '../../packageImporter';

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
  app.post(
    '/tool/:packageName',
    requirePackage(),
    withValidPackage(async (req, res) => {
      const { authorWalletAddress, description, title } = req.body;
      const packageInfo = req.vincentPackage;

      // Import the package to get the metadata
      const { ipfsCid } = await importPackage({
        packageName: packageInfo.name,
        version: packageInfo.version,
        type: 'tool',
      });

      await withSession(async (mongoSession) => {
        const toolVersion = new ToolVersion({
          packageName: packageInfo.name,
          version: packageInfo.version,
          changes: 'Initial version',
          repository: packageInfo.repository,
          description: packageInfo.description,
          keywords: packageInfo.keywords || [],
          dependencies: packageInfo.dependencies || {},
          author: packageInfo.author,
          contributors: packageInfo.contributors || [],
          homepage: packageInfo.homepage,
          status: 'validating',
          supportedPolicies: [], // FIXME: Identify supportedPolicies from the package.json dependencies
          policiesNotInRegistry: [],
          ipfsCid,
        });

        const tool = new Tool({
          title,
          packageName: packageInfo.name,
          authorWalletAddress, // FIXME: Derive from authentication SIWE
          description,
          activeVersion: packageInfo.version,
        });

        let savedTool;

        try {
          await mongoSession.withTransaction(async (session) => {
            await toolVersion.save({ session });
            savedTool = await tool.save({ session });
          });

          res.status(201).json(savedTool);
          return;
        } catch (error: any) {
          if (error.code === 11000 && error.keyPattern && error.keyPattern.packageName) {
            res.status(409).json({
              message: `The tool ${packageInfo.name} is already in the Vincent Registry.`,
            });
            return;
          }

          throw error;
        }
      });
    }),
  );

  // Edit Tool
  app.put(
    '/tool/:packageName',
    requireTool(),
    withTool(async (req, res) => {
      Object.assign(req.vincentTool, req.body);
      const updatedTool = await req.vincentTool.save();

      res.json(updatedTool);
      return;
    }),
  );

  // Change Tool Owner
  app.put(
    '/tool/:packageName/owner',
    requireTool(),
    withTool(async (req, res) => {
      const { authorWalletAddress } = req.body;

      req.vincentTool.authorWalletAddress = authorWalletAddress;
      const updatedTool = await req.vincentTool.save();

      res.json(updatedTool);
      return;
    }),
  );

  // Create a new Tool Version
  app.post(
    '/tool/:packageName/version/:version',
    requireTool(),
    requirePackage(),
    withTool(
      withValidPackage(async (req, res) => {
        const packageInfo = req.vincentPackage;

        // Import the package to get the metadata
        const { ipfsCid } = await importPackage({
          packageName: packageInfo.name,
          version: packageInfo.version,
          type: 'tool',
        });

        const toolVersion = new ToolVersion({
          packageName: packageInfo.name,
          version: packageInfo.version,
          changes: req.body.changes,
          description: packageInfo.description,
          repository: packageInfo.repository,
          keywords: packageInfo.keywords || [],
          dependencies: packageInfo.dependencies || [],
          author: packageInfo.author,
          contributors: packageInfo.contributors || [],
          homepage: packageInfo.homepage,
          supportedPolicies: [], // FIXME: Identify supportedPolicies from the package.json dependencies
          policiesNotInRegistry: [],
          ipfsCid,
        });

        try {
          const savedVersion = await toolVersion.save();
          res.status(201).json(savedVersion);
          return;
        } catch (error: any) {
          if (error.code === 11000 && error.keyPattern && error.keyPattern.packageName) {
            res.status(409).json({
              message: `The tool ${packageInfo.name} is already in the Vincent Registry.`,
            });
            return;
          }
          throw error;
        }
      }),
    ),
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
      const { vincentToolVersion } = req;

      Object.assign(vincentToolVersion, req.body);
      const updatedVersion = await vincentToolVersion.save();

      res.json(updatedVersion);
      return;
    }),
  );

  // Delete a tool, along with all of its tool versions
  app.delete('/tool/:packageName', async (req, res) => {
    await withSession(async (mongoSession) => {
      const { packageName } = req.params;

      await mongoSession.withTransaction(async (session) => {
        if (Features.HARD_DELETE_DOCS) {
          await Tool.findOneAndDelete({ packageName }).session(session);
          await ToolVersion.deleteMany({ packageName }).session(session);
        } else {
          await Tool.updateMany({ packageName }, { isDeleted: true }).session(session);
          await ToolVersion.updateMany({ packageName }, { isDeleted: true }).session(session);
        }
      });

      res.json({ message: 'Tool and associated versions deleted successfully' });
      return;
    });
  });
}
