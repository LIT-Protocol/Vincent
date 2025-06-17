/** expressAuthHelpers are used to add a VincentJWT-specific authentication to your Express.js server routes
 *
 * - Create an express middleware using {@link getAuthenticateUserExpressHandler}
 * - Once you have added the middleware to your route, use {@link authenticatedRequestHandler} to provide
 * type-safe access to `req.user` in your downstream RequestHandler functions.
 * @example
 * ```typescript
 * import { expressAuthHelpers } from '@lit-protocol/vincent-app-sdk';
 * const { authenticatedRequestHandler, getAuthenticateUserExpressHandler } = expressAuthHelpers;
 *
 * import type { ExpressAuthHelpers } from '@lit-protocol/vincent-app-sdk';
 *
 * const { ALLOWED_AUDIENCE } = process.env;
 *
 *
 * const authenticateUserMiddleware = getAuthenticateUserExpressHandler(ALLOWED_AUDIENCE);
 *
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
 *
 * You can see the source for `getAuthenticateUserExpressHandler()` below; use this as a reference to implement
 * your own midddleware/authentication for other frameworks! Pull requests are welcome.
 *
 * {@includeCode ./express.ts#expressHandlerTSDocExample}
 *
 * @module expressAuthHelpers
 * @category Vincent SDK API
 * */

import { authenticatedRequestHandler, getAuthenticateUserExpressHandler } from './express';

export { authenticatedRequestHandler, getAuthenticateUserExpressHandler };
