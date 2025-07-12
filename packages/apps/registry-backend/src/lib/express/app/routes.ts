import { App, AppTool, AppVersion } from '../../mongo/app';

import type { Express } from 'express';
import { requireApp, withApp } from './requireApp';
import { requireAppVersion, withAppVersion } from './requireAppVersion';
import { requireAppTool, withAppTool } from './requireAppTool';
import { requireUserManagesApp } from './requireUserManagesApp';
import { requireVincentAuth, withVincentAuth } from '../requireVincentAuth';
import { withSession } from '../../mongo/withSession';
import { Features } from '../../../features';

const NEW_APP_APPVERSION = 1;
const MAX_APPID_RETRY_ATTEMPTS = 20;

// App IDs are randomly selected indexes between 1000 and 10 billion to avoid huge bigNum-sized strings for appId
function generateRandomAppId(): number {
  return Math.floor(Math.random() * (10_000_000_000 - 1000)) + 1000;
}

export function registerRoutes(app: Express) {
  // List all apps
  app.get('/apps', async (req, res) => {
    const apps = await App.find().lean();

    res.json(apps);
  });

  // Get a single app by its app ID
  app.get(
    '/app/:appId',
    requireApp(),
    withApp(async (req, res) => {
      const { vincentApp } = req;
      res.json(vincentApp);
      return;
    }),
  );

  // Create new App
  app.post(
    '/app',
    requireVincentAuth(),
    withVincentAuth(async (req, res) => {
      await withSession(async (mongoSession) => {
        const {
          name,
          deploymentStatus,
          description,
          contactEmail,
          appUserUrl,
          logo,
          redirectUris,
          delegateeAddresses,
        } = req.body;

        const triedAppIds = new Set<number>();
        let appId: number;
        let appDef;
        let success = false;
        let attempts = 0;

        while (!success && attempts < MAX_APPID_RETRY_ATTEMPTS) {
          attempts++;

          // Generate a new appId that we haven't tried yet
          do {
            appId = generateRandomAppId();
          } while (triedAppIds.has(appId));

          triedAppIds.add(appId);

          const appVersion = new AppVersion({
            appId,
            version: NEW_APP_APPVERSION,
            changes: 'Initial version',
            enabled: true,
          });

          const appDoc = new App({
            activeVersion: NEW_APP_APPVERSION,
            appId,
            name,
            description,
            contactEmail,
            appUserUrl,
            logo,
            redirectUris,
            deploymentStatus,
            delegateeAddresses,
            managerAddress: req.vincentUser.address,
          });

          try {
            await mongoSession.withTransaction(async (session) => {
              await appVersion.save({ session });
              appDef = await appDoc.save({ session });
            });
            success = true;
          } catch (error: any) {
            // Check if the error is due to duplicate appId
            if (error.code === 11000 && error.keyPattern && error.keyPattern.appId) {
              // This is a duplicate key error for appId, try again with a new appId
              continue;
            } else {
              // This is some other error, re-throw it
              throw error;
            }
          }
        }

        if (!success) {
          res.status(500).json({
            error: 'Failed to generate unique appId after maximum attempts',
            attempts: MAX_APPID_RETRY_ATTEMPTS,
          });
          return;
        }

        res.status(201).json(appDef);
        return;
      });
    }),
  );

  // Edit App
  app.put(
    '/app/:appId',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    withVincentAuth(
      withApp(async (req, res) => {
        Object.assign(req.vincentApp, req.body);
        const updatedApp = await req.vincentApp.save();

        res.json(updatedApp);
        return;
      }),
    ),
  );

  // Create new App Version
  app.post(
    '/app/:appId/version',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    withVincentAuth(
      withApp(async (req, res) => {
        const { appId } = req.params;
        await withSession(async (mongoSession) => {
          let savedAppVersion;

          await mongoSession.withTransaction(async (session) => {
            const highest = await AppVersion.find({ appId })
              .session(session)
              .sort({ version: -1 })
              .limit(1)
              .lean();

            console.log('highest', highest);

            const appVersion = new AppVersion({
              appId,
              version: highest.length ? highest[0].version + 1 : 1,
              changes: req.body.changes,
              enabled: true,
            });

            savedAppVersion = await appVersion.save({ session });
          });

          res.status(201).json(savedAppVersion);
          return;
        });
      }),
    ),
  );

  // List App Versions
  app.get(
    '/app/:appId/versions',
    requireApp(),
    withApp(async (req, res) => {
      const { appId } = req.params;

      const versions = await AppVersion.find({ appId: appId }).sort({ version: 1 }).lean();
      res.json(versions);
      return;
    }),
  );

  // Get App Version with its AppTools
  app.get(
    '/app/:appId/version/:version',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { vincentAppVersion } = req;

      res.json(vincentAppVersion);
      return;
    }),
  );

  // Edit App Version
  app.put(
    '/app/:appId/version/:version',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    withVincentAuth(
      withAppVersion(async (req, res) => {
        const { vincentAppVersion } = req;

        Object.assign(vincentAppVersion, req.body);

        const version = await vincentAppVersion.save();
        res.json(version);
        return;
      }),
    ),
  );

  // Disable app version
  app.post(
    '/app/:appId/version/:version/disable',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    withVincentAuth(
      withAppVersion(async (req, res) => {
        const { vincentAppVersion } = req;

        Object.assign(vincentAppVersion, { enabled: false });
        const updatedAppVersion = await vincentAppVersion.save();

        res.json(updatedAppVersion);
        return;
      }),
    ),
  );

  // Enable app version
  app.post(
    '/app/:appId/version/:version/enable',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    withVincentAuth(
      withAppVersion(async (req, res) => {
        const { vincentAppVersion } = req;

        Object.assign(vincentAppVersion, { enabled: true });
        const updatedAppVersion = await vincentAppVersion.save();

        res.json(updatedAppVersion);
        return;
      }),
    ),
  );

  // List App Version Tools
  app.get(
    '/app/:appId/version/:version/tools',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { appId, version } = req.params;

      const tools = await AppTool.find({
        appId: Number(appId),
        appVersion: Number(version),
      }).lean();

      res.json(tools);
      return;
    }),
  );

  // Create App Version Tool
  app.post(
    '/app/:appId/version/:version/tool/:toolPackageName',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    withVincentAuth(
      withAppVersion(async (req, res) => {
        const { appId, version, toolPackageName } = req.params;
        const { toolVersion, hiddenSupportedPolicies } = req.body;

        try {
          const appTool = new AppTool({
            appId: Number(appId),
            appVersion: Number(version),
            toolPackageName,
            toolVersion,
            hiddenSupportedPolicies,
          });

          const savedAppTool = await appTool.save();
          res.status(201).json(savedAppTool);
          return;
        } catch (error: any) {
          if (error.code === 11000 && error.keyPattern) {
            res.status(409).json({
              message: `The tool ${toolPackageName} is already associated with this app version.`,
            });
            return;
          }
          throw error;
        }
      }),
    ),
  );

  // Get App Version Tool
  app.get(
    '/app/:appId/version/:version/tool/:toolPackageName',
    requireApp(),
    requireAppVersion(),
    requireAppTool(),
    withAppTool(async (req, res) => {
      const { vincentAppTool } = req;
      res.json(vincentAppTool);
      return;
    }),
  );

  // Update App Version Tool
  app.put(
    '/app/:appId/version/:version/tool/:toolPackageName',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    requireAppTool(),
    withVincentAuth(
      withAppTool(async (req, res) => {
        const { vincentAppTool } = req;
        const { hiddenSupportedPolicies } = req.body;

        Object.assign(vincentAppTool, { hiddenSupportedPolicies });
        const updatedAppTool = await vincentAppTool.save();

        res.json(updatedAppTool);
        return;
      }),
    ),
  );

  // Delete App Version Tool
  app.delete(
    '/app/:appId/version/:version/tool/:toolPackageName',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    requireAppTool(),
    withVincentAuth(
      withAppTool(async (req, res) => {
        const { vincentAppTool } = req;

        if (Features.HARD_DELETE_DOCS) {
          await vincentAppTool.deleteOne();
        } else {
          Object.assign(vincentAppTool, { isDeleted: true });
          await vincentAppTool.save();
        }

        res.json({ message: 'App version tool deleted successfully' });
        return;
      }),
    ),
  );

  // Undelete App Version Tool
  app.post(
    '/app/:appId/version/:version/tool/:toolPackageName/undelete',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    requireAppTool(),
    withVincentAuth(
      withAppTool(async (req, res) => {
        const { vincentAppTool } = req;

        Object.assign(vincentAppTool, { isDeleted: false });
        await vincentAppTool.save();

        res.json({ message: 'App version tool undeleted successfully' });
        return;
      }),
    ),
  );

  // Delete an app version, along with all of its tools
  app.delete(
    '/app/:appId/version/:version',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    withVincentAuth(
      withAppVersion(async (req, res) => {
        await withSession(async (mongoSession) => {
          const { appId, version } = req.params;

          await mongoSession.withTransaction(async (session) => {
            if (Features.HARD_DELETE_DOCS) {
              await AppVersion.findOneAndDelete({
                appId: Number(appId),
                version: Number(version),
              }).session(session);
              await AppTool.deleteMany({
                appId: Number(appId),
                appVersion: Number(version),
              }).session(session);
            } else {
              await AppVersion.updateOne(
                { appId: Number(appId), version: Number(version) },
                { isDeleted: true },
              ).session(session);
              await AppTool.updateMany(
                { appId: Number(appId), appVersion: Number(version) },
                { isDeleted: true },
              ).session(session);
            }
          });

          res.json({ message: 'App version and associated tools deleted successfully' });
          return;
        });
      }),
    ),
  );

  // Undelete an app version, along with all of its tools
  app.post(
    '/app/:appId/version/:version/undelete',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    withVincentAuth(
      withAppVersion(async (req, res) => {
        await withSession(async (mongoSession) => {
          const { appId, version } = req.params;

          await mongoSession.withTransaction(async (session) => {
            await AppVersion.updateOne(
              { appId: Number(appId), version: Number(version) },
              { isDeleted: false },
            ).session(session);
            await AppTool.updateMany(
              { appId: Number(appId), appVersion: Number(version) },
              { isDeleted: false },
            ).session(session);
          });

          res.json({ message: 'App version and associated tools undeleted successfully' });
          return;
        });
      }),
    ),
  );

  // Delete an app, along with all of its appVersions and their tools.
  app.delete(
    '/app/:appId',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    withVincentAuth(async (req, res) => {
      await withSession(async (mongoSession) => {
        const { appId } = req.params;

        await mongoSession.withTransaction(async (session) => {
          if (Features.HARD_DELETE_DOCS) {
            await App.findOneAndDelete({ appId }).session(session);
            await AppVersion.deleteMany({ appId }).session(session);
            await AppTool.deleteMany({ appId }).session(session);
          } else {
            await App.updateMany({ appId }, { isDeleted: true }).session(session);
            await AppVersion.updateMany({ appId }, { isDeleted: true }).session(session);
            await AppTool.updateMany({ appId }, { isDeleted: true }).session(session);
          }
        });

        res.json({ message: 'App and associated data deleted successfully' });
        return;
      });
    }),
  );

  // Undelete an app, along with all of its appVersions and their tools.
  app.post(
    '/app/:appId/undelete',
    requireVincentAuth(),
    requireApp(),
    requireUserManagesApp(),
    withVincentAuth(async (req, res) => {
      await withSession(async (mongoSession) => {
        const { appId } = req.params;

        await mongoSession.withTransaction(async (session) => {
          await App.updateMany({ appId }, { isDeleted: false }).session(session);
          await AppVersion.updateMany({ appId }, { isDeleted: false }).session(session);
          await AppTool.updateMany({ appId }, { isDeleted: false }).session(session);
        });

        res.json({ message: 'App and associated data undeleted successfully' });
        return;
      });
    }),
  );
}
