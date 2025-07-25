import type { VincentJWTData } from '@lit-protocol/vincent-app-sdk/expressMiddleware';

import { createVincentUserMiddleware } from '@lit-protocol/vincent-app-sdk/expressMiddleware';
import { getPKPInfo } from '@lit-protocol/vincent-app-sdk/jwt';

import { env } from '../../env';

export const VINCENT_USER_KEY = 'vincentUser' as const;
export type VincentUserKey = typeof VINCENT_USER_KEY;

export const { middleware: requireVincentAuth, handler: withVincentAuth } =
  createVincentUserMiddleware({
    allowedAudience: env.EXPECTED_AUDIENCE,
    userKey: VINCENT_USER_KEY,
    requiredAppId: undefined,
  });

export { getPKPInfo };

type ReqWithVincentUser<UserKey extends string> = {
  [K in UserKey]: VincentJWTData;
};

export type RequestWithVincentUser = ReqWithVincentUser<VincentUserKey>;
