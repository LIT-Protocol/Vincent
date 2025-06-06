import { Request, Response, NextFunction } from 'express';
import { Policy } from '../../mongo/policy';

// Create a specific interface for requests with policy
export interface RequestWithPolicy extends Request {
  vincentPolicy: InstanceType<typeof Policy>;
}

// Type guard function
export const requirePolicy = (paramName = 'packageName') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const packageName = req.params[paramName];

    try {
      const policy = await Policy.findOne({ packageName });

      if (!policy) {
        res.status(404).end();
        return;
      }

      (req as RequestWithPolicy).vincentPolicy = policy;
      next();
    } catch (error) {
      res.status(500).json({ message: `Error fetching policy ${packageName}`, error });
      return;
    }
  };
};

// Type-safe handler wrapper
export type PolicyHandler = (
  req: RequestWithPolicy,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withPolicy = (handler: PolicyHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return handler(req as RequestWithPolicy, res, next);
  };
};
