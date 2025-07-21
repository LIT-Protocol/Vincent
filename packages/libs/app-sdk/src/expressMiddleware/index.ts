/** Express middleware is used to add a VincentJWT-specific authentication to your Express.js server routes
 *
 * - Create express middleware using {@link getAuthenticateUserExpressHandler}
 * - Once you have added the middleware to your route, use {@link authenticatedRequestHandler} to provide
 * type-safe access to `req.user` in your downstream RequestHandler functions.
 *
 * @example
 * ```typescript
 * import { authenticatedRequestHandler, getAuthenticateUserExpressHandler } from '@lit-protocol/vincent-app-sdk/expressMiddleware';
 * import type { AuthenticatedRequest } from '@lit-protocol/vincent-app-sdk/expressMiddleware';

 * const { ALLOWED_AUDIENCE } = process.env;
 *
 * const authenticateUserMiddleware = getAuthenticateUserExpressHandler(ALLOWED_AUDIENCE);
 *
 * // Define an authenticated route handler
 * const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
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
 *
 * You can see the source for `getAuthenticateUserExpressHandler()` below; use this as a reference to implement
 * your own midddleware/authentication for other frameworks! Pull requests are welcome.
 *
 * @packageDocumentation
 * @module expressMiddleware
 * {@includeCode ./express.ts#expressHandlerTSDocExample}
 * */

export { authenticatedRequestHandler, getAuthenticateUserExpressHandler } from './express';

export type {
  AuthenticatedRequest,
  AuthenticatedRequestHandler,
  ExtractRequestHandlerParams,
} from './types';
