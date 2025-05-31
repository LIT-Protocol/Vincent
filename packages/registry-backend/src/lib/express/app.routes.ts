import express, { Router } from 'express';
import { App } from '../mongo/app.model';
import { AppVersion } from '../mongo/app-version.model';
import { AppTool } from '../mongo/app-tool.model';

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
router.get('/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const app = await App.findOne({ appId });
    if (!app) {
      res.status(404).json({ message: 'App not found' });
      return;
    }
    res.json(app);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error fetching app', error });
    return;
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

    // Create initial app version
    const appVersion = new AppVersion({
      appId,
      versionNumber: 1,
      changes: 'Initial version',
      enabled: true,
    });

    await appVersion.save();

    // Create app
    const app = new App({
      appId,
      name,
      description,
      contactEmail,
      appUserUrl,
      logo,
      redirectUrls,
      deploymentStatus,
      managerAddress,
    });

    const savedApp = await app.save();
    res.status(201).json(savedApp);
  } catch (error) {
    res.status(400).json({ message: 'Error creating app', error });
  }
});

// Edit App
router.put('/:appId', async (req, res) => {
  try {
    const app = await App.findOneAndUpdate({ appId: req.params.appId }, req.body, {
      new: true,
    });

    if (!app) {
      res.status(404).json({ message: 'App not found' });
      return;
    }
    res.json(app);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error updating app', error });
    return;
  }
});

// Change App Owner
router.post('/:appId/owner', async (req, res) => {
  try {
    const { managerAddress } = req.body;
    if (!managerAddress) {
      res.status(400).json({ message: 'managerAddress is required' });
      return;
    }

    const app = await App.findOneAndUpdate(
      { appId: req.params.appId },
      {
        managerAddress,
        lastUpdated: new Date(),
      },
      { new: true },
    );

    if (!app) {
      res.status(404).json({ message: 'App not found' });
      return;
    }
    res.json(app);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error updating app owner', error });
    return;
  }
});

// Create new App Version
router.post('/:appId/version/:version', async (req, res) => {
  try {
    const { version, appId } = req.params;

    const app = await App.findOne({ appId });
    if (!app) {
      res.status(404).json({ message: 'App not found' });
      return;
    }

    const appVersion = new AppVersion({
      appId,
      version,
      changes: req.body.changes,
      enabled: true,
    });

    const savedVersion = await appVersion.save();
    res.status(201).json(savedVersion);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error creating app version', error });
    return;
  }
});

// List App Versions
router.get('/:appId/versions', async (req, res) => {
  try {
    const app = await App.findOne({ appId: req.params.appId });
    if (!app) {
      res.status(404).json({ message: 'App not found' });
      return;
    }

    const versions = await AppVersion.find({ appId: app.appId }).sort({ versionNumber: 1 });
    res.json(versions);
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error fetching app versions', error });
    return;
  }
});

// Get App Version
router.get('/:appId/version/:version', async (req, res) => {
  try {
    const app = await App.findOne({ appId: req.params.appId });
    if (!app) {
      res.status(404).json({ message: 'App not found' });
      return;
    }

    const version = await AppVersion.findOne({
      appId: app.appId,
      versionNumber: parseInt(req.params.version),
    });

    if (!version) {
      res.status(404).json({ message: 'App version not found' });
      return;
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
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error fetching app version', error });
    return;
  }
});

// Edit App Version
router.put('/:appId/version/:version', async (req, res) => {
  try {
    const app = await App.findOne({ appId: req.params.appId });
    if (!app) {
      res.status(404).json({ message: 'App not found' });
      return;
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
      res.status(404).json({ message: 'App version not found' });
      return;
    }

    res.json(version);
  } catch (error) {
    res.status(400).json({ message: 'Error updating app version', error });
    return;
  }
});

// Disable app version
router.post('/:appId/version/:version/disable', async (req, res) => {
  try {
    const app = await App.findOne({ appId: req.params.appId });
    if (!app) {
      res.status(404).json({ message: 'App not found' });
      return;
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
      res.status(404).json({ message: 'App version not found' });
      return;
    }

    res.json(version);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error disabling app version', error });
    return;
  }
});

// Enable app version
router.post('/:appId/version/:version/enable', async (req, res) => {
  try {
    const app = await App.findOne({ appId: req.params.appId });
    if (!app) {
      res.status(404).json({ message: 'App not found' });
      return;
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
      res.status(404).json({ message: 'App version not found' });
      return;
    }

    res.json(version);
    return;
  } catch (error) {
    res.status(400).json({ message: 'Error enabling app version', error });
    return;
  }
});

// Delete an app
router.delete('/:appId', async (req, res) => {
  try {
    const app = await App.findOneAndDelete({ appId: req.params.appId });
    if (!app) {
      res.status(404).json({ message: 'App not found' });
      return;
    }

    // Delete associated versions and tools
    await AppVersion.deleteMany({ appId: app.appId });
    await AppTool.deleteMany({ appId: app.appId });

    res.json({ message: 'App and associated data deleted successfully' });
    return;
  } catch (error) {
    res.status(500).json({ message: 'Error deleting app', error });
    return;
  }
});

export const appRouter: Router = router;
