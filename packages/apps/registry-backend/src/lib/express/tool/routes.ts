import { Tool, ToolVersion } from '../../mongo/tool';
import { requireTool, withTool } from './requireTool';
import { requireToolVersion, withToolVersion } from './requireToolVersion';
import { requirePackage, withValidPackage } from '../package/requirePackage';
import { getPackageInfo } from '../../npm';

import type { Express } from 'express';
import { withSession } from '../../mongo/withSession';
import { generateRandomCid } from '../../util';
import { Features } from '../../../features';

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
    '/tool',
    requirePackage(),
    withValidPackage(async (req, res) => {
      const { packageName, authorWalletAddress, description, version } = req.body;
      const packageInfo = req.vincentPackage;

      await withSession(async (mongoSession) => {
        const toolVersion = new ToolVersion({
          packageName,
          version: version,
          changes: 'Initial version',
          repository: packageInfo.repository,
          description,
          keywords: packageInfo.keywords || [],
          dependencies: packageInfo.dependencies || [],
          author: packageInfo.author,
          contributors: packageInfo.contributors || [],
          homepage: packageInfo.homepage,
          status: 'validating',
          supportedPolicies: [], // FIXME: Identify supportedPolicies from the package.json dependencies
          policiesNotInRegistry: [],
          ipfsCid: generateRandomCid(), // FIXME: Load this from a JSON file in the package distribution
        });

        const tool = new Tool({
          packageName,
          authorWalletAddress,
          description,
          activeVersion: version,
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
    }),
  );

  // Edit Tool
  app.put(
    '/tool/:packageName',
    requireTool(),
    withTool(async (req, res) => {
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
    requirePackage(),
    withTool(
      withValidPackage(async (req, res) => {
        const { version } = req.params;
        const packageInfo = req.vincentPackage;

        const toolVersion = new ToolVersion({
          packageName: req.vincentTool.packageName,
          version: version,
          changes: req.body.changes,
          description: req.body.description,
          repository: packageInfo.repository,
          keywords: packageInfo.keywords || [],
          dependencies: packageInfo.dependencies || [],
          author: packageInfo.author,
          contributors: packageInfo.contributors || [],
          homepage: packageInfo.homepage,
          status: 'validating',
          supportedPolicies: [], // FIXME: Identify supportedPolicies from the package.json dependencies
          policiesNotInRegistry: [],
          ipfsCid: generateRandomCid(), // FIXME: Load this from a JSON file in the package distribution
        });

        const savedVersion = await toolVersion.save();
        res.status(201).json(savedVersion);
        return;
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
