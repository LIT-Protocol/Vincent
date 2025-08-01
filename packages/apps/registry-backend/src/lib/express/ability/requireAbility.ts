import type { Request, Response, NextFunction } from 'express';

import type { RequestWithVincentUser } from '../vincentAuth';

import { createDebugger } from '../../../../debug';
import { Ability } from '../../mongo/ability.js';

// Create a debug instance for this middleware
const debug = createDebugger('requireAbility');

// Create a specific interface for requests with ability
export interface RequestWithAbility extends Request {
  vincentAbility: InstanceType<typeof Ability>;
}

// Combined interface for requests with both ability and vincent user
export interface RequestWithAbilityAndVincentUser
  extends RequestWithAbility,
    RequestWithVincentUser {}

// Type guard function
export const requireAbility = (paramName = 'packageName') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing ability request');
    const packageName = req.params[paramName];
    debug('Extracted package name from params', { paramName, packageName });

    try {
      const ability = await Ability.findOne({ packageName });

      if (!ability) {
        debug('Ability not found', { packageName });
        res.status(404).end();
        return;
      }

      debug('Ability found, adding to request object', { packageName, abilityId: ability._id });
      (req as RequestWithAbility).vincentAbility = ability;
      debug('Proceeding to next middleware');
      next();
    } catch (error) {
      debug('Error fetching ability', { packageName, error: (error as Error).message });
      res.status(500).json({
        message: `Error fetching ability ${packageName}`,
        error: (error as Error).message,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type AbilityHandler<T extends Request = RequestWithAbility> = (
  req: T & RequestWithAbility,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withAbility = <T extends Request = Request>(handler: AbilityHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithAbility, res, next);
  };
};
