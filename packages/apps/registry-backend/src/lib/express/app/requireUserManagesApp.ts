import type { Request, Response, NextFunction } from 'express';

import type { RequestWithVincentUser } from '../requireVincentAuth';
import type { RequestWithApp } from './requireApp';

import { createDebugger } from '../../../../debug';

// Combined interface for requests with both app and vincent user
export interface RequestWithAppAndVincentUser extends RequestWithApp, RequestWithVincentUser {}

// Create a debug instance for this middleware
const debug = createDebugger('requireUserManagesApp');

/**
 * Middleware to check if the authenticated user is the manager of the app
 * It verifies that req.vincentUser.address matches req.vincentApp.managerAddress
 * This middleware should be used after requireApp and requireVincentAuth
 */
export const requireUserManagesApp = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reqWithAppAndUser = req as RequestWithAppAndVincentUser;

      // Ensure app and authentication middleware ran first
      if (!reqWithAppAndUser.vincentApp) {
        debug('App middleware did not run before requireUserManagesApp middleware');
        res.status(500).json({
          error: 'App middleware must run before requireUserManagesApp middleware',
        });
        return;
      }

      if (!reqWithAppAndUser.vincentUser) {
        debug('Authentication middleware did not run before requireUserManagesApp middleware');
        res.status(500).json({
          error: 'Authentication middleware must run before requireUserManagesApp middleware',
        });
        return;
      }

      debug('Checking authorization', {
        userAddress: reqWithAppAndUser.vincentUser.address,
        appManagerAddress: reqWithAppAndUser.vincentApp.managerAddress,
        appId: reqWithAppAndUser.vincentApp.appId,
      });

      // Check if the authenticated user is the manager of the app
      if (reqWithAppAndUser.vincentUser.address !== reqWithAppAndUser.vincentApp.managerAddress) {
        debug('Authorization failed: User is not the app manager', {
          userAddress: reqWithAppAndUser.vincentUser.address,
          appManagerAddress: reqWithAppAndUser.vincentApp.managerAddress,
          appId: reqWithAppAndUser.vincentApp.appId,
        });
        res.status(403).json({
          message: 'Forbidden',
          error: 'You are not authorized to manage this app',
        });
        return;
      }

      debug('Authorization successful: User is the app manager', {
        appId: reqWithAppAndUser.vincentApp.appId,
      });

      // Continue to the next middleware or route handler
      next();
    } catch (error) {
      debug('Error in middleware', { error: (error as Error).message });
      console.error('Error in requireUserManagesApp middleware:', error);
      res.status(500).json({
        message: 'Server error',
        error: (error as Error).message,
      });
      return;
    }
  };
};
