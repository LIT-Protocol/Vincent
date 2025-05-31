import { Request, Response, NextFunction } from 'express';
import { App } from '../../mongo/app';

// Create a specific interface for requests with app
export interface RequestWithApp extends Request {
  vincentApp: InstanceType<typeof App>;
}

// Type guard function
export const requireApp = (paramName = 'appId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const appId = req.params[paramName];

    try {
      const app = await App.findOne({ appId: parseInt(appId) });

      if (!app) {
        res.status(404).end();
        return;
      }

      (req as RequestWithApp).vincentApp = app;
      next();
    } catch (error) {
      res.status(500).json({ message: `Error fetching app ${appId}`, error });
      return;
    }
  };
};

// Type-safe handler wrapper
export type AppHandler = (
  req: RequestWithApp,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withApp = (handler: AppHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // TypeScript knows req.app exists here because of the middleware chain
    return handler(req as RequestWithApp, res, next);
  };
};
