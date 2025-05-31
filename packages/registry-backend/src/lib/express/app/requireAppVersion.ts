import { Request, Response, NextFunction } from 'express';
import { AppVersion } from '../../mongo/app';

import { RequestWithApp } from './requireApp';

interface RequestWithAppAndVersion extends RequestWithApp {
  vincentAppVersion: InstanceType<typeof AppVersion>;
}

// Type guard function that expects vincentApp to already exist
export const requireAppVersion = (versionParam = 'versionNumber') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const reqWithApp = req as RequestWithApp;

    // Ensure app middleware ran first
    if (!reqWithApp.vincentApp) {
      res.status(500).json({
        error: 'App middleware must run before AppVersion middleware',
      });
      return;
    }

    const versionNumber = req.params[versionParam];

    try {
      const appVersion = await AppVersion.findOne({
        appId: reqWithApp.vincentApp.appId,
        versionNumber: parseInt(versionNumber),
      });

      if (!appVersion) {
        res.status(404).json({
          error: `Version ${versionNumber} not found for app ${reqWithApp.vincentApp.appId}`,
        });
        return;
      }

      (req as RequestWithAppAndVersion).vincentAppVersion = appVersion;
      next();
    } catch (error) {
      res.status(500).json({
        message: `Error fetching version ${versionNumber} for app ${reqWithApp.vincentApp.appId}`,
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
