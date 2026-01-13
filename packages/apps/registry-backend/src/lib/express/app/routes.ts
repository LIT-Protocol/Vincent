import type { Express } from 'express';

import { Features } from '../../../features';
import { getContractClient } from '../../contractClient';
import { App, AppAbility, AppVersion } from '../../mongo/app';
import { withSession } from '../../mongo/withSession';
import { requireVincentAuth, withVincentAuth } from '../vincentAuth';
import { requireApp, withApp } from './requireApp';
import { requireAppAbility, withAppAbility } from './requireAppAbility';
import { requireAppOnChain, withAppOnChain } from './requireAppOnChain';
import { requireAppVersion, withAppVersion } from './requireAppVersion';
import { requireAppVersionNotOnChain } from './requireAppVersionNotOnChain';
import { requireUserManagesApp } from './requireUserManagesApp';

const NEW_APP_APPVERSION = 1;

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
    requireVincentAuth,
    withVincentAuth(async (req, res) => {
      await withSession(async (mongoSession) => {
        const { appId, name, deploymentStatus, description, contactEmail, appUrl, logo } = req.body;

        // Verify the appId exists on-chain (must be registered there first)
        console.log('[createApp] Checking appId on-chain:', appId);
        const appOnChain = await getContractClient().getAppById({ appId });
        console.log('[createApp] getAppById result:', appOnChain);
        if (!appOnChain) {
          res.status(400).json({
            error: 'Provided appId is not registered on-chain. Register the app on-chain first.',
          });
          return;
        }

        // Verify the user is the on-chain app manager
        const userAddress = req.vincentUser.address;
        if (appOnChain.manager.toLowerCase() !== userAddress.toLowerCase()) {
          res.status(403).json({
            error: 'You are not the manager of this app on-chain',
          });
          return;
        }

        // Check if appId already exists in database
        const existingApp = await App.findOne({ appId });
        if (existingApp) {
          res.status(409).json({
            error: 'App with this appId already exists in the registry',
          });
          return;
        }

        const appVersion = new AppVersion({
          appId,
          version: NEW_APP_APPVERSION,
          changes: 'Initial version',
        });

        const appDoc = new App({
          appId,
          name,
          description,
          contactEmail,
          appUrl,
          logo,
          deploymentStatus,
          managerAddress: userAddress,
        });

        let appDef;
        await mongoSession.withTransaction(async (session) => {
          await appVersion.save({ session });
          appDef = await appDoc.save({ session });
        });

        res.status(201).json(appDef);
        return;
      });
    }),
  );

  // Edit App
  app.put(
    '/app/:appId',
    requireVincentAuth,
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
    requireVincentAuth,
    requireApp(),
    requireUserManagesApp(),
    requireAppOnChain(),
    withVincentAuth(
      withApp(
        withAppOnChain(async (req, res) => {
          const { appId } = req.params;
          const { latestVersion: onChainHighestVersion } = req.vincentAppOnChain;
          const newVersion = Number(onChainHighestVersion) + 1;

          try {
            await withSession(async (mongoSession) => {
              let savedAppVersion;

              await mongoSession.withTransaction(async (session) => {
                const [latestOnRegistry] = await AppVersion.find({ appId })
                  .session(session)
                  .sort({ version: -1 })
                  .limit(1)
                  .lean()
                  .orFail(); // If no appVersions exist in registry something is very wrong, as the app must exist to get here

                const { version: onRegistryHighestVersion } = latestOnRegistry;

                if (!(onRegistryHighestVersion <= Number(onChainHighestVersion))) {
                  // There can only be 1 'pending' app version for an app on the registry.
                  // This <= check will keep us from getting way ahead in case RPC is massively delayed
                  throw new Error(
                    `There can only be 1 pending app version for an app on the registry.`,
                  );
                }

                const appVersion = new AppVersion({
                  appId,
                  version: newVersion,
                  changes: req.body.changes,
                  enabled: true,
                });

                // If by some chance there is a race (chain state is way out-of-date), this call will fail due to unique constraints
                savedAppVersion = await appVersion.save({ session });
              });

              res.status(201).json(savedAppVersion);
              return;
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            if (err.code === 11000) {
              // Duplicate appId+version — someone else beat us to it
              throw new Error(`App version ${newVersion} already exists in the registry.`);
            }
            throw err;
          }
        }),
      ),
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

  // Get App Version with its AppAbilities
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
    requireVincentAuth,
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
    requireVincentAuth,
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
    requireVincentAuth,
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

  // List App Version Abilities
  app.get(
    '/app/:appId/version/:version/abilities',
    requireApp(),
    requireAppVersion(),
    withAppVersion(async (req, res) => {
      const { appId, version } = req.params;

      const abilities = await AppAbility.find({
        appId: Number(appId),
        appVersion: Number(version),
      }).lean();

      res.json(abilities);
      return;
    }),
  );

  // Create App Version Ability
  app.post(
    '/app/:appId/version/:version/ability/:abilityPackageName',
    requireVincentAuth,
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    withVincentAuth(
      withAppVersion(async (req, res) => {
        const { appId, version, abilityPackageName } = req.params;
        const { abilityVersion, hiddenSupportedPolicies } = req.body;

        try {
          const appAbility = new AppAbility({
            appId: Number(appId),
            appVersion: Number(version),
            abilityPackageName,
            abilityVersion,
            hiddenSupportedPolicies,
          });

          const savedAppAbility = await appAbility.save();
          res.status(201).json(savedAppAbility);
          return;
        } catch (error: any) {
          if (error.code === 11000 && error.keyPattern) {
            res.status(409).json({
              message: `The ability ${abilityPackageName} is already associated with this app version.`,
            });
            return;
          }
          throw error;
        }
      }),
    ),
  );

  // Get App Version Ability
  app.get(
    '/app/:appId/version/:version/ability/:abilityPackageName',
    requireApp(),
    requireAppVersion(),
    requireAppAbility(),
    withAppAbility(async (req, res) => {
      const { vincentAppAbility } = req;
      res.json(vincentAppAbility);
      return;
    }),
  );

  // Update App Version Ability
  app.put(
    '/app/:appId/version/:version/ability/:abilityPackageName',
    requireVincentAuth,
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    requireAppVersionNotOnChain(),
    requireAppAbility(),
    withVincentAuth(
      withAppAbility(async (req, res) => {
        const { vincentAppAbility } = req;
        const { hiddenSupportedPolicies } = req.body;

        Object.assign(vincentAppAbility, { hiddenSupportedPolicies });
        const updatedAppAbility = await vincentAppAbility.save();

        res.json(updatedAppAbility);
        return;
      }),
    ),
  );

  // Delete App Version Ability
  app.delete(
    '/app/:appId/version/:version/ability/:abilityPackageName',
    requireVincentAuth,
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    requireAppVersionNotOnChain(),
    requireAppAbility(),
    withVincentAuth(
      withAppAbility(async (req, res) => {
        const { vincentAppAbility } = req;

        if (Features.HARD_DELETE_DOCS) {
          await vincentAppAbility.deleteOne();
        } else {
          Object.assign(vincentAppAbility, { isDeleted: true });
          await vincentAppAbility.save();
        }

        res.json({ message: 'App version ability deleted successfully' });
        return;
      }),
    ),
  );

  // Undelete App Version Ability
  app.post(
    '/app/:appId/version/:version/ability/:abilityPackageName/undelete',
    requireVincentAuth,
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    requireAppVersionNotOnChain(),
    requireAppAbility(),
    withVincentAuth(
      withAppAbility(async (req, res) => {
        const { vincentApp, vincentAppVersion, vincentAppAbility } = req;

        if (vincentApp.isDeleted || vincentAppVersion.isDeleted) {
          res.status(400).json({
            message:
              'Cannot undelete an app version ability if the app or version is deleted; you must undelete the app version / app first.',
          });
          return;
        }

        Object.assign(vincentAppAbility, { isDeleted: false });
        await vincentAppAbility.save();

        res.json({ message: 'App version ability undeleted successfully' });
        return;
      }),
    ),
  );

  // Delete an app version, along with all of its abilities
  app.delete(
    '/app/:appId/version/:version',
    requireVincentAuth,
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
            } else {
              await AppVersion.updateOne(
                { appId: Number(appId), version: Number(version) },
                { isDeleted: true },
              ).session(session);
            }
          });

          res.json({ message: 'App version and associated abilities deleted successfully' });
          return;
        });
      }),
    ),
  );

  // Undelete an app version, along with all of its abilities
  app.post(
    '/app/:appId/version/:version/undelete',
    requireVincentAuth,
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
          });

          res.json({ message: 'App version and associated abilities undeleted successfully' });
          return;
        });
      }),
    ),
  );

  // Delete an app, along with all of its appVersions and their abilities.
  app.delete(
    '/app/:appId',
    requireVincentAuth,
    requireApp(),
    requireUserManagesApp(),
    withVincentAuth(async (req, res) => {
      await withSession(async (mongoSession) => {
        const { appId } = req.params;

        await mongoSession.withTransaction(async (session) => {
          if (Features.HARD_DELETE_DOCS) {
            await App.findOneAndDelete({ appId }).session(session);
          } else {
            await App.updateOne({ appId: Number(appId) }, { isDeleted: true }).session(session);
          }
        });

        res.json({ message: 'App and associated data deleted successfully' });
        return;
      });
    }),
  );

  // Undelete an app, along with all of its appVersions and their abilities.
  app.post(
    '/app/:appId/undelete',
    requireVincentAuth,
    requireApp(),
    requireUserManagesApp(),
    withVincentAuth(async (req, res) => {
      await withSession(async (mongoSession) => {
        const { appId } = req.params;

        await mongoSession.withTransaction(async (session) => {
          await App.updateOne({ appId: Number(appId) }, { isDeleted: false }).session(session);
        });

        res.json({ message: 'App and associated data undeleted successfully' });
        return;
      });
    }),
  );

  // Set the active version of an app
  app.post(
    '/app/:appId/setActiveVersion',
    requireVincentAuth,
    requireApp(),
    requireUserManagesApp(),
    requireAppVersion(),
    withVincentAuth(
      withAppVersion(async (req, res) => {
        const { vincentApp, vincentAppVersion } = req;

        if (vincentApp.isDeleted) {
          res.status(400).json({
            message: 'Cannot set an app version as active if its app is deleted',
          });
          return;
        }

        if (vincentAppVersion.isDeleted) {
          res.status(400).json({
            message:
              'Cannot set deleted app version as active. Make sure the appVersion is not deleted, then try again.',
          });
          return;
        }

        // Check if the app version exists on-chain
        const appVersionOnChain = await getContractClient().getAppVersion({
          appId: vincentApp.appId,
          version: vincentAppVersion.version,
        });

        if (!appVersionOnChain) {
          res.status(400).json({
            message: `App version ${vincentAppVersion.version} must be published on-chain to be made the active version`,
          });
          return;
        }

        // Update the active version using updateOne()
        await App.updateOne(
          { appId: vincentApp.appId },
          { activeVersion: vincentAppVersion.version },
        );

        res.json({ message: 'App activeVersion updated successfully' });
        return;
      }),
    ),
  );
}
