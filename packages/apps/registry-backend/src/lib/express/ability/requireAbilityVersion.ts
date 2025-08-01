import type { Request, Response, NextFunction } from 'express';

import type { RequestWithAbility } from './requireAbility.js';

import { createDebugger } from '../../../../debug';
import { AbilityVersion } from '../../mongo/ability.js';

// Create a debug instance for this middleware
const debug = createDebugger('requireAbilityVersion');

export interface RequestWithAbilityAndVersion extends RequestWithAbility {
  vincentAbilityVersion: InstanceType<typeof AbilityVersion>;
}

// Type guard function that expects vincentAbility to already exist
export const requireAbilityVersion = (versionParam = 'version') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing ability version request');
    const reqWithAbility = req as RequestWithAbility;

    // Ensure ability middleware ran first

    if (!reqWithAbility.vincentAbility) {
      debug('Ability middleware did not run before AbilityVersion middleware');
      res.status(500).json({
        error: 'Ability middleware must run before AbilityVersion middleware',
      });
      return;
    }

    const version = req.params[versionParam];
    debug('Extracted version from params', {
      versionParam,
      version,
      packageName: reqWithAbility.vincentAbility.packageName,
    });

    const parseAbilityVersion = parseInt(version);

    if (isNaN(parseAbilityVersion)) {
      debug('Failed to parse ability version as integer', { version });
      res.status(400).json({ message: `ability version was not numeric: ${version}` });
      return;
    }

    try {
      const abilityVersion = await AbilityVersion.findOne({
        packageName: reqWithAbility.vincentAbility.packageName,
        version: version,
      });

      if (!abilityVersion) {
        debug('Ability version not found', {
          packageName: reqWithAbility.vincentAbility.packageName,
          version,
        });
        res.status(404).end();
        return;
      }

      debug('Ability version found, adding to request object', {
        packageName: reqWithAbility.vincentAbility.packageName,
        version,
        abilityVersionId: abilityVersion._id,
      });
      (req as RequestWithAbilityAndVersion).vincentAbilityVersion = abilityVersion;
      debug('Proceeding to next middleware');
      next();
    } catch (error) {
      debug('Error fetching ability version', {
        packageName: reqWithAbility.vincentAbility.packageName,
        version,
        error: (error as Error).message,
      });
      res.status(500).json({
        message: `Error fetching version ${version} for ability ${reqWithAbility.vincentAbility.packageName}`,
        error,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type AbilityVersionHandler<T extends Request = RequestWithAbilityAndVersion> = (
  req: T & RequestWithAbilityAndVersion,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withAbilityVersion = <T extends Request = Request>(
  handler: AbilityVersionHandler<T>,
) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithAbilityAndVersion, res, next);
  };
};
