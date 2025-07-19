import type { Request, Response, NextFunction } from 'express';

import type { RequestWithVincentUser } from '../requireVincentAuth';

import { createDebugger } from '../../../../debug';
import { Policy } from '../../mongo/policy';

// Create a debug instance for this middleware
const debug = createDebugger('requirePolicy');

// Create a specific interface for requests with policy
export interface RequestWithPolicy extends Request {
  vincentPolicy: InstanceType<typeof Policy>;
}

// Combined interface for requests with both policy and vincent user
export interface RequestWithPolicyAndVincentUser
  extends RequestWithPolicy,
    RequestWithVincentUser {}

// Type guard function
export const requirePolicy = (paramName = 'packageName') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing policy request');
    const packageName = req.params[paramName];
    debug('Extracted package name from params', { paramName, packageName });

    try {
      const policy = await Policy.findOne({ packageName });

      if (!policy) {
        debug('Policy not found', { packageName });
        res.status(404).end();
        return;
      }

      debug('Policy found, adding to request object', { packageName, policyId: policy._id });
      (req as RequestWithPolicy).vincentPolicy = policy;
      debug('Proceeding to next middleware');
      next();
    } catch (error) {
      debug('Error fetching policy', { packageName, error: (error as Error).message });
      res.status(500).json({ message: `Error fetching policy ${packageName}`, error });
      return;
    }
  };
};

// Type-safe handler wrapper
export type PolicyHandler<T extends Request = RequestWithPolicy> = (
  req: T & RequestWithPolicy,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withPolicy = <T extends Request = Request>(handler: PolicyHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithPolicy, res, next);
  };
};
