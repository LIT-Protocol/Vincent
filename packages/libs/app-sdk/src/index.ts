import * as jwt from './jwt';
export { jwt };
export type { JWTConfig, VincentJWT, VincentJWTPayload } from './jwt/types';

import { disconnectLitNodeClientInstance } from './internal/LitNodeClient/getLitNodeClient';

/** This method closes any registered event listeners maintained by Vincent Tool Clients, allowing your process to exit gracefully.
 * @category API Methods
 */
const disconnectVincentToolClients = disconnectLitNodeClientInstance;
export { disconnectVincentToolClients };

export { generateVincentToolSessionSigs, getVincentToolClient } from './toolClient';
export type {
  VincentToolClient,
  ToolClientContext,
  ToolResponse,
  ToolResponseFailure,
  ToolResponseFailureNoResult,
  ToolResponseSuccess,
  ToolResponseSuccessNoResult,
} from './toolClient';

export { getVincentWebAppClient } from './app';
export type {
  VincentWebAppClient,
  VincentAppClientConfig,
  RedirectToVincentConsentPageParams,
} from './types';

export type { BaseToolContext } from './toolClient';

import * as expressAuthHelpers from './express-authentication-middleware';
export { expressAuthHelpers };
export type { ExpressAuthHelpers } from './express-authentication-middleware/types';

import * as utils from './utils';
export { utils };
