/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import type { VincentJWT } from '../jwt/types';

/** Extract the parameters type from the original Express.js RequestHandler
 *
 * You probably don't need this type; see { @link authenticatedRequestHandler } for details
 *
 * @category Interfaces
 * */
export type ExtractRequestHandlerParams<T> =
  T extends RequestHandler<infer P, infer ResBody, infer ReqBody, infer ReqQuery, infer Locals>
    ? [P, ResBody, ReqBody, ReqQuery, Locals]
    : never;

/**
 * An Express.js RequestHandler that guarantees the request is authenticated with a PKP address
 *
 * You probably don't need this type; see { @link authenticatedRequestHandler } for details
 *
 * @category Interfaces
 * */
export type AuthenticatedRequestHandler<
  P = ExtractRequestHandlerParams<RequestHandler>[0],
  ResBody = ExtractRequestHandlerParams<RequestHandler>[1],
  ReqBody = ExtractRequestHandlerParams<RequestHandler>[2],
  ReqQuery = ExtractRequestHandlerParams<RequestHandler>[3],
  Locals extends Record<string, any> = ExtractRequestHandlerParams<RequestHandler>[4],
> = (
  req: AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>,
  res: Response<ResBody, Locals>,
  next: NextFunction
) => void | Promise<void>;

/** An interface that extends the Express.js Request interface to include authenticated user data
 *
 * @category Interfaces
 * */
export interface AuthenticatedRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any>
  extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: {
    decodedJWT: VincentJWT;
    rawJWT: string;
  };
}
