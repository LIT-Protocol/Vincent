import type { Request, Response, NextFunction } from 'express';

import type { RequestWithPolicy } from './requirePolicy';

import { createDebugger } from '../../../../debug';
import { PolicyVersion } from '../../mongo/policy';

// Create a debug instance for this middleware
const debug = createDebugger('requirePolicyVersion');

export interface RequestWithPolicyAndVersion extends RequestWithPolicy {
  vincentPolicyVersion: InstanceType<typeof PolicyVersion>;
}

// Type guard function that expects vincentPolicy to already exist
export const requirePolicyVersion = (versionParam = 'version') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing policy version request');
    const reqWithPolicy = req as RequestWithPolicy;

    // Ensure policy middleware ran first
    if (!reqWithPolicy.vincentPolicy) {
      debug('Policy middleware did not run before PolicyVersion middleware');
      res.status(500).json({
        error: 'Policy middleware must run before PolicyVersion middleware',
      });
      return;
    }

    const version = req.params[versionParam];
    debug('Extracted version from params', {
      versionParam,
      version,
      packageName: reqWithPolicy.vincentPolicy.packageName,
    });

    try {
      const policyVersion = await PolicyVersion.findOne({
        packageName: reqWithPolicy.vincentPolicy.packageName,
        version: version,
      });

      if (!policyVersion) {
        debug('Policy version not found', {
          packageName: reqWithPolicy.vincentPolicy.packageName,
          version,
        });
        res.status(404).end();
        return;
      }

      debug('Policy version found, adding to request object', {
        packageName: reqWithPolicy.vincentPolicy.packageName,
        version,
        policyVersionId: policyVersion._id,
      });
      (req as RequestWithPolicyAndVersion).vincentPolicyVersion = policyVersion;
      debug('Proceeding to next middleware');
      next();
    } catch (error) {
      debug('Error fetching policy version', {
        packageName: reqWithPolicy.vincentPolicy.packageName,
        version,
        error: (error as Error).message,
      });
      res.status(500).json({
        message: `Error fetching version ${version} for policy ${reqWithPolicy.vincentPolicy.packageName}`,
        error,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type PolicyVersionHandler<T extends Request = RequestWithPolicyAndVersion> = (
  req: T & RequestWithPolicyAndVersion,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withPolicyVersion = <T extends Request = Request>(
  handler: PolicyVersionHandler<T>,
) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithPolicyAndVersion, res, next);
  };
};
