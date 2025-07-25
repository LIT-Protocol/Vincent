import type { Request, Response, NextFunction } from 'express';

import type { App } from '@lit-protocol/vincent-contracts-sdk';

import { createDebugger } from '../../../../debug';
import { getContractClient } from '../../contractClient';

// Create a specific interface for requests with on-chain app
export interface RequestWithAppOnChain extends Request {
  vincentAppOnChain: App;
}

// Create a debug instance for this middleware
const debug = createDebugger('requireAppOnChain');

// Type guard function
export const requireAppOnChain = (paramName = 'appId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing on-chain app request');
    const appId = req.params[paramName];
    debug('Extracted appId from params', { paramName, appId });

    try {
      debug('Attempting to parse appId and fetch app from blockchain');
      const parsedAppId = parseInt(appId);

      if (isNaN(parsedAppId)) {
        debug('Failed to parse appId as integer', { appId });
        res.status(400).json({ message: `appId was not numeric: ${appId}` });
        return;
      }

      const app = await getContractClient().getAppById({
        appId: parsedAppId,
      });

      if (!app) {
        debug('App not found on-chain', { appId: parsedAppId });
        res.status(404).json({ message: `App ${appId} not found on-chain` });
        return;
      }

      debug('App found on-chain, adding to request object', {
        appId: parsedAppId,
        appIdOnChain: app.id,
      });
      (req as RequestWithAppOnChain).vincentAppOnChain = app;
      next();
    } catch (error) {
      debug('Error fetching app from blockchain', { appId, error: (error as Error).message });
      res.status(500).json({ message: `Error fetching app ${appId} from blockchain`, error });
      return;
    }
  };
};

// Type-safe handler wrapper
export type AppOnChainHandler<T extends Request = RequestWithAppOnChain> = (
  req: T & RequestWithAppOnChain,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withAppOnChain = <T extends Request = Request>(handler: AppOnChainHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    // TypeScript knows req.vincentAppOnChain exists here because of the middleware chain
    return handler(req as T & RequestWithAppOnChain, res, next);
  };
};
