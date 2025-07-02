import type { NextFunction, Request, Response } from 'express';

import { jwt } from '..';
import { isDefinedObject } from '../jwt/core/utils';

import { AuthenticatedRequest, AuthenticatedRequestHandler } from './types';

const { verify } = jwt;

function assertAuthenticatedRequest(req: Request): asserts req is AuthenticatedRequest {
  if (!('user' in req) || typeof req.user !== 'object' || !req.user) {
    throw new Error('Request is not an AuthenticatedRequest: Missing or invalid "user" property');
  }

  // Cast with a type assertion
  const user = req.user as Partial<{
    decodedJWT: unknown;
    rawJWT: unknown;
  }>;

  const { decodedJWT, rawJWT } = user;

  if (typeof rawJWT !== 'string' || !isDefinedObject(decodedJWT)) {
    throw new Error('Request is not an AuthenticatedRequest: Invalid "user" properties');
  }
}

/**
 * Higher-order helper function to enforce authentication on a request handler and assert the type of `Request` that is
 * passed into your authenticated Express routes.
 *
 * This function takes an `AuthenticatedRequestHandler` and returns a new request handler
 * that verifies that the request has a 'user' property with the correct shape on it before calling the original handler.
 * If the `req.user` property isn't the correct shape, it sends a `401 Unauthorized` response to the client.
 *
 * NOTE: This does not verify signatures or any other content -- use `getAuthenticateUserExpressHandler` to create a
 * middleware that does those things and ensures that your routes use it.
 *
 * See [express.js documentation](https://expressjs.com/en/guide/writing-middleware.html) for details on writing your route handler
 * @example
 * ```typescript
 * import { expressAuthHelpers } from '@lit-protocol/vincent-app-sdk';
 * const { authenticatedRequestHandler, getAuthenticateUserExpressHandler } = expressAuthHelpers;
 *
 * import type { ExpressAuthHelpers } from '@lit-protocol/vincent-app-sdk';
 *
 * // Define an authenticated route handler
 * const getUserProfile = async (req: ExpressAuthHelpers['AuthenticatedRequest'], res: Response) => {
 *   // Access authenticated user information
 *   const { pkpAddress } = req.user;
 *
 *   // Fetch and return user data
 *   const userData = await userRepository.findByAddress(pkpAddress);
 *   res.json(userData);
 * };
 *
 * // Use in Express route with authentication
 * app.get('/profile', authenticateUser, authenticatedRequestHandler(getUserProfile));
 * ```
 */
export const authenticatedRequestHandler =
  (handler: AuthenticatedRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    try {
      assertAuthenticatedRequest(req);
      return handler(req, res, next);
    } catch {
      res.status(401).json({ error: 'Not authenticated' });
    }
  };

/**
 * Creates an Express middleware function to authenticate a user using a JWT token.
 *
 * This middleware checks the `Authorization` header for a Bearer token, verifies the token, and checks its audience.
 * If the token is valid, it attaches the user information (raw token and decoded JWT with PKP, app, and authentication info) to the request object as `req.user`.
 * If the token is missing or invalid, it returns a 401 Unauthorized response with an error message.
 *
 * NOTE: Wrap your route handler functions with `authenticatedRequestHandler()` to assert the type of `Request` and to
 * ensure that `req.user` was correctly set before your route handler is run.
 *
 * See [express.js documentation](https://expressjs.com/en/guide/writing-middleware.html) for details on writing your route handler
 *
 * @example
 * ```typescript
 * import { expressAuthHelpers } from '@lit-protocol/vincent-app-sdk';
 * const { authenticatedRequestHandler, getAuthenticateUserExpressHandler } = expressAuthHelpers;
 *
 * import type { ExpressAuthHelpers } from '@lit-protocol/vincent-app-sdk';
 *
 * // In your environment configuration
 * const ALLOWED_AUDIENCE = 'https://yourapp.example.com';
 *
 * // Create the authentication middleware
 * const authenticateUser = getAuthenticateUserExpressHandler(ALLOWED_AUDIENCE);
 *
 * // Define a handler that requires authentication
 * const getProtectedResource = (req: ExpressAuthHelpers['AuthenticatedRequest'], res: Response) => {
 *   // The request is now authenticated
 *   // No need for type casting as the handler is properly typed
 *   const { pkpAddress } = req.user;
 *   res.json({ message: `Hello, user with PKP address ${pkpAddress}` });
 * };
 *
 * // Apply to routes that require authentication by using authenticatedRequestHandler
 * app.get('/protected-resource', authenticateUser, authenticatedRequestHandler(getProtectedResource));
 * ```
 *
 * You can see the source for `getAuthenticateUserExpressHandler()` below; use this as a reference to implement
 * your own midddleware/authentication for other frameworks! Pull requests are welcome.
 * {@includeCode ./express.ts#expressHandlerTSDocExample}
 */
// #region expressHandlerTSDocExample
export const getAuthenticateUserExpressHandler =
  (allowedAudience: string) => async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      res.status(401).json({ error: `Invalid authorization header - expected "Bearer <token>"` });
      return;
    }

    const [scheme, rawJWT] = parts;
    if (!/^Bearer$/i.test(scheme)) {
      res.status(401).json({ error: `Expected "Bearer" scheme, got "${scheme}"` });
      return;
    }

    try {
      const decodedJWT = verify(rawJWT, allowedAudience);
      if (!decodedJWT) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      (req as AuthenticatedRequest).user = {
        decodedJWT,
        rawJWT,
      };

      next();
    } catch (e) {
      res.status(401).json({ error: `Invalid token: ${(e as Error).message}` });
    }
  };
// #endregion expressHandlerTSDocExample
