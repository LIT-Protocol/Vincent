/** Express middleware is used to add a VincentJWT-specific authentication to your Express.js server routes
 *
 * All functionality is encapsulated into a single factory function -- see {@link createVincentUserMiddleware} for details
 *
 * You can see the source for the Express authentication handler below; use this as a reference to implement
 * your own midddleware/authentication for other frameworks! Pull requests are welcome.
 * {@includeCode ./express.ts#expressHandlerTSDocExample}
 *
 * @packageDocumentation
 * @module expressMiddleware
 * */

export { createVincentUserMiddleware } from './express';

export type {
  AuthenticatedRequest,
  AuthenticatedRequestHandler,
  ExtractRequestHandlerParams,
  VincentJWTData,
} from './types';
