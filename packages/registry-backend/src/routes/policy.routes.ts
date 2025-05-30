import express, { Router } from 'express';
import { Policy } from '../models/policy.model';
import { PolicyVersion } from '../models/policy-version.model';

const router: Router = express.Router();

// Get all policies
router.get('/', async (_req, res) => {
  try {
    const policies = await Policy.find();
    res.json(policies);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policies', error });
    return;
  }
});

// Get Policy by identity
router.get('/:identity', async (req, res) => {
  try {
    const policy = await Policy.findOne({ identity: req.params.identity });
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }
    res.json(policy);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy', error });
    return;
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
      res.status(400).json({ message: 'Missing required version fields' });
      return;
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
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error creating policy', error });
    return;
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
      res.status(404).json({ message: 'Policy not found' });
      return;
    }

    res.json(policy);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error updating policy', error });
    return;
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
      res.status(404).json({ message: 'Policy not found' });
      return;
    }

    res.json(policy);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error updating policy owner', error });
    return;
  }
});

// Create new Policy Version
router.post('/:identity/version/:version', async (req, res) => {
  try {
    const policy = await Policy.findOne({ identity: req.params.identity });
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }

    if (
      !req.body.changes ||
      !req.body.repository ||
      !req.body.description ||
      !req.body.author ||
      !req.body.ipfsCid ||
      !req.body.parameters
    ) {
      res.status(400).json({ message: 'Missing required version fields' });
      return;
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
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error creating policy version', error });
    return;
  }
});

// List Policy Versions
router.get('/:identity/versions', async (req, res) => {
  try {
    const policy = await Policy.findOne({ identity: req.params.identity });
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }

    const versions = await PolicyVersion.find({ packageName: policy.packageName });

    res.json(versions);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy versions', error });
    return;
  }
});

// Get Policy Version
router.get('/:identity/version/:version', async (req, res) => {
  try {
    const policy = await Policy.findOne({ identity: req.params.identity });
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }

    const version = await PolicyVersion.findOne({
      packageName: policy.packageName,
      version: req.params.version,
    });
    if (!version) {
      res.status(404).json({ message: 'Policy version not found' });
      return;
    }

    res.json(version);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching policy version', error });
    return;
  }
});

// Edit Policy Version
router.put('/:identity/version/:version', async (req, res) => {
  try {
    const policy = await Policy.findOne({ identity: req.params.identity });
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
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
      res.status(404).json({ message: 'Policy version not found' });
      return;
    }

    res.json(version);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error updating policy version', error });
    return;
  }
});

// Delete a policy
router.delete('/:identity', async (req, res) => {
  try {
    const policy = await Policy.findOneAndDelete({ identity: req.params.identity });
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }

    res.json({ message: 'Policy deleted successfully' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error deleting policy', error });
    return;
  }
});

export const policyRouter: Router = router;
