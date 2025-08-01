import type { NextFunction, Request, Response } from 'express';

import type { AuthenticatedRequest, AuthenticatedRequestHandler, VincentJWTData } from './types';

import { verify } from '../jwt';
import { isDefinedObject } from '../jwt/core/utils';

function assertAuthenticatedRequest<const UserKey extends string>(
  req: Request,
  userKey: UserKey
): asserts req is AuthenticatedRequest<UserKey> {
  // @ts-expect-error It's an assertion
  if (!(userKey in req) || typeof req[userKey] !== 'object' || !req[userKey]) {
    throw new Error('Request is not an AuthenticatedRequest: Missing or invalid "user" property');
  }

  // Cast with a type assertion
  const user = req[userKey] as Partial<VincentJWTData>;

  const { decodedJWT, rawJWT } = user;

  if (typeof rawJWT !== 'string' || !isDefinedObject(decodedJWT)) {
    throw new Error('Request is not an AuthenticatedRequest: Invalid "user" properties');
  }
}

/** Returns an Express middleware function to authenticate a user using a JWT token, and a type-guard wrapper function
 * for type-safe usage of route handlers guarded by the middleware.
 *
 * The `middleware()` function:
 * - Checks the `Authorization` header for a Bearer token, verifies the token, and checks its audience.
 * - If the token is valid, it attaches the user information (decoded JWT, and raw JWT string) to the request object
 * - If the token is missing or invalid, it returns a 401 Unauthorized response with an error message.
 *
 * Designate what field on `req` should be set with the JWT with the `userKey` configuration option.
 *
 * The `handler()` function:
 * - Provides a type-safe reference to `req` where the `userKey` you have provided is correctly inferred to the appropriate type
 * - Note that it is still your responsibility to ensure you have attached the `middleware` somewhere in the chain before you use the `handler()`
 *   - If you forget, the `handler()` function will throw an error if the expected `req[userKey]` does not exist.
 *
 * See [express.js documentation](https://expressjs.com/en/guide/writing-middleware.html) for details on writing your route handler
 * @category API
 *
 * @example
 * ```typescript
 * import { createVincentUserMiddleware } from '@lit-protocol/vincent-app-sdk/expressMiddleware';
 *
 * // In your environment configuration
 * const ALLOWED_AUDIENCE = 'https://yourapp.example.com';
 * const VINCENT_APP_ID = 555; // Provided by the vincent app registry
 *
 * const { middleware, handler } = createVincentUserMiddleware({
 *  allowedAudience: ALLOWED_AUDIENCE,
 *  requiredAppId: VINCENT_APP_ID,
 *  userKey: 'vincentUser',
 * });
 *
 * // Apply to routes that require authentication; req is guaranteed authenticated because it is wrapped in `handler()`
 * app.get('/protected-resource', middleware, handler((req, res) => {
 *     // handler() gives you the correct inferred type of `req[userKey]`
 *     const pkpAddress = req.vincentUser.decodedJWT.payload.pkp.ethAddress;
 *     const appInfo = req.vincentUser.decodedJWT.payload.app;
 *
 *     if(appInfo) {
 *       res.json({ message: `Hello, user with PKP address ${pkpAddress}. You are authenticated for app ${appInfo.id} @ v${appInfo.version}` });
 *       return;
 *     }
 *
 *     res.json({ message: `Hello, user with PKP address ${pkpAddress}.` });
 *   })
 * );
 * ```
 *
 * See the code below for the implementation used by the `middleware` returned by this function. You can adapt this logic
 * to the HTTP framework of your choice.
 *
 */
export function createVincentUserMiddleware<const UserKey extends string>(config: {
  allowedAudience: string;
  userKey: UserKey;
  requiredAppId: number | undefined;
}) {
  return {
    middleware: getAuthenticateUserExpressHandler(config),
    handler: authenticatedRequestHandler(config.userKey),
  };
}

function authenticatedRequestHandler<const UserKey extends string>(userKey: UserKey) {
  return function (handler: AuthenticatedRequestHandler<UserKey>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        assertAuthenticatedRequest(req, userKey);
        return handler(req, res, next);
      } catch {
        res.status(401).json({ error: 'Not authenticated' });
      }
    };
  };
}

// #region expressHandlerTSDocExample
function getAuthenticateUserExpressHandler<const UserKey extends string>({
  allowedAudience,
  requiredAppId,
  userKey,
}: {
  allowedAudience: string;
  requiredAppId: number | undefined;
  userKey: UserKey;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
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
      const decodedJWT = verify({ jwt: rawJWT, expectedAudience: allowedAudience, requiredAppId });
      if (!decodedJWT) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      (req as unknown as Record<string, VincentJWTData>)[userKey] = {
        decodedJWT,
        rawJWT,
      } as VincentJWTData;

      next();
    } catch (e) {
      res.status(401).json({ error: `Invalid token: ${(e as Error).message}` });
    }
  };
}
// #endregion expressHandlerTSDocExample
