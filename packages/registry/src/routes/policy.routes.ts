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

// Get a single policy
router.get('/:id', async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
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
    const { packageName, authorWalletAddress, description, activeVersion } = req.body;

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
      ...req.body.version,
      packageName,
      identity: `PolicyVersionDef|${packageName}@${activeVersion}`,
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

// Get Policy
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

    const versionIdentity = `PolicyVersionDef|${policy.packageName}@${req.params.version}`;
    const policyVersion = new PolicyVersion({
      ...req.body,
      packageName: policy.packageName,
      version: req.params.version,
      identity: versionIdentity,
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
router.delete('/:id', async (req, res) => {
  try {
    const policy = await Policy.findByIdAndDelete(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting policy', error });
  }
});

export const policyRouter: Router = router;
