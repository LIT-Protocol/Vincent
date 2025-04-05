import * as jwt from './jwt';
export { jwt };
export type { JWTConfig, VincentJWT, VincentJWTPayload } from './jwt/types';

export { getVincentToolClient } from './tool';
export type { VincentToolParams, VincentToolClientConfig, VincentToolClient } from './tool/types';

export { getVincentWebAppClient } from './app';
export type {
  VincentWebAppClient,
  VincentAppClientConfig,
  RedirectToVincentConsentPageParams,
} from './types';

import * as expressAuthHelpers from './express-authentication-middleware';
export { expressAuthHelpers };
export type { ExpressAuthHelpers } from './express-authentication-middleware/types';
