import { Request, Response, NextFunction } from 'express';
import { AppVersion } from '../../mongo/app';

import { RequestWithApp } from './requireApp';

interface RequestWithAppAndVersion extends RequestWithApp {
  vincentAppVersion: InstanceType<typeof AppVersion>;
}

// Type guard function that expects vincentApp to already exist
export const requireAppVersion = (versionParam = 'version') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const reqWithApp = req as RequestWithApp;

    // Ensure app middleware ran first
    if (!reqWithApp.vincentApp) {
      res.status(500).json({
        error: 'App middleware must run before AppVersion middleware',
      });
      return;
    }

    const version = req.params[versionParam];

    try {
      const appVersion = await AppVersion.findOne({
        appId: reqWithApp.vincentApp.appId,
        version: parseInt(version),
      });

      if (!appVersion) {
        res.status(404).end();
        return;
      }

      (req as RequestWithAppAndVersion).vincentAppVersion = appVersion;
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
export type AppVersionHandler = (
  req: RequestWithAppAndVersion,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withAppVersion = (handler: AppVersionHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as RequestWithAppAndVersion, res, next);
  };
};
