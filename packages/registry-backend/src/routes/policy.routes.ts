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
router.get('/:packageName', async (req, res) => {
  try {
    const policy = await Policy.findOne({ packageName: req.params.packageName });
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

    // Create the policy
    const policy = new Policy({
      packageName,
      authorWalletAddress,
      description,
      activeVersion,
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
    // FIXME: This should be a real transaction
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
router.put('/:packageName', async (req, res) => {
  try {
    const { description, activeVersion } = req.body;
    const policy = await Policy.findOneAndUpdate(
      { packageName: req.params.packageName },
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
router.post('/:packageName/owner', async (req, res) => {
  try {
    const { authorWalletAddress } = req.body;
    const policy = await Policy.findOneAndUpdate(
      { packageName: req.params.packageName },
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
router.post('/:packageName/version/:version', async (req, res) => {
  try {
    const policy = await Policy.findOne({ packageName: req.params.packageName });
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }

    const policyVersion = new PolicyVersion({
      ...req.body,
      packageName: policy.packageName,
      version: req.params.version,
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
router.get('/:packageName/versions', async (req, res) => {
  try {
    const policy = await Policy.findOne({ packageName: req.params.packageName });
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
router.get('/:packageName/version/:version', async (req, res) => {
  try {
    const policy = await Policy.findOne({
      packageName: req.params.packageName,
      version: req.params.version,
    });
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
router.put('/:packageName/version/:version', async (req, res) => {
  try {
    const policy = await Policy.findOne({ packageName: req.params.packageName });
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
router.delete('/:packageName', async (req, res) => {
  try {
    const policy = await Policy.findOneAndDelete({ packageName: req.params.packageName });
    if (!policy) {
      res.status(404).json({ message: 'Policy not found' });
      return;
    }

    // FIXME: All policy versions would also need to be deleted
    res.json({ message: 'Policy deleted successfully' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error deleting policy', error });
    return;
  }
});

export const policyRouter: Router = router;
