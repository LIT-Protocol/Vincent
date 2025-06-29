import { Request, Response, NextFunction } from 'express';
import { RequestWithTool } from '../tool/requireTool';
import { RequestWithPolicy } from '../policy/requirePolicy';
import { RequestWithVincentUser } from '../requireVincentAuth';
import { createDebugger } from '../../../../debug';

// Create a debug instance for this middleware
const debug = createDebugger('requireUserIsAuthor');

// Combined interfaces for requests with both entity and vincent user
export interface RequestWithToolAndVincentUser extends RequestWithTool, RequestWithVincentUser {}
export interface RequestWithPolicyAndVincentUser
  extends RequestWithPolicy,
    RequestWithVincentUser {}

type EntityType = 'tool' | 'policy';

/**
 * Middleware to check if the authenticated user is the author of the entity (tool or policy)
 * It verifies that req.vincentUser.address matches the authorWalletAddress on the entity
 * This middleware should be used after requireTool/requirePolicy and requireVincentAuth
 *
 * @param entityType - The type of entity to check ('tool' or 'policy')
 */
export const requireUserIsAuthor = (entityType: EntityType) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing user is author request', { entityType });
    try {
      // Ensure authentication middleware ran first
      debug('Checking if authentication middleware ran first');
      if (!(req as RequestWithVincentUser).vincentUser) {
        debug('Authentication middleware did not run before requireUserIsAuthor middleware');
        res.status(500).json({
          error: 'Authentication middleware must run before requireUserIsAuthor middleware',
        });
        return;
      }

      const userAddress = (req as RequestWithVincentUser).vincentUser.address;
      debug('Found authenticated user', { userAddress });

      if (entityType === 'tool') {
        debug('Checking tool authorship');
        const reqWithTool = req as RequestWithToolAndVincentUser;

        // Ensure tool middleware ran first
        debug('Checking if tool middleware ran first');
        if (!reqWithTool.vincentTool) {
          debug('Tool middleware did not run before requireUserIsAuthor middleware');
          res.status(500).json({
            error: 'Tool middleware must run before requireUserIsAuthor middleware',
          });
          return;
        }

        debug('Comparing user address with tool author address', {
          userAddress,
          authorAddress: reqWithTool.vincentTool.authorWalletAddress,
          toolPackageName: reqWithTool.vincentTool.packageName,
        });

        // Check if the authenticated user is the author of the tool
        if (userAddress !== reqWithTool.vincentTool.authorWalletAddress) {
          debug('User is not the author of the tool', {
            userAddress,
            authorAddress: reqWithTool.vincentTool.authorWalletAddress,
            toolPackageName: reqWithTool.vincentTool.packageName,
          });
          res.status(403).json({
            message: 'Forbidden',
            error: 'You are not authorized to modify this tool',
          });
          return;
        }

        debug('User is confirmed as the author of the tool');
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
          error: `Invalid entity type: ${entityType}. Must be 'tool' or 'policy'`,
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
