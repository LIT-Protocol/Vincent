import type { Request, Response, NextFunction } from 'express';

import type { RequestWithAbility } from '../ability/requireAbility.js';
import type { RequestWithPolicy } from '../policy/requirePolicy';
import type { RequestWithVincentUser } from '../vincentAuth';

import { createDebugger } from '../../../../debug';
import { getPKPInfo } from '../vincentAuth';

// Create a debug instance for this middleware
const debug = createDebugger('requireUserIsAuthor');

// Combined interfaces for requests with both entity and vincent user
export interface RequestWithAbilityAndVincentUser
  extends RequestWithAbility,
    RequestWithVincentUser {}

export interface RequestWithPolicyAndVincentUser
  extends RequestWithPolicy,
    RequestWithVincentUser {}

type EntityType = 'ability' | 'policy';

/**
 * Middleware to check if the authenticated user is the author of the entity (ability or policy)
 * It verifies that req.vincentUser.address matches the authorWalletAddress on the entity
 * This middleware should be used after requireAbility/requirePolicy and requireVincentAuth
 *
 * @param entityType - The type of entity to check ('ability' or 'policy')
 */
export const requireUserIsAuthor = (entityType: EntityType) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing user is author request', { entityType });

    const reqWithAbilityAndUser = req as RequestWithAbilityAndVincentUser;

    try {
      if (!reqWithAbilityAndUser.vincentUser) {
        debug('Authentication middleware did not run before requireUserIsAuthor middleware');
        res.status(500).json({
          error: 'Authentication middleware must run before requireUserIsAuthor middleware',
        });
        return;
      }

      const userAddress = getPKPInfo(reqWithAbilityAndUser.vincentUser.decodedJWT).ethAddress;
      debug('Found authenticated user', { userAddress });

      if (entityType === 'ability') {
        debug('Checking ability authorship');
        const reqWithAbility = req as RequestWithAbilityAndVincentUser;

        // Ensure ability middleware ran first
        debug('Checking if ability middleware ran first');

        if (!reqWithAbility.vincentAbility) {
          debug('Ability middleware did not run before requireUserIsAuthor middleware');
          res.status(500).json({
            error: 'Ability middleware must run before requireUserIsAuthor middleware',
          });
          return;
        }

        debug('Comparing user address with ability author address', {
          userAddress,
          authorAddress: reqWithAbility.vincentAbility.authorWalletAddress,
          abilityPackageName: reqWithAbility.vincentAbility.packageName,
        });

        // Check if the authenticated user is the author of the ability
        if (userAddress !== reqWithAbility.vincentAbility.authorWalletAddress) {
          debug('User is not the author of the ability', {
            userAddress,
            authorAddress: reqWithAbility.vincentAbility.authorWalletAddress,
            abilityPackageName: reqWithAbility.vincentAbility.packageName,
          });
          res.status(403).json({
            message: 'Forbidden',
            error: 'You are not authorized to modify this ability',
          });
          return;
        }

        debug('User is confirmed as the author of the ability');
      } else if (entityType === 'policy') {
        debug('Checking policy authorship');
        const reqWithPolicy = req as RequestWithPolicyAndVincentUser;

        // Ensure policy middleware ran first
        debug('Checking if policy middleware ran first');

        if (!reqWithPolicy.vincentPolicy) {
          debug('Policy middleware did not run before requireUserIsAuthor middleware');
          res.status(500).json({
            error: 'Policy middleware must run before requireUserIsAuthor middleware',
          });
          return;
        }

        debug('Comparing user address with policy author address', {
          userAddress,
          authorAddress: reqWithPolicy.vincentPolicy.authorWalletAddress,
          policyPackageName: reqWithPolicy.vincentPolicy.packageName,
        });

        // Check if the authenticated user is the author of the policy
        if (userAddress !== reqWithPolicy.vincentPolicy.authorWalletAddress) {
          debug('User is not the author of the policy', {
            userAddress,
            authorAddress: reqWithPolicy.vincentPolicy.authorWalletAddress,
            policyPackageName: reqWithPolicy.vincentPolicy.packageName,
          });
          res.status(403).json({
            message: 'Forbidden',
            error: 'You are not authorized to modify this policy',
          });
          return;
        }

        debug('User is confirmed as the author of the policy');
      } else {
        debug('Invalid entity type provided', { entityType });
        res.status(500).json({
          error: `Invalid entity type: ${entityType}. Must be 'ability' or 'policy'`,
        });
        return;
      }

      // Continue to the next middleware or route handler
      debug('Authorization successful, proceeding to next middleware');
      next();
    } catch (error) {
      debug('Error in requireUserIsAuthor middleware', {
        entityType,
        error: (error as Error).message,
      });
      console.error(`Error in requireUserIsAuthor middleware for ${entityType}:`, error);
      res.status(500).json({
        message: 'Server error',
        error: (error as Error).message,
      });
      return;
    }
  };
};
