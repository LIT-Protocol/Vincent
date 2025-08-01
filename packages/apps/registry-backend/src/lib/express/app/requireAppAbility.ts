import type { Request, Response, NextFunction } from 'express';

import type { RequestWithAppAndVersion } from './requireAppVersion';

import { createDebugger } from '../../../../debug';
import { AppAbility } from '../../mongo/app';

export interface RequestWithAppVersionAndAbility extends RequestWithAppAndVersion {
  vincentAppAbility: InstanceType<typeof AppAbility>;
}

// Create a debug instance for this middleware
const debug = createDebugger('requireAppAbility');

// Type guard function that expects vincentApp and vincentAppVersion to already exist
export const requireAppAbility = (abilityPackageNameParam = 'abilityPackageName') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing app ability request');
    const reqWithAppVersion = req as RequestWithAppAndVersion;

    // Ensure app and appVersion middleware ran first

    if (!reqWithAppVersion.vincentApp) {
      debug('App middleware did not run before AppAbility middleware');
      res.status(500).json({
        error: 'App middleware must run before AppAbility middleware',
      });
      return;
    }

    if (!reqWithAppVersion.vincentAppVersion) {
      debug('AppVersion middleware did not run before AppAbility middleware');
      res.status(500).json({
        error: 'AppVersion middleware must run before AppAbility middleware',
      });
      return;
    }

    const abilityPackageName = req.params[abilityPackageNameParam];
    debug('Extracted ability package name from params', {
      abilityPackageNameParam,
      abilityPackageName,
      appId: reqWithAppVersion.vincentApp.appId,
      appVersion: reqWithAppVersion.vincentAppVersion.version,
    });

    try {
      const appAbility = await AppAbility.findOne({
        appId: reqWithAppVersion.vincentApp.appId,
        appVersion: reqWithAppVersion.vincentAppVersion.version,
        abilityPackageName,
      });

      if (!appAbility) {
        debug('App ability not found', {
          appId: reqWithAppVersion.vincentApp.appId,
          appVersion: reqWithAppVersion.vincentAppVersion.version,
          abilityPackageName,
        });
        res.status(404).end();
        return;
      }

      debug('App ability found, adding to request object', {
        appId: reqWithAppVersion.vincentApp.appId,
        appVersion: reqWithAppVersion.vincentAppVersion.version,
        abilityPackageName,
        abilityVersion: appAbility.abilityVersion,
      });
      (req as RequestWithAppVersionAndAbility).vincentAppAbility = appAbility;
      debug('Proceeding to next middleware');
      next();
    } catch (error) {
      debug('Error fetching app ability', {
        appId: reqWithAppVersion.vincentApp.appId,
        appVersion: reqWithAppVersion.vincentAppVersion.version,
        abilityPackageName,
        error: (error as Error).message,
      });
      res.status(500).json({
        message: `Error fetching ability ${abilityPackageName} for app ${reqWithAppVersion.vincentApp.appId} version ${reqWithAppVersion.vincentAppVersion.version}`,
        error,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type AppAbilityHandler<T extends Request = RequestWithAppVersionAndAbility> = (
  req: T & RequestWithAppVersionAndAbility,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withAppAbility = <T extends Request = Request>(handler: AppAbilityHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithAppVersionAndAbility, res, next);
  };
};
