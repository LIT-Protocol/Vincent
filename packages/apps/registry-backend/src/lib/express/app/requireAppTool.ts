import type { Request, Response, NextFunction } from 'express';

import type { RequestWithAppAndVersion } from './requireAppVersion';

import { createDebugger } from '../../../../debug';
import { AppTool } from '../../mongo/app';

export interface RequestWithAppVersionAndTool extends RequestWithAppAndVersion {
  vincentAppTool: InstanceType<typeof AppTool>;
}

// Create a debug instance for this middleware
const debug = createDebugger('requireAppTool');

// Type guard function that expects vincentApp and vincentAppVersion to already exist
export const requireAppTool = (toolPackageNameParam = 'toolPackageName') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing app tool request');
    const reqWithAppVersion = req as RequestWithAppAndVersion;

    // Ensure app and appVersion middleware ran first
    if (!reqWithAppVersion.vincentApp) {
      debug('App middleware did not run before AppTool middleware');
      res.status(500).json({
        error: 'App middleware must run before AppTool middleware',
      });
      return;
    }

    if (!reqWithAppVersion.vincentAppVersion) {
      debug('AppVersion middleware did not run before AppTool middleware');
      res.status(500).json({
        error: 'AppVersion middleware must run before AppTool middleware',
      });
      return;
    }

    const toolPackageName = req.params[toolPackageNameParam];
    debug('Extracted tool package name from params', {
      toolPackageNameParam,
      toolPackageName,
      appId: reqWithAppVersion.vincentApp.appId,
      appVersion: reqWithAppVersion.vincentAppVersion.version,
    });

    try {
      const appTool = await AppTool.findOne({
        appId: reqWithAppVersion.vincentApp.appId,
        appVersion: reqWithAppVersion.vincentAppVersion.version,
        toolPackageName,
      });

      if (!appTool) {
        debug('App tool not found', {
          appId: reqWithAppVersion.vincentApp.appId,
          appVersion: reqWithAppVersion.vincentAppVersion.version,
          toolPackageName,
        });
        res.status(404).end();
        return;
      }

      debug('App tool found, adding to request object', {
        appId: reqWithAppVersion.vincentApp.appId,
        appVersion: reqWithAppVersion.vincentAppVersion.version,
        toolPackageName,
        toolVersion: appTool.toolVersion,
      });
      (req as RequestWithAppVersionAndTool).vincentAppTool = appTool;
      debug('Proceeding to next middleware');
      next();
    } catch (error) {
      debug('Error fetching app tool', {
        appId: reqWithAppVersion.vincentApp.appId,
        appVersion: reqWithAppVersion.vincentAppVersion.version,
        toolPackageName,
        error: (error as Error).message,
      });
      res.status(500).json({
        message: `Error fetching tool ${toolPackageName} for app ${reqWithAppVersion.vincentApp.appId} version ${reqWithAppVersion.vincentAppVersion.version}`,
        error,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type AppToolHandler<T extends Request = RequestWithAppVersionAndTool> = (
  req: T & RequestWithAppVersionAndTool,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withAppTool = <T extends Request = Request>(handler: AppToolHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithAppVersionAndTool, res, next);
  };
};
