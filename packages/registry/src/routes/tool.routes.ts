import express, { Router } from 'express';
import { Tool } from '../models/tool.model.ts';
import { ToolVersion } from '../models/tool-version.model.ts';

const router: Router = express.Router();

// Get all tools
router.get('/', async (_req, res) => {
  try {
    const tools = await Tool.find();
    res.json(tools);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tools', error });
  }
});

// Get a single tool
router.get('/:id', async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tool', error });
  }
});

// Create new Tool
router.post('/', async (req, res) => {
  try {
    const { packageName, authorWalletAddress, description } = req.body;

    // Create identity
    const identity = `ToolDef|${packageName}`;

    // Create initial tool version
    const initialVersion = '0.1.0';
    const toolVersion = new ToolVersion({
      packageName,
      version: initialVersion,
      identity: `ToolVersionDef|${packageName}@${initialVersion}`,
      changes: 'Initial version',
      repository: req.body.repository,
      description,
      keywords: req.body.keywords || [],
      dependencies: req.body.dependencies || [],
      author: req.body.author,
      contributors: req.body.contributors || [],
      homepage: req.body.homepage,
      status: 'validating',
      supportedPolicies: [],
      policiesNotInRegistry: [],
      ipfsCid: req.body.ipfsCid,
    });

    await toolVersion.save();

    // Create tool
    const tool = new Tool({
      packageName,
      identity,
      authorWalletAddress,
      description,
      activeVersion: initialVersion,
    });

    const savedTool = await tool.save();
    res.status(201).json(savedTool);
  } catch (error) {
    res.status(400).json({ message: 'Error creating tool', error });
  }
});

// Get Tool
router.get('/:identity', async (req, res) => {
  try {
    const tool = await Tool.findOne({ identity: req.params.identity });
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    res.json(tool);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tool', error });
  }
});

// Edit Tool
router.put('/:identity', async (req, res) => {
  try {
    const allowedUpdates = ['description', 'activeVersion'];
    const updates = Object.keys(req.body)
      .filter((key) => allowedUpdates.includes(key))
      .reduce<Record<string, string>>((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const tool = await Tool.findOneAndUpdate({ identity: req.params.identity }, updates, {
      new: true,
    });

    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    res.json(tool);
  } catch (error) {
    res.status(400).json({ message: 'Error updating tool', error });
  }
});

// Change Tool Owner
router.post('/:identity/owner', async (req, res) => {
  try {
    const { authorWalletAddress } = req.body;
    if (!authorWalletAddress) {
      return res.status(400).json({ message: 'authorWalletAddress is required' });
    }

    const tool = await Tool.findOneAndUpdate(
      { identity: req.params.identity },
      { authorWalletAddress },
      { new: true },
    );

    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    res.json(tool);
  } catch (error) {
    res.status(400).json({ message: 'Error updating tool owner', error });
  }
});

// Create new Tool Version
router.post('/:identity/version/:version', async (req, res) => {
  try {
    const tool = await Tool.findOne({ identity: req.params.identity });
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    const toolVersion = new ToolVersion({
      packageName: tool.packageName,
      version: req.params.version,
      identity: `ToolVersionDef|${tool.packageName}@${req.params.version}`,
      changes: req.body.changes,
      repository: req.body.repository,
      description: req.body.description,
      keywords: req.body.keywords || [],
      dependencies: req.body.dependencies || [],
      author: req.body.author,
      contributors: req.body.contributors || [],
      homepage: req.body.homepage,
      status: 'validating',
      supportedPolicies: [],
      policiesNotInRegistry: [],
      ipfsCid: req.body.ipfsCid,
    });

    const savedVersion = await toolVersion.save();
    res.status(201).json(savedVersion);
  } catch (error) {
    res.status(400).json({ message: 'Error creating tool version', error });
  }
});

// List Tool Versions
router.get('/:identity/versions', async (req, res) => {
  try {
    const tool = await Tool.findOne({ identity: req.params.identity });
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    const versions = await ToolVersion.find({ packageName: tool.packageName });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tool versions', error });
  }
});

// Get Tool Version
router.get('/:identity/version/:version', async (req, res) => {
  try {
    const tool = await Tool.findOne({ identity: req.params.identity });
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    const version = await ToolVersion.findOne({
      packageName: tool.packageName,
      version: req.params.version,
    });

    if (!version) {
      return res.status(404).json({ message: 'Tool version not found' });
    }

    res.json(version);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tool version', error });
  }
});

// Edit Tool Version
router.put('/:identity/version/:version', async (req, res) => {
  try {
    const tool = await Tool.findOne({ identity: req.params.identity });
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }

    const version = await ToolVersion.findOneAndUpdate(
      {
        packageName: tool.packageName,
        version: req.params.version,
      },
      { changes: req.body.changes },
      { new: true },
    );

    if (!version) {
      return res.status(404).json({ message: 'Tool version not found' });
    }

    res.json(version);
  } catch (error) {
    res.status(400).json({ message: 'Error updating tool version', error });
  }
});

// Delete a tool
router.delete('/:id', async (req, res) => {
  try {
    const tool = await Tool.findByIdAndDelete(req.params.id);
    if (!tool) {
      return res.status(404).json({ message: 'Tool not found' });
    }
    res.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tool', error });
  }
});

export const toolRouter: Router = router;
