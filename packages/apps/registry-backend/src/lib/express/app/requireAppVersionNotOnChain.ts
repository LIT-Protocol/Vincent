import { Request, Response, NextFunction } from 'express';
import { createDebugger } from '../../../../debug';
import { getAppVersion } from '@lit-protocol/vincent-contracts-sdk';
import { ethersSigner } from '../../ethersSigner';

import { RequestWithAppAndVersion } from './requireAppVersion';

// Create a debug instance for this middleware
const debug = createDebugger('requireAppVersionNotOnChain');

// Middleware to check if an app version is on-chain and prevent operations if it is
export const requireAppVersionNotOnChain = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Checking if app version is on-chain');
    const reqWithAppVersion = req as RequestWithAppAndVersion;

    // Ensure app and appVersion middleware ran first
    if (!reqWithAppVersion.vincentApp) {
      debug('App middleware did not run before requireAppVersionNotOnChain middleware');
      res.status(500).json({
        error: 'App middleware must run before requireAppVersionNotOnChain middleware',
      });
      return;
    }

    if (!reqWithAppVersion.vincentAppVersion) {
      debug('AppVersion middleware did not run before requireAppVersionNotOnChain middleware');
      res.status(500).json({
        error: 'AppVersion middleware must run before requireAppVersionNotOnChain middleware',
      });
      return;
    }

    const appId = reqWithAppVersion.vincentApp.appId;
    const version = reqWithAppVersion.vincentAppVersion.version;

    debug('Checking if app version exists on-chain', { appId, version });

    // Try to get the app version from the blockchain
    const result = await getAppVersion({
      signer: ethersSigner,
      args: {
        appId: appId.toString(),
        version: version.toString(),
      },
    });

    if (result) {
      // If we get here, the app version exists on-chain
      debug('App version exists on-chain, operation not allowed', { appId, version });
      res.status(403).json({
        message: `Operation not allowed: App version ${version} for app ${appId} is already on-chain`,
      });
      return;
    }

    debug('App version not found on-chain, proceeding', { appId, version });
    next();
  };
};
