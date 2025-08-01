import type { Express } from 'express';

import { Features } from '../../../features';
import { Ability, AbilityVersion } from '../../mongo/ability.js';
import { withSession } from '../../mongo/withSession';
import { importPackage, identifySupportedPolicies } from '../../packageImporter';
import { requirePackage, withValidPackage } from '../package/requirePackage';
import { requireUserIsAuthor } from '../package/requireUserIsAuthor';
import { getPKPInfo, requireVincentAuth, withVincentAuth } from '../vincentAuth';
import { requireAbility, withAbility } from './requireAbility';
import { requireAbilityVersion, withAbilityVersion } from './requireAbilityVersion';

export function registerRoutes(app: Express) {
  // Get all abilities
  app.get('/abilities', async (_req, res) => {
    const abilities = await Ability.find().lean();
    res.json(abilities);
  });

  // Get Ability by packageName
  app.get(
    '/ability/:packageName',
    requireAbility(),
    withAbility(async (req, res) => {
      const { vincentAbility } = req;
      res.json(vincentAbility);
      return;
    }),
  );

  // Create new Ability
  app.post(
    '/ability/:packageName',
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
          type: 'ability',
        });

        // Identify supported policies from dependencies
        const { supportedPolicies, policiesNotInRegistry } = await identifySupportedPolicies(
          packageInfo.dependencies || {},
        );

        await withSession(async (mongoSession) => {
          const abilityVersion = new AbilityVersion({
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

          const ability = new Ability({
            title,
            packageName: packageInfo.name,
            authorWalletAddress: getPKPInfo(req.vincentUser.decodedJWT).ethAddress,
            description,
            logo,
            activeVersion: packageInfo.version,
            deploymentStatus: req.body.deploymentStatus || 'dev',
          });

          let savedAbility;

          try {
            await mongoSession.withTransaction(async (session) => {
              await abilityVersion.save({ session });
              savedAbility = await ability.save({ session });
            });

            res.status(201).json(savedAbility);
            return;
          } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.packageName) {
              res.status(409).json({
                message: `The ability ${packageInfo.name} is already in the Vincent Registry.`,
              });
              return;
            }

            throw error;
          }
        });
      }),
    ),
  );

  // Edit Ability
  app.put(
    '/ability/:packageName',
    requireVincentAuth,
    requireAbility(),
    requireUserIsAuthor('ability'),
    withVincentAuth(
      withAbility(async (req, res) => {
        Object.assign(req.vincentAbility, req.body);
        const updatedAbility = await req.vincentAbility.save();

        res.json(updatedAbility);
        return;
      }),
    ),
  );

  // Change Ability Owner
  app.put(
    '/ability/:packageName/owner',
    requireVincentAuth,
    requireAbility(),
    requireUserIsAuthor('ability'),
    withVincentAuth(
      withAbility(async (req, res) => {
        req.vincentAbility.authorWalletAddress = req.body.authorWalletAddress;
        const updatedAbility = await req.vincentAbility.save();

        res.json(updatedAbility);
        return;
      }),
    ),
  );

  // Create a new Ability Version
  app.post(
    '/ability/:packageName/version/:version',
    requireVincentAuth,
    requireAbility(),
    requireUserIsAuthor('ability'),
    requirePackage(),
    withVincentAuth(
      withAbility(
        withValidPackage(async (req, res) => {
          const packageInfo = req.vincentPackage;

          // Import the package to get the metadata
          const { ipfsCid } = await importPackage({
            packageName: packageInfo.name,
            version: packageInfo.version,
            type: 'ability',
          });

          // Identify supported policies from dependencies
          const { supportedPolicies, policiesNotInRegistry } = await identifySupportedPolicies(
            packageInfo.dependencies || {},
          );

          const abilityVersion = new AbilityVersion({
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
            const savedVersion = await abilityVersion.save();
            res.status(201).json(savedVersion);
            return;
          } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.packageName) {
              res.status(409).json({
                message: `The ability ${packageInfo.name}@${packageInfo.version} is already in the Vincent Registry.`,
              });
              return;
            }
            throw error;
          }
        }),
      ),
    ),
  );

  // List Ability Versions
  app.get(
    '/ability/:packageName/versions',
    requireAbility(),
    withAbility(async (req, res) => {
      const versions = await AbilityVersion.find({ packageName: req.vincentAbility.packageName })
        .sort({ version: 1 })
        .lean();
      res.json(versions);
      return;
    }),
  );

  // Get Ability Version
  app.get(
    '/ability/:packageName/version/:version',
    requireAbility(),
    requireAbilityVersion(),
    withAbilityVersion(async (req, res) => {
      const { vincentAbilityVersion } = req;
      res.json(vincentAbilityVersion);
      return;
    }),
  );

  // Edit Ability Version
  app.put(
    '/ability/:packageName/version/:version',
    requireVincentAuth,
    requireAbility(),
    requireUserIsAuthor('ability'),
    requireAbilityVersion(),
    withVincentAuth(
      withAbilityVersion(async (req, res) => {
        const { vincentAbilityVersion } = req;

        Object.assign(vincentAbilityVersion, req.body);
        const updatedVersion = await vincentAbilityVersion.save();

        res.json(updatedVersion);
        return;
      }),
    ),
  );

  // Delete an ability version
  app.delete(
    '/ability/:packageName/version/:version',
    requireVincentAuth,
    requireAbility(),
    requireUserIsAuthor('ability'),
    requireAbilityVersion(),
    withVincentAuth(
      withAbilityVersion(async (req, res) => {
        const { vincentAbilityVersion } = req;

        if (Features.HARD_DELETE_DOCS) {
          await vincentAbilityVersion.deleteOne();
        } else {
          Object.assign(vincentAbilityVersion, { isDeleted: true });
          await vincentAbilityVersion.save();
        }

        res.json({ message: 'Ability version deleted successfully' });
        return;
      }),
    ),
  );

  // Undelete an ability version
  app.post(
    '/ability/:packageName/version/:version/undelete',
    requireVincentAuth,
    requireAbility(),
    requireUserIsAuthor('ability'),
    requireAbilityVersion(),
    withVincentAuth(
      withAbilityVersion(async (req, res) => {
        const { vincentAbilityVersion } = req;

        Object.assign(vincentAbilityVersion, { isDeleted: false });
        await vincentAbilityVersion.save();

        res.json({ message: 'Ability version undeleted successfully' });
        return;
      }),
    ),
  );

  // Delete an ability, along with all of its ability versions
  app.delete(
    '/ability/:packageName',
    requireVincentAuth,
    requireAbility(),
    requireUserIsAuthor('ability'),
    withVincentAuth(async (req, res) => {
      await withSession(async (mongoSession) => {
        const { packageName } = req.params;

        await mongoSession.withTransaction(async (session) => {
          if (Features.HARD_DELETE_DOCS) {
            await Ability.findOneAndDelete({ packageName }).session(session);
            await AbilityVersion.deleteMany({ packageName }).session(session);
          } else {
            await Ability.updateMany({ packageName }, { isDeleted: true }).session(session);
            await AbilityVersion.updateMany({ packageName }, { isDeleted: true }).session(session);
          }
        });

        res.json({ message: 'Ability and associated versions deleted successfully' });
        return;
      });
    }),
  );

  // Undelete an ability, along with all of its ability versions
  app.post(
    '/ability/:packageName/undelete',
    requireVincentAuth,
    requireAbility(),
    requireUserIsAuthor('ability'),
    withVincentAuth(async (req, res) => {
      await withSession(async (mongoSession) => {
        const { packageName } = req.params;

        await mongoSession.withTransaction(async (session) => {
          await Ability.updateMany({ packageName }, { isDeleted: false }).session(session);
          await AbilityVersion.updateMany({ packageName }, { isDeleted: false }).session(session);
        });

        res.json({ message: 'Ability and associated versions undeleted successfully' });
        return;
      });
    }),
  );
}
