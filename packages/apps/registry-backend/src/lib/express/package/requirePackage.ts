import { Request, Response, NextFunction } from 'express';
import { getPackageInfo } from '../../npm';

// Create a specific interface for requests with validated package
export interface RequestWithPackage extends Request {
  vincentPackage: Awaited<ReturnType<typeof getPackageInfo>>;
}

// Middleware to validate and fetch package info
export const requirePackage = (packageNameParam = 'packageName', versionParam = 'version') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const packageName = req.params[packageNameParam] || req.body.packageName;
    const version = req.params[versionParam] || req.body.version || req.body.activeVersion;

    if (!packageName || !version) {
      res.status(400).json({
        error: `Missing required parameters: ${!packageName ? 'packageName' : 'version'}`,
      });
      return;
    }

    try {
      const packageInfo = await getPackageInfo({ packageName, version });

      // Add the package info to the request object
      (req as RequestWithPackage).vincentPackage = packageInfo;
      next();
    } catch (error) {
      // Return 400 for validation errors
      res.status(400).json({ error: (error as Error).message });
      return;
    }
  };
};

// Type-safe handler wrapper
export type PackageHandler = (
  req: RequestWithPackage,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withValidPackage = (handler: PackageHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as RequestWithPackage, res, next);
  };
};
