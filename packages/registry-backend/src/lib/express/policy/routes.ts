import { Policy, PolicyVersion } from '../../mongo/policy';
import { requirePolicy, withPolicy } from './requirePolicy';
import { requirePolicyVersion, withPolicyVersion } from './requirePolicyVersion';

import type { Express } from 'express';
import { withSession } from '../../mongo/withSession';

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
  app.post('/policy', async (req, res) => {
    await withSession(async (mongoSession) => {
      const { packageName, authorWalletAddress, description, activeVersion, version } = req.body;

      // Create the policy
      const policy = new Policy({
        packageName,
        authorWalletAddress,
        description,
        activeVersion, // FIXME: Should this be an entire PolicyVersion? Otherwise it must be optional.
      });

      // Create initial policy version
      const policyVersion = new PolicyVersion({
        ...version,
        packageName,
        version: activeVersion,
        status: 'ready',
        keywords: version.keywords || [],
        dependencies: version.dependencies || [],
        contributors: version.contributors || [],
      });

      // Save both in a transaction
      let savedPolicy, savedVersion;

      await mongoSession.withTransaction(async (session) => {
        savedPolicy = await policy.save({ session });
        savedVersion = await policyVersion.save({ session });
      });

      // FIXME: This doesn't actually match our OpenAPI spec - which should we change? Should we allow a Policy before there is a PolicyVersion?
      res.status(201).json({
        policy: savedPolicy,
        version: savedVersion,
      });
      return;
    });
  });

  // Edit Policy
  app.put(
    '/policy/:packageName',
    requirePolicy(),
    withPolicy(async (req, res) => {
      const updatedPolicy = await req.vincentPolicy.updateOne(req.body, { new: true }).lean();

      res.json(updatedPolicy);
      return;
    }),
  );

  // Change Policy Owner
  app.post(
    '/policy/:packageName/owner',
    requirePolicy(),
    withPolicy(async (req, res) => {
      const { authorWalletAddress } = req.body;

      const updatedPolicy = await req.vincentPolicy
        .updateOne({ authorWalletAddress }, { new: true })
        .lean();

      res.json(updatedPolicy);
      return;
    }),
  );

  // Create new Policy Version
  app.post(
    '/policy/:packageName/version/:version',
    requirePolicy(),
    withPolicy(async (req, res) => {
      const { version } = req.params;

      const policyVersion = new PolicyVersion({
        ...req.body,
        packageName: req.vincentPolicy.packageName,
        version: version,
        status: 'ready',
        keywords: req.body.keywords || [],
        dependencies: req.body.dependencies || [],
        contributors: req.body.contributors || [],
      });

      const savedVersion = await policyVersion.save();
      res.status(201).json(savedVersion);
      return;
    }),
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
    requirePolicy(),
    requirePolicyVersion(),
    withPolicyVersion(async (req, res) => {
      const { vincentPolicyVersion } = req;

      const updatedVersion = await vincentPolicyVersion
        .updateOne({ changes: req.body.changes }, { new: true })
        .lean();

      res.json(updatedVersion);
      return;
    }),
  );

  // Delete a policy, along with all of its policy versions
  app.delete('/policy/:packageName', async (req, res) => {
    await withSession(async (mongoSession) => {
      const { packageName } = req.params;

      // FIXME: Would be nice if this was an atomic transaction
      await mongoSession.withTransaction(async (session) => {
        await Policy.findOneAndDelete({ packageName }).session(session);
        await PolicyVersion.deleteMany({ packageName }).session(session);
      });
      res.json({ message: 'Policy and associated versions deleted successfully' });
      return;
    });
  });
}
