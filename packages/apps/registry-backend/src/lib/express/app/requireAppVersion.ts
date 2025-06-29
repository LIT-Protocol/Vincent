import { Request, Response, NextFunction } from 'express';
import { AppVersion } from '../../mongo/app';
import { createDebugger } from '../../../../debug';

import { RequestWithApp } from './requireApp';

export interface RequestWithAppAndVersion extends RequestWithApp {
  vincentAppVersion: InstanceType<typeof AppVersion>;
}

// Create a debug instance for this middleware
const debug = createDebugger('requireAppVersion');

// Type guard function that expects vincentApp to already exist
export const requireAppVersion = (versionParam = 'version') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const reqWithApp = req as RequestWithApp;
    debug('Processing app version request');

    const version = req.params[versionParam];
    debug('Extracted version from params', {
      versionParam,
      version,
      appId: reqWithApp.vincentApp.appId,
    });

    const parseAppVersion = parseInt(version);

    if (isNaN(parseAppVersion)) {
      debug('Failed to parse app version as integer', { version });
      res.status(400).json({ message: `app version was not numeric: ${version}` });
      return;
    }

    // Ensure app middleware ran first
    if (!reqWithApp.vincentApp) {
      debug('App middleware did not run before AppVersion middleware');
      res.status(500).json({
        error: 'App middleware must run before AppVersion middleware',
      });
      return;
    }

    try {
      const appVersion = await AppVersion.findOne({
        appId: reqWithApp.vincentApp.appId,
        version,
      });

      if (!appVersion) {
        debug('App version not found', {
          appId: reqWithApp.vincentApp.appId,
          appVersion: version,
        });
        res.status(404).end();
        return;
      }

      debug('App version found, adding to request object', {
        appId: reqWithApp.vincentApp.appId,
        appVersion,
      });
      (req as RequestWithAppAndVersion).vincentAppVersion = appVersion;
      debug('Proceeding to next middleware');

      next();
    } catch (error) {
      res.status(500).json({
        message: `Error fetching version ${version} for app ${reqWithApp.vincentApp.appId}`,
        error,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type AppVersionHandler<T extends Request = RequestWithAppAndVersion> = (
  req: T & RequestWithAppAndVersion,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withAppVersion = <T extends Request = Request>(handler: AppVersionHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithAppAndVersion, res, next);
  };
};
