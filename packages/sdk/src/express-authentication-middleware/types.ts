/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, RequestHandler, Response } from 'express';

import { VincentJWT } from '../jwt/types';

/** Extract the parameters type from the original RequestHandler */
type ExtractRequestHandlerParams<T> =
  T extends RequestHandler<infer P, infer ResBody, infer ReqBody, infer ReqQuery, infer Locals>
    ? [P, ResBody, ReqBody, ReqQuery, Locals]
    : never;

/** A RequestHandler that guarantees the request is authenticated with a PKP address */
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

/** Interface that extends Express Request to include authenticated user data */
export interface AuthenticatedRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any>
  extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: {
    decodedJWT: VincentJWT;
    pkpAddress: string;
    rawJWT: string;
  };
}

export interface ExpressAuthHelpers {
  AuthenticatedRequestHandler: AuthenticatedRequestHandler;
  AuthenticatedRequest: AuthenticatedRequest;
}
