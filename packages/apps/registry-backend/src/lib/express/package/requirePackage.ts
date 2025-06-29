import { Request, Response, NextFunction } from 'express';
import { getPackageInfo } from '../../npm';
import { createDebugger } from '../../../../debug';

// Create a debug instance for this middleware
const debug = createDebugger('requirePackage');

// Create a specific interface for requests with validated package
export interface RequestWithPackage extends Request {
  vincentPackage: Awaited<ReturnType<typeof getPackageInfo>>;
}

// Middleware to validate and fetch package info
export const requirePackage = (packageNameParam = 'packageName', versionParam = 'version') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing package request');
    const packageName = req.params[packageNameParam] || req.body.packageName;
    const version = req.params[versionParam] || req.body.version || req.body.activeVersion;
    debug('Extracted package info from params/body', {
      packageNameParam,
      packageName,
      versionParam,
      version,
    });

    if (!packageName || !version) {
      debug('Missing required parameters', { packageName: !!packageName, version: !!version });
      res.status(400).json({
        error: `Missing required parameters: ${!packageName ? 'packageName' : 'version'}`,
      });
      return;
    }

    try {
      debug('Fetching package info from npm registry', { packageName, version });
      const packageInfo = await getPackageInfo({ packageName, version });
      debug('Successfully fetched package info', {
        packageName,
        version,
        hasPackageJson: !!packageInfo.packageJson,
      });

      // Add the package info to the request object
      debug('Adding package info to request object');
      (req as RequestWithPackage).vincentPackage = packageInfo;
      debug('Proceeding to next middleware');
      next();
    } catch (error) {
      debug('Error fetching package info', {
        packageName,
        version,
        error: (error as Error).message,
      });
      // Return 400 for validation errors
      res.status(400).json({ error: (error as Error).message });
      return;
    }
  };
};

// Type-safe handler wrapper
export type PackageHandler<T extends Request = RequestWithPackage> = (
  req: T & RequestWithPackage,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withValidPackage = <T extends Request = Request>(handler: PackageHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithPackage, res, next);
  };
};
