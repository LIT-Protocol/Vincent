import express, { Router } from 'express';
import { App } from '../models/app.model.ts';
import { AppVersion } from '../models/app-version.model.ts';
import { AppTool } from '../models/app-tool.model.ts';

const router: Router = express.Router();

// List apps (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const apps = await App.find().sort({ lastUpdated: -1 }).skip(skip).limit(limit);

    const total = await App.countDocuments();

    res.json({
      apps,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching apps', error });
  }
});

// Get a single app
router.get('/:identity', async (req, res) => {
  try {
    const app = await App.findOne({ identity: req.params.identity });
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }
    res.json(app);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching app', error });
  }
});

// Create new App
router.post('/', async (req, res) => {
  try {
    const {
      appId,
      name,
      description,
      contactEmail,
      appUserUrl,
      logo,
      redirectUrls,
      deploymentStatus,
      managerAddress,
    } = req.body;

    // Create identity
    const identity = `AppDef|${appId}`;

    // Create initial app version
    const initialVersion = 1;
    const appVersion = new AppVersion({
      appId,
      versionNumber: initialVersion,
      identity: `AppVersionDef|${appId}@${initialVersion}`,
      changes: 'Initial version',
      enabled: true,
      id: appId * 1000 + initialVersion,
    });

    await appVersion.save();

    // Create app
    const app = new App({
      appId,
      identity,
      id: appId, // Using appId as the record ID
      activeVersion: initialVersion,
      name,
      description,
      contactEmail,
      appUserUrl,
      logo,
      redirectUrls,
      deploymentStatus,
      managerAddress,
      lastUpdated: new Date(),
    });

    const savedApp = await app.save();
    res.status(201).json(savedApp);
  } catch (error) {
    res.status(400).json({ message: 'Error creating app', error });
  }
});

// Edit App
router.put('/:identity', async (req, res) => {
  try {
    const allowedUpdates = [
      'name',
      'description',
      'contactEmail',
      'appUserUrl',
      'logo',
      'redirectUrls',
      'deploymentStatus',
      'activeVersion',
    ];

    const updates = Object.keys(req.body)
      .filter((key) => allowedUpdates.includes(key))
      .reduce<Record<string, any>>((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    updates.lastUpdated = new Date();

    const app = await App.findOneAndUpdate({ identity: req.params.identity }, updates, {
      new: true,
    });

    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }
    res.json(app);
  } catch (error) {
    res.status(400).json({ message: 'Error updating app', error });
  }
});

// Change App Owner
router.post('/:identity/owner', async (req, res) => {
  try {
    const { managerAddress } = req.body;
    if (!managerAddress) {
      return res.status(400).json({ message: 'managerAddress is required' });
    }

    const app = await App.findOneAndUpdate(
      { identity: req.params.identity },
      {
        managerAddress,
        lastUpdated: new Date(),
      },
      { new: true },
    );

    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }
    res.json(app);
  } catch (error) {
    res.status(400).json({ message: 'Error updating app owner', error });
  }
});

// Create new App Version
router.post('/:identity/version/:version', async (req, res) => {
  try {
    const app = await App.findOne({ identity: req.params.identity });
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    const versionNumber = parseInt(req.params.version);
    if (isNaN(versionNumber)) {
      return res.status(400).json({ message: 'Invalid version number' });
    }

    const appVersion = new AppVersion({
      appId: app.appId,
      versionNumber,
      identity: `AppVersionDef|${app.appId}@${versionNumber}`,
      changes: req.body.changes,
      enabled: true,
      id: app.appId * 1000 + versionNumber,
    });

    const savedVersion = await appVersion.save();
    res.status(201).json(savedVersion);
  } catch (error) {
    res.status(400).json({ message: 'Error creating app version', error });
  }
});

// List App Versions
router.get('/:identity/versions', async (req, res) => {
  try {
    const app = await App.findOne({ identity: req.params.identity });
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    const versions = await AppVersion.find({ appId: app.appId }).sort({ versionNumber: 1 });
    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching app versions', error });
  }
});

// Get App Version
router.get('/:identity/version/:version', async (req, res) => {
  try {
    const app = await App.findOne({ identity: req.params.identity });
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    const version = await AppVersion.findOne({
      appId: app.appId,
      versionNumber: parseInt(req.params.version),
    });

    if (!version) {
      return res.status(404).json({ message: 'App version not found' });
    }

    // Get associated app tools
    const appTools = await AppTool.find({
      appId: app.appId,
      appVersionNumber: version.versionNumber,
    });

    res.json({
      version,
      tools: appTools,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching app version', error });
  }
});

// Edit App Version
router.put('/:identity/version/:version', async (req, res) => {
  try {
    const app = await App.findOne({ identity: req.params.identity });
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    const version = await AppVersion.findOneAndUpdate(
      {
        appId: app.appId,
        versionNumber: parseInt(req.params.version),
      },
      { changes: req.body.changes },
      { new: true },
    );

    if (!version) {
      return res.status(404).json({ message: 'App version not found' });
    }

    res.json(version);
  } catch (error) {
    res.status(400).json({ message: 'Error updating app version', error });
  }
});

// Disable app version
router.post('/:identity/version/:version/disable', async (req, res) => {
  try {
    const app = await App.findOne({ identity: req.params.identity });
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    const version = await AppVersion.findOneAndUpdate(
      {
        appId: app.appId,
        versionNumber: parseInt(req.params.version),
      },
      { enabled: false },
      { new: true },
    );

    if (!version) {
      return res.status(404).json({ message: 'App version not found' });
    }

    res.json(version);
  } catch (error) {
    res.status(400).json({ message: 'Error disabling app version', error });
  }
});

// Enable app version
router.post('/:identity/version/:version/enable', async (req, res) => {
  try {
    const app = await App.findOne({ identity: req.params.identity });
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    const version = await AppVersion.findOneAndUpdate(
      {
        appId: app.appId,
        versionNumber: parseInt(req.params.version),
      },
      { enabled: true },
      { new: true },
    );

    if (!version) {
      return res.status(404).json({ message: 'App version not found' });
    }

    res.json(version);
  } catch (error) {
    res.status(400).json({ message: 'Error enabling app version', error });
  }
});

// Delete an app
router.delete('/:identity', async (req, res) => {
  try {
    const app = await App.findOneAndDelete({ identity: req.params.identity });
    if (!app) {
      return res.status(404).json({ message: 'App not found' });
    }

    // Delete associated versions and tools
    await AppVersion.deleteMany({ appId: app.appId });
    await AppTool.deleteMany({ appId: app.appId });

    res.json({ message: 'App and associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting app', error });
  }
});

export const appRouter: Router = router;
