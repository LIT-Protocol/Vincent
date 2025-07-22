import type { Request, Response, NextFunction } from 'express';

import { SiweMessage } from 'siwe';

import { createDebugger } from '../../../debug';
import { env } from '../../env';

// Create a specific interface for requests with authenticated user
export interface RequestWithVincentUser extends Request {
  vincentUser: {
    address: string;
  };
}

// Create a debug instance for this middleware
const debug = createDebugger('requireVincentAuth');

/**
 * Middleware to authenticate requests using SIWE (Sign In With Ethereum)
 * It verifies the Authorization header, which should contain a base64-encoded SIWE message and signature
 * If valid, it adds the wallet address to req.vincentUser
 */
export const requireVincentAuth = () => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    debug('Processing authentication request');
    try {
      const authHeader = req.headers.authorization;

      // If no Authorization header is present, return 401
      if (!authHeader) {
        debug('Authentication failed: No Authorization header provided');
        res.status(401).json({
          message: 'Authentication required',
          error: 'No Authorization header provided',
        });
        return;
      }

      // Check if the Authorization header starts with "SIWE "
      if (!authHeader.startsWith('SIWE ')) {
        debug('Authentication failed: Invalid authentication scheme', authHeader);
        res.status(401).json({
          message: 'Invalid authentication scheme',
          error: 'Authorization header must use the SIWE scheme',
        });
        return;
      }

      debug('Authorization header has correct SIWE scheme');

      // Extract the base64-encoded payload
      const base64Payload = authHeader.substring(5); // Remove "SIWE " prefix

      // Decode the base64 payload
      let payload: string;
      try {
        debug('Attempting to decode base64 payload');
        payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
      } catch (error) {
        debug('Authentication failed: Failed to decode base64 payload', {
          error: (error as Error).message,
        });
        res.status(401).json({
          message: 'Invalid authentication token',
          error: 'Failed to decode base64 payload',
        });
        return;
      }

      // Split the payload into message and signature
      debug('Parsing JSON payload');
      let message, signature;

      try {
        const parsed = JSON.parse(payload);
        message = parsed.message;
        signature = parsed.signature;
      } catch (error) {
        debug(
          'Authentication failed: Payload was not valid JSON.',
          { error: (error as Error).message },
          payload,
        );
        res.status(401).json({
          message: 'Invalid authentication token',
          error: 'Failed to parse JSON payload',
        });
        return;
      }
      if (!message || !signature) {
        debug('Authentication failed: Missing message or signature in payload');
        res.status(401).json({
          message: 'Invalid authentication token',
          error: 'Payload must contain both message and signature separated by a colon',
        });
        return;
      }

      // Parse and verify the SIWE message
      let siweMessage: SiweMessage;
      try {
        debug('Parsing SIWE message');
        siweMessage = new SiweMessage(message);
        debug('Successfully parsed SIWE message', { address: siweMessage.address });
      } catch (error) {
        debug('Authentication failed: Invalid SIWE message', { error: (error as Error).message });
        res.status(401).json({
          message: 'Invalid SIWE message',
          error: (error as Error).message,
        });
        return;
      }

      // Verify the signature
      debug('Verifying SIWE signature');
      const verificationResult = await siweMessage.verify({
        signature,
        domain: env.EXPECTED_AUDIENCE,
      });

      if (!verificationResult.success) {
        const expected = verificationResult.error?.expected || '';
        const received = verificationResult.error?.received || '';
        debug('Authentication failed: SIWE signature verification failed', {
          error: verificationResult.error?.type,
          expected,
          received,
        });
        res.status(401).json({
          message: `SIWE verification failed.${expected ? ' Expected: ' + expected : ''} ${received ? ', Received: ' + received : ''}`,
          error: verificationResult.error?.type || 'Signature verification failed',
        });
        return;
      }

      // Add the wallet address to the request object
      (req as RequestWithVincentUser).vincentUser = {
        address: siweMessage.address,
      };
      // Continue to the next middleware or route handler
      debug('Authentication successful, proceeding to next middleware');
      next();
    } catch (error) {
      debug('Unexpected error during authentication', { error: (error as Error).message });
      console.error('SIWE authentication error:', error);
      res.status(500).json({
        message: 'Authentication error',
        error: (error as Error).message,
      });
      return;
    }
  };
};

// Type-safe handler wrapper
export type VincentAuthHandler<T extends Request = RequestWithVincentUser> = (
  req: T & RequestWithVincentUser,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

export const withVincentAuth = <T extends Request = Request>(handler: VincentAuthHandler<T>) => {
  return (req: T, res: Response, next: NextFunction) => {
    return handler(req as T & RequestWithVincentUser, res, next);
  };
};
