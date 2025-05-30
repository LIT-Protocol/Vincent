import express, { Router } from 'express';
import { Tool } from '../models/tool.model';
import { ToolVersion } from '../models/tool-version.model';

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

// Get Tool by identity
router.get('/packageName/:packageName', async (req, res) => {
  try {
    const tool = await Tool.findOne({ packageName: req.params.packageName });
    if (!tool) {
      res.status(404).json({ message: 'Tool not found' });
      return;
    }

    res.json(tool);
    return;
  } catch (error) {
    console.error('Error fetching tool:', error);
    res.status(500).json({
      message: 'Error fetching tool',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
});

// Get a single tool by ID
router.get('/:id', async (req, res) => {
  try {
    // FIXME: This should use packageName
    const tool = await Tool.findById(req.params.id);
    if (!tool) {
      res.status(404).json({ message: 'Tool not found' });
      return;
    }

    res.json(tool);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tool', error });
    return;
  }
});

// Create new Tool
router.post('/', async (req, res) => {
  try {
    const { packageName, authorWalletAddress, description } = req.body;

    // Create initial tool version
    // FIXME: This must be a real package version that we've verified
    const initialVersion = '0.1.0';
    const toolVersion = new ToolVersion({
      packageName,
      version: initialVersion,
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
      authorWalletAddress,
      description,
      activeVersion: initialVersion,
    });

    const savedTool = await tool.save();
    res.status(201).json(savedTool);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error creating tool', error });
    return;
  }
});

// Edit Tool
router.put('/:packageName', async (req, res) => {
  try {
    const tool = await Tool.findOneAndUpdate({ packageName: req.params.packageName }, req.body, {
      new: true,
    });

    if (!tool) {
      res.status(404).json({ message: 'Tool not found' });
      return;
    }

    res.json(tool);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error updating tool', error });
    return;
  }
});

// Change Tool Owner
router.post('/:packageName/owner', async (req, res) => {
  try {
    const { authorWalletAddress } = req.body;
    if (!authorWalletAddress) {
      res.status(400).json({ message: 'authorWalletAddress is required' });
      return;
    }

    const tool = await Tool.findOneAndUpdate(
      { packageName: req.params.packageName },
      { authorWalletAddress },
      { new: true },
    );

    if (!tool) {
      res.status(404).json({ message: 'Tool not found' });
    }

    res.json(tool);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error updating tool owner', error });
    return;
  }
});

// Create new Tool Version
router.post('/:packageName/version/:version', async (req, res) => {
  try {
    const tool = await Tool.findOne({ packageName: req.params.packageName });
    if (!tool) {
      res.status(404).json({ message: 'Tool not found' });
      return;
    }

    // FIXME: Check the package version.
    const toolVersion = new ToolVersion({
      packageName: tool.packageName,
      version: req.params.version,
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
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error creating tool version', error });
    return;
  }
});

// List Tool Versions
router.get('/:packageName/versions', async (req, res) => {
  try {
    const tool = await Tool.findOne({ packageName: req.params.packageName });
    if (!tool) {
      res.status(404).json({ message: 'Tool not found' });
      return;
    }

    const versions = await ToolVersion.find({ packageName: tool.packageName });

    res.json(versions);
    return;
  } catch (error) {
    console.error('Error fetching tool versions:', error);

    res.status(500).json({
      message: 'Error fetching tool versions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
});

// Get Tool Version
router.get('/:packageName/version/:version', async (req, res) => {
  try {
    const tool = await Tool.findOne({ packageName: req.params.packageName });
    if (!tool) {
      res.status(404).json({ message: 'Tool not found' });
      return;
    }

    const version = await ToolVersion.findOne({
      packageName: tool.packageName,
      version: req.params.version,
    });

    if (!version) {
      res.status(404).json({ message: 'Tool version not found' });
      return;
    }

    res.json(version);
    return;
  } catch (error) {
    console.error('Error fetching tool version:', error);
    res.status(500).json({
      message: 'Error fetching tool version',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
});

// Edit Tool Version
router.put('/:packageName/version/:version', async (req, res) => {
  try {
    const tool = await Tool.findOne({ packageName: req.params.packageName });
    if (!tool) {
      res.status(404).json({ message: 'Tool not found' });
      return;
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
      res.status(404).json({ message: 'Tool version not found' });
      return;
    }

    res.json(version);
    return;
  } catch (error) {
    console.error('Error updating tool version:', error);
    res.status(400).json({
      message: 'Error updating tool version',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
});

// Delete a tool
router.delete('/:id', async (req, res) => {
  try {
    // FIXME: Must delete all tool versions also
    // FIXME: Use packageName instead of id
    const tool = await Tool.findByIdAndDelete(req.params.id);
    if (!tool) {
      res.status(404).json({ message: 'Tool not found' });
      return;
    }
    res.json({ message: 'Tool deleted successfully' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error deleting tool', error });
    return;
  }
});

export const toolRouter: Router = router;
