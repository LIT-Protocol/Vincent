import type { Express } from 'express';

import { Features } from '../../../features';
import { Tool, ToolVersion } from '../../mongo/tool';
import { withSession } from '../../mongo/withSession';
import { importPackage, identifySupportedPolicies } from '../../packageImporter';
import { requirePackage, withValidPackage } from '../package/requirePackage';
import { requireUserIsAuthor } from '../package/requireUserIsAuthor';
import { getPKPInfo, requireVincentAuth, withVincentAuth } from '../vincentAuth';
import { requireTool, withTool } from './requireTool';
import { requireToolVersion, withToolVersion } from './requireToolVersion';

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
    requireVincentAuth,
    requirePackage(),
    withVincentAuth(
      withValidPackage(async (req, res) => {
        const { description, title, logo } = req.body;
        const packageInfo = req.vincentPackage;

        // Import the package to get the metadata
        const { ipfsCid } = await importPackage({
          packageName: packageInfo.name,
          version: packageInfo.version,
          type: 'tool',
        });

        // Identify supported policies from dependencies
        const { supportedPolicies, policiesNotInRegistry } = await identifySupportedPolicies(
          packageInfo.dependencies || {},
        );

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
            supportedPolicies,
            policiesNotInRegistry,
            ipfsCid,
          });

          const tool = new Tool({
            title,
            packageName: packageInfo.name,
            authorWalletAddress: getPKPInfo(req.vincentUser.decodedJWT).ethAddress,
            description,
            logo,
            activeVersion: packageInfo.version,
            deploymentStatus: req.body.deploymentStatus || 'dev',
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
    ),
  );

  // Edit Tool
  app.put(
    '/tool/:packageName',
    requireVincentAuth,
    requireTool(),
    requireUserIsAuthor('tool'),
    withVincentAuth(
      withTool(async (req, res) => {
        Object.assign(req.vincentTool, req.body);
        const updatedTool = await req.vincentTool.save();

        res.json(updatedTool);
        return;
      }),
    ),
  );

  // Change Tool Owner
  app.put(
    '/tool/:packageName/owner',
    requireVincentAuth,
    requireTool(),
    requireUserIsAuthor('tool'),
    withVincentAuth(
      withTool(async (req, res) => {
        req.vincentTool.authorWalletAddress = req.body.authorWalletAddress;
        const updatedTool = await req.vincentTool.save();

        res.json(updatedTool);
        return;
      }),
    ),
  );

  // Create a new Tool Version
  app.post(
    '/tool/:packageName/version/:version',
    requireVincentAuth,
    requireTool(),
    requireUserIsAuthor('tool'),
    requirePackage(),
    withVincentAuth(
      withTool(
        withValidPackage(async (req, res) => {
          const packageInfo = req.vincentPackage;

          // Import the package to get the metadata
          const { ipfsCid } = await importPackage({
            packageName: packageInfo.name,
            version: packageInfo.version,
            type: 'tool',
          });

          // Identify supported policies from dependencies
          const { supportedPolicies, policiesNotInRegistry } = await identifySupportedPolicies(
            packageInfo.dependencies || {},
          );

          const toolVersion = new ToolVersion({
            packageName: packageInfo.name,
            version: packageInfo.version,
            changes: req.body.changes,
            description: packageInfo.description,
            repository: packageInfo.repository,
            keywords: packageInfo.keywords || [],
            dependencies: packageInfo.dependencies || {},
            author: packageInfo.author,
            contributors: packageInfo.contributors || [],
            homepage: packageInfo.homepage,
            supportedPolicies,
            policiesNotInRegistry,
            ipfsCid,
          });

          try {
            const savedVersion = await toolVersion.save();
            res.status(201).json(savedVersion);
            return;
          } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.packageName) {
              res.status(409).json({
                message: `The tool ${packageInfo.name}@${packageInfo.version} is already in the Vincent Registry.`,
              });
              return;
            }
            throw error;
          }
        }),
      ),
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
    requireVincentAuth,
    requireTool(),
    requireUserIsAuthor('tool'),
    requireToolVersion(),
    withVincentAuth(
      withToolVersion(async (req, res) => {
        const { vincentToolVersion } = req;

        Object.assign(vincentToolVersion, req.body);
        const updatedVersion = await vincentToolVersion.save();

        res.json(updatedVersion);
        return;
      }),
    ),
  );

  // Delete a tool version
  app.delete(
    '/tool/:packageName/version/:version',
    requireVincentAuth,
    requireTool(),
    requireUserIsAuthor('tool'),
    requireToolVersion(),
    withVincentAuth(
      withToolVersion(async (req, res) => {
        const { vincentToolVersion } = req;

        if (Features.HARD_DELETE_DOCS) {
          await vincentToolVersion.deleteOne();
        } else {
          Object.assign(vincentToolVersion, { isDeleted: true });
          await vincentToolVersion.save();
        }

        res.json({ message: 'Tool version deleted successfully' });
        return;
      }),
    ),
  );

  // Undelete a tool version
  app.post(
    '/tool/:packageName/version/:version/undelete',
    requireVincentAuth,
    requireTool(),
    requireUserIsAuthor('tool'),
    requireToolVersion(),
    withVincentAuth(
      withToolVersion(async (req, res) => {
        const { vincentToolVersion } = req;

        Object.assign(vincentToolVersion, { isDeleted: false });
        await vincentToolVersion.save();

        res.json({ message: 'Tool version undeleted successfully' });
        return;
      }),
    ),
  );

  // Delete a tool, along with all of its tool versions
  app.delete(
    '/tool/:packageName',
    requireVincentAuth,
    requireTool(),
    requireUserIsAuthor('tool'),
    withVincentAuth(async (req, res) => {
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
    }),
  );

  // Undelete a tool, along with all of its tool versions
  app.post(
    '/tool/:packageName/undelete',
    requireVincentAuth,
    requireTool(),
    requireUserIsAuthor('tool'),
    withVincentAuth(async (req, res) => {
      await withSession(async (mongoSession) => {
        const { packageName } = req.params;

        await mongoSession.withTransaction(async (session) => {
          await Tool.updateMany({ packageName }, { isDeleted: false }).session(session);
          await ToolVersion.updateMany({ packageName }, { isDeleted: false }).session(session);
        });

        res.json({ message: 'Tool and associated versions undeleted successfully' });
        return;
      });
    }),
  );
}
