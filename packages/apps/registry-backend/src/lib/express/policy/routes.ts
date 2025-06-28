import { Policy, PolicyVersion } from '../../mongo/policy';
import { requirePolicy, withPolicy } from './requirePolicy';
import { requirePolicyVersion, withPolicyVersion } from './requirePolicyVersion';
import { requirePackage, withValidPackage } from '../package/requirePackage';
import { requireVincentAuth, withVincentAuth } from '../requireVincentAuth';

import type { Express } from 'express';
import { withSession } from '../../mongo/withSession';
import { Features } from '../../../features';
import { importPackage } from '../../packageImporter';

export function registerRoutes(app: Express) {
  // List all policies
  app.get('/policies', async (_req, res) => {
    const policies = await Policy.find().lean();
    res.json(policies);
  });

  // Get Policy by its package name
  app.get(
    '/policy/:packageName',
    requirePolicy(),
    withPolicy(async (req, res) => {
      const { vincentPolicy } = req;
      res.json(vincentPolicy);
      return;
    }),
  );

  // Create new Policy
  app.post(
    '/policy/:packageName',
    requireVincentAuth(),
    requirePackage('packageName', 'activeVersion'),
    withVincentAuth(
      withValidPackage(async (req, res) => {
        const { description, activeVersion, title } = req.body;
        const packageInfo = req.vincentPackage;

        // Import the package to get the metadata
        const { ipfsCid, uiSchema, jsonSchema } = await importPackage({
          packageName: packageInfo.name,
          version: packageInfo.version,
          type: 'policy',
        });

        await withSession(async (mongoSession) => {
          // Create the policy
          const policy = new Policy({
            title,
            packageName: packageInfo.name,
            authorWalletAddress: req.vincentUser.address,
            description,
            activeVersion,
          });

          // Create initial policy version
          const policyVersion = new PolicyVersion({
            changes: 'Initial version',
            packageName: packageInfo.name,
            description: packageInfo.description,
            version: packageInfo.version,
            repository: packageInfo.repository,
            keywords: packageInfo.keywords || [],
            dependencies: packageInfo.dependencies || {},
            author: packageInfo.author,
            contributors: packageInfo.contributors || [],
            homepage: packageInfo.homepage,
            ipfsCid,
            parameters: {
              uiSchema: uiSchema ? JSON.stringify(uiSchema) : undefined,
              jsonSchema: jsonSchema ? JSON.stringify(jsonSchema) : undefined,
            },
          });

          // Save both in a transaction
          let savedPolicy;

          try {
            await mongoSession.withTransaction(async (session) => {
              savedPolicy = await policy.save({ session });
              await policyVersion.save({ session });
            });

            // Return only the policy to match OpenAPI spec
            res.status(201).json(savedPolicy);
            return;
          } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.packageName) {
              res.status(409).json({
                message: `The policy ${packageInfo.name} is already in the Vincent Registry.`,
              });
              return;
            }

            throw error;
          }
        });
      }),
    ),
  );

  // Edit Policy
  app.put(
    '/policy/:packageName',
    requireVincentAuth(),
    requirePolicy(),
    withVincentAuth(
      withPolicy(async (req, res) => {
        Object.assign(req.vincentPolicy, req.body);
        const updatedPolicy = await req.vincentPolicy.save();

        res.json(updatedPolicy);
        return;
      }),
    ),
  );

  // Change Policy Owner
  app.put(
    '/policy/:packageName/owner',
    requireVincentAuth(),
    requirePolicy(),
    withVincentAuth(
      withPolicy(async (req, res) => {
        req.vincentPolicy.authorWalletAddress = req.vincentUser.address;
        const updatedPolicy = await req.vincentPolicy.save();

        res.json(updatedPolicy);
        return;
      }),
    ),
  );

  // Create new Policy Version
  app.post(
    '/policy/:packageName/version/:version',
    requireVincentAuth(),
    requirePolicy(),
    requirePackage(),
    withVincentAuth(
      withPolicy(
        withValidPackage(async (req, res) => {
          const packageInfo = req.vincentPackage;

          try {
            // Import the package to get the metadata
            const { ipfsCid, uiSchema, jsonSchema } = await importPackage({
              packageName: packageInfo.name,
              version: packageInfo.version,
              type: 'policy',
            });

            const policyVersion = new PolicyVersion({
              ...req.body,
              description: packageInfo.description,
              packageName: packageInfo.name,
              version: packageInfo.version,
              repository: packageInfo.repository,
              keywords: packageInfo.keywords || [],
              dependencies: packageInfo.dependencies || {},
              author: packageInfo.author,
              contributors: packageInfo.contributors || [],
              homepage: packageInfo.homepage,
              ipfsCid,
              parameters: {
                uiSchema: uiSchema ? JSON.stringify(uiSchema) : undefined,
                jsonSchema: jsonSchema ? JSON.stringify(jsonSchema) : undefined,
              },
            });

            const savedVersion = await policyVersion.save();

            res.status(201).json(savedVersion);
            return;
          } catch (error: any) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.packageName) {
              res.status(409).json({
                message: `The policy ${packageInfo.name}@${packageInfo.version} is already in the Vincent Registry.`,
              });
              return;
            }
            throw error;
          }
        }),
      ),
    ),
  );

  // List Policy Versions
  app.get(
    '/policy/:packageName/versions',
    requirePolicy(),
    withPolicy(async (req, res) => {
      const versions = await PolicyVersion.find({ packageName: req.vincentPolicy.packageName })
        .sort({ version: 1 })
        .lean();

      res.json(versions);
      return;
    }),
  );

  // Get Policy Version
  app.get(
    '/policy/:packageName/version/:version',
    requirePolicy(),
    requirePolicyVersion(),
    withPolicyVersion(async (req, res) => {
      const { vincentPolicyVersion } = req;
      res.json(vincentPolicyVersion);
      return;
    }),
  );

  // Edit Policy Version
  app.put(
    '/policy/:packageName/version/:version',
    requireVincentAuth(),
    requirePolicy(),
    requirePolicyVersion(),
    withVincentAuth(
      withPolicyVersion(async (req, res) => {
        const { vincentPolicyVersion } = req;

        Object.assign(vincentPolicyVersion, req.body);
        const updatedVersion = await vincentPolicyVersion.save();

        res.json(updatedVersion);
        return;
      }),
    ),
  );

  // Delete a policy, along with all of its policy versions
  app.delete(
    '/policy/:packageName',
    requireVincentAuth(),
    withVincentAuth(async (req, res) => {
      await withSession(async (mongoSession) => {
        const { packageName } = req.params;

        await mongoSession.withTransaction(async (session) => {
          if (Features.HARD_DELETE_DOCS) {
            await Policy.findOneAndDelete({ packageName }).session(session);
            await PolicyVersion.deleteMany({ packageName }).session(session);
          } else {
            await Policy.updateMany({ packageName }, { isDeleted: true }).session(session);
            await PolicyVersion.updateMany({ packageName }, { isDeleted: true }).session(session);
          }
        });
        res.json({ message: 'Policy and associated versions deleted successfully' });
        return;
      });
    }),
  );
}
