import { App, AppTool, AppVersion } from '../../mongo/app';

import type { Express } from 'express';
import { requireApp, withApp } from './requireApp';
import { requireAppVersion, withAppVersion } from './requireAppVersion';

export function registerRoutes(app: Express) {
  // List all apps
  app.get('/apps', async (req, res) => {
    try {
      const apps = await App.find().lean();

      res.json(apps);
      return;
    } catch (error) {
      res.status(500).json({ message: 'Error fetching apps', error });
      return;
    }
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
  app.post('/app', async (req, res) => {
    try {
      const {
        appId,
        name,
        description,
        contactEmail,
        appUserUrl,
        logo,
        redirectUris,
        deploymentStatus,
        managerAddress,
      } = req.body;

      // Create initial app version
      const appVersion = new AppVersion({
        appId,
        version: 1,
        changes: 'Initial version',
        enabled: true,
      });

      await appVersion.save();

      // Create app
      const app = new App({
        activeVersion: 1,
        appId,
        name,
        description,
        contactEmail,
        appUserUrl,
        logo,
        redirectUris,
        deploymentStatus,
        managerAddress,
      });

      const appDef = await app.save();
      res.status(201).json(appDef);
      return;
    } catch (error) {
      res.status(500).json({ message: 'Error creating app', error });
      return;
    }
  });

  // Edit App
  app.put(
    '/app/:appId',
    requireApp(),
    withApp(async (req, res) => {
      const { appId } = req.params;

      try {
        const updatedApp = await req.vincentApp.updateOne(req.body, { new: true }).lean();

        res.json(updatedApp);
        return;
      } catch (error) {
        res.status(500).json({ message: `Error updating app ${appId}`, error });
        return;
      }
    }),
  );

  // Change App Owner
  app.post(
    '/app/:appId/owner',
    requireApp(),
    withApp(async (req, res) => {
      const { appId } = req.params;
      try {
        const updatedApp = await req.vincentApp
          .updateOne({ managerAddress: req.body.managerAddress }, { new: true })
          .lean();

        res.json(updatedApp);
        return;
      } catch (error) {
        res.status(500).json({ message: `Error updating app owner for ${appId}`, error });
        return;
      }
    }),
  );

  // Create new App Version
  app.post(
    '/app/:appId/version/:version',
    requireApp(),
    withApp(async (req, res) => {
      const { version, appId } = req.params;

      try {
        const appVersion = new AppVersion({
          appId,
          version,
          changes: req.body.changes,
          enabled: true,
        });

        const savedVersion = await appVersion.save();
        res.status(201).json(savedVersion);
        return;
      } catch (error) {
        res.status(500).json({ message: 'Error creating app version', error });
        return;
      }
    }),
  );

  // List App Versions
  app.get(
    '/app/:appId/versions',
    requireApp(),
    withApp(async (req, res) => {
      const { appId } = req.params;

      try {
        const versions = await AppVersion.find({ appId: appId }).sort({ version: 1 }).lean();
        res.json(versions);
        return;
      } catch (error) {
        res.status(500).json({ message: 'Error fetching app versions', error });
        return;
      }
    }),
  );

  // Get App Version with its AppTools
  app.get(
    '/app/:appId/version/:version',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { vincentApp, vincentAppVersion } = req;
      try {
        // Get associated app tools
        const appTools = await AppTool.find({
          appId: vincentApp.appId,
          appVersion: vincentAppVersion.version,
        }).lean();

        res.json({
          version: vincentAppVersion.version,
          tools: appTools,
        });
        return;
      } catch (error) {
        res.status(500).json({
          message: `Error fetching app version ${vincentAppVersion.version} for app ${vincentApp.appId}`,
          error,
        });
        return;
      }
    }),
  );

  // Edit App Version
  app.put(
    '/app/:appId/version/:version',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { vincentApp, vincentAppVersion } = req;

      try {
        const version = await vincentAppVersion
          .updateOne({ changes: req.body.changes }, { new: true })
          .lean();

        res.json(version);
        return;
      } catch (error) {
        res.status(500).json({
          message: `Error updating app version ${vincentAppVersion.version} for app ${vincentApp.appId}`,
          error,
        });
        return;
      }
    }),
  );

  // Disable app version
  app.post(
    '/app/:appId/version/:version/disable',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { vincentApp, vincentAppVersion } = req;

      try {
        const { vincentAppVersion } = req;

        const updatedAppVersion = await vincentAppVersion
          .updateOne({ enabled: false }, { new: true })
          .lean();

        res.json(updatedAppVersion);
        return;
      } catch (error) {
        res.status(500).json({
          message: `Error disabling app version ${vincentAppVersion.version} for app ${vincentApp.appId}`,
          error,
        });
        return;
      }
    }),
  );

  // Enable app version
  app.post(
    '/app/:appId/version/:version/enable',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { vincentApp, vincentAppVersion } = req;

      try {
        const { vincentAppVersion } = req;

        const updatedAppVersion = await vincentAppVersion
          .updateOne({ enabled: true }, { new: true })
          .lean();

        res.json(updatedAppVersion);
        return;
      } catch (error) {
        res.status(500).json({
          message: `Error enabling app version ${vincentAppVersion.version} for app ${vincentApp.appId}`,
          error,
        });
        return;
      }
    }),
  );

  // Delete an app, along with all of its appVersions and their tools.
  app.delete('/app/:appId', async (req, res) => {
    try {
      const { appId } = req.params;

      // FIXME: Would be nice if this was an atomic transaction
      await Promise.all([
        App.findOneAndDelete({ appId }),
        AppVersion.deleteMany({ appId }),
        AppTool.deleteMany({ appId }),
      ]);

      res.json({ message: 'App and associated data deleted successfully' });
      return;
    } catch (error) {
      res.status(500).json({ message: 'Error deleting app', error });
      return;
    }
  });
}
