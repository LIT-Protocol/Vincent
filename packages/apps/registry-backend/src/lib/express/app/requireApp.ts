import type { Request, Response, NextFunction } from 'express';

import { createDebugger } from '../../../../debug';
import { App } from '../../mongo/app';

// Create a specific interface for requests with app
export interface RequestWithApp extends Request {
  vincentApp: InstanceType<typeof App>;
}

// Create a debug instance for this middleware
const debug = createDebugger('requireApp');

// Type guard function
export const requireApp = (paramName = 'appId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing app request');
    const appId = req.params[paramName];
    debug('Extracted appId from params', { paramName, appId });

    try {
      debug('Attempting to parse appId and fetch app from database');
      const parsedAppId = parseInt(appId);

      if (isNaN(parsedAppId)) {
        debug('Failed to parse appId as integer', { appId });
        res.status(400).json({ message: `appId was not numeric: ${appId}` });
        return;
      }

      const app = await App.findOne({ appId: parsedAppId });

      if (!app) {
        debug('App not found', { appId: parsedAppId });
        res.status(404).end();
        return;
      }

      debug('App found, adding to request object', { appId: parsedAppId, appName: app.name });
      (req as RequestWithApp).vincentApp = app;
      next();
    } catch (error) {
      debug('Error fetching app', { appId, error: (error as Error).message });
      res.status(500).json({ message: `Error fetching app ${appId}`, error });
      return;
    }
  };
};

// Type-safe handler wrapper
export type AppHandler<T extends Request = RequestWithApp> = (
  req: T & RequestWithApp,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withApp = <T extends Request = Request>(handler: AppHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    // TypeScript knows req.app exists here because of the middleware chain
    return handler(req as T & RequestWithApp, res, next);
  };
};
