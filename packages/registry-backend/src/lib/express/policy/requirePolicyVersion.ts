import { Request, Response, NextFunction } from 'express';
import { PolicyVersion } from '../../mongo/policy';

import { RequestWithPolicy } from './requirePolicy';

interface RequestWithPolicyAndVersion extends RequestWithPolicy {
  vincentPolicyVersion: InstanceType<typeof PolicyVersion>;
}

// Type guard function that expects vincentPolicy to already exist
export const requirePolicyVersion = (versionParam = 'version') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const reqWithPolicy = req as RequestWithPolicy;

    // Ensure policy middleware ran first
    if (!reqWithPolicy.vincentPolicy) {
      res.status(500).json({
        error: 'Policy middleware must run before PolicyVersion middleware',
      });
      return;
    }

    const version = req.params[versionParam];

    try {
      const policyVersion = await PolicyVersion.findOne({
        packageName: reqWithPolicy.vincentPolicy.packageName,
        version: version,
      });

      if (!policyVersion) {
        res.status(404).end();
        return;
      }

      (req as RequestWithPolicyAndVersion).vincentPolicyVersion = policyVersion;
      next();
    } catch (error) {
      res.status(500).json({
        message: `Error fetching version ${version} for policy ${reqWithPolicy.vincentPolicy.packageName}`,
        error,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type PolicyVersionHandler = (
  req: RequestWithPolicyAndVersion,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withPolicyVersion = (handler: PolicyVersionHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as RequestWithPolicyAndVersion, res, next);
  };
};
