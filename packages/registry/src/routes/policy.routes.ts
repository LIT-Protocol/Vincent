import express, { Router } from 'express';
import { Policy } from '../models/policy.model.ts';
import { PolicyVersion } from '../models/policy-version.model.ts';

const router: Router = express.Router();

// Get all policies
router.get('/', async (_req, res) => {
  try {
    const policies = await Policy.find();
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policies', error });
  }
});

// Get Policy by identity
router.get('/:identity', async (req, res) => {
  try {
    const policy = await Policy.findOne({ identity: req.params.identity });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy', error });
  }
});

// Create new Policy
router.post('/', async (req, res) => {
  try {
    const { packageName, authorWalletAddress, description, activeVersion, version } = req.body;

    if (
      !version ||
      !version.changes ||
      !version.repository ||
      !version.description ||
      !version.author ||
      !version.ipfsCid ||
      !version.parameters
    ) {
      return res.status(400).json({ message: 'Missing required version fields' });
    }

    // Create the policy identity
    const identity = `PolicyDef|${packageName}`;

    // Create the policy
    const policy = new Policy({
      packageName,
      identity,
      authorWalletAddress,
      description,
      activeVersion,
    });

    // Create initial policy version
    const policyVersion = new PolicyVersion({
      ...version,
      packageName,
      version: activeVersion,
      identity: `PolicyVersionDef|${packageName}@${activeVersion}`,
      status: 'ready',
      keywords: version.keywords || [],
      dependencies: version.dependencies || [],
      contributors: version.contributors || [],
    });

    // Save both in a transaction
    const [savedPolicy, savedVersion] = await Promise.all([policy.save(), policyVersion.save()]);

    res.status(201).json({
      policy: savedPolicy,
      version: savedVersion,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error creating policy', error });
  }
});

// Edit Policy
router.put('/:identity', async (req, res) => {
  try {
    const { description, activeVersion } = req.body;
    const policy = await Policy.findOneAndUpdate(
      { identity: req.params.identity },
      { description, activeVersion },
      { new: true },
    );
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    res.status(400).json({ message: 'Error updating policy', error });
  }
});

// Change Policy Owner
router.post('/:identity/owner', async (req, res) => {
  try {
    const { authorWalletAddress } = req.body;
    const policy = await Policy.findOneAndUpdate(
      { identity: req.params.identity },
      { authorWalletAddress },
      { new: true },
    );
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    res.status(400).json({ message: 'Error updating policy owner', error });
  }
});

// Create new Policy Version
router.post('/:identity/version/:version', async (req, res) => {
  try {
    const policy = await Policy.findOne({ identity: req.params.identity });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    if (
      !req.body.changes ||
      !req.body.repository ||
      !req.body.description ||
      !req.body.author ||
      !req.body.ipfsCid ||
      !req.body.parameters
    ) {
      return res.status(400).json({ message: 'Missing required version fields' });
    }

    const versionIdentity = `PolicyVersionDef|${policy.packageName}@${req.params.version}`;
    const policyVersion = new PolicyVersion({
      ...req.body,
      packageName: policy.packageName,
      version: req.params.version,
      identity: versionIdentity,
      status: 'ready',
      keywords: req.body.keywords || [],
      dependencies: req.body.dependencies || [],
      contributors: req.body.contributors || [],
    });

    const savedVersion = await policyVersion.save();
    res.status(201).json(savedVersion);
  } catch (error) {
    res.status(400).json({ message: 'Error creating policy version', error });
  }
});

// List Policy Versions
router.get('/:identity/versions', async (req, res) => {
  try {
    const policy = await Policy.findOne({ identity: req.params.identity });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    const versions = await PolicyVersion.find({ packageName: policy.packageName });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy versions', error });
  }
});

// Get Policy Version
router.get('/:identity/version/:version', async (req, res) => {
  try {
    const policy = await Policy.findOne({ identity: req.params.identity });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    const version = await PolicyVersion.findOne({
      packageName: policy.packageName,
      version: req.params.version,
    });
    if (!version) {
      return res.status(404).json({ message: 'Policy version not found' });
    }

    res.json(version);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy version', error });
  }
});

// Edit Policy Version
router.put('/:identity/version/:version', async (req, res) => {
  try {
    const policy = await Policy.findOne({ identity: req.params.identity });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    const version = await PolicyVersion.findOneAndUpdate(
      {
        packageName: policy.packageName,
        version: req.params.version,
      },
      { changes: req.body.changes },
      { new: true },
    );
    if (!version) {
      return res.status(404).json({ message: 'Policy version not found' });
    }

    res.json(version);
  } catch (error) {
    res.status(400).json({ message: 'Error updating policy version', error });
  }
});

// Delete a policy
router.delete('/:identity', async (req, res) => {
  try {
    const policy = await Policy.findOneAndDelete({ identity: req.params.identity });
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting policy', error });
  }
});

export const policyRouter: Router = router;
