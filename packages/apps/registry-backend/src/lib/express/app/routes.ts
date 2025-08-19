import type { Express } from 'express';

import { env } from '../../../env';
import { Features } from '../../../features';
import { getContractClient } from '../../contractClient';
import { App, AppAbility, AppVersion } from '../../mongo/app';
import { withSession } from '../../mongo/withSession';
import { getPKPInfo, requireVincentAuth, withVincentAuth } from '../vincentAuth';
import { requireApp, withApp } from './requireApp';
import { requireAppAbility, withAppAbility } from './requireAppAbility';
import { requireAppOnChain, withAppOnChain } from './requireAppOnChain';
import { requireAppVersion, withAppVersion } from './requireAppVersion';
import { requireAppVersionNotOnChain } from './requireAppVersionNotOnChain';
import { requireUserManagesApp } from './requireUserManagesApp';

const { LIT_RELAYER_API_KEY, LIT_PAYER_SECRET_KEY } = env;

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
    requireVincentAuth,
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
            appId,
            name,
            description,
            contactEmail,
            appUserUrl,
            logo,
            redirectUris,
            deploymentStatus,
            delegateeAddresses,
            managerAddress: getPKPInfo(req.vincentUser.decodedJWT).ethAddress,
          });

          // First, check if the appId exists in chain state; someone may have registered it off-registry
          const appOnChain = await getContractClient().getAppById({
            appId,
          });

          if (appOnChain) {
            continue;
          }

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
    requireAppVersionNotOnChain(),
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

        if (vincentAppVersion.isDeleted || !vincentAppVersion.enabled) {
          res.status(400).json({
            message:
              'Cannot set deleted or disabled app version as active. Make sure the appVersion is not deleted and is enabled, then try again.',
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

  // Register delegatee addresses in the payment DB contract via the relayer
  // so that the app dev doesn't have to think about RLI NFTs
  app.post(
    '/app/:appId/sponsorDelegateesPayment',
    requireVincentAuth,
    requireApp(),
    requireUserManagesApp(),
    withVincentAuth(
      withApp(async (req, res) => {
        const { delegateeAddresses } = req.vincentApp;

        const response = await fetch('https://datil-relayer.getlit.dev/add-users', {
          method: 'POST',
          headers: {
            'api-key': LIT_RELAYER_API_KEY,
            'payer-secret-key': LIT_PAYER_SECRET_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(delegateeAddresses),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Failed to add delegatees as payees -- status: ${response.status} - ${text}`,
          );
        }

        res.json({ message: 'Delegatees are sponsored for LIT chain usage costs' });
        return;
      }),
    ),
  );
}
