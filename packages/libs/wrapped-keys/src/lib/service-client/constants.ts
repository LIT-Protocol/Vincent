import type { SupportedNetworks } from './types';

/**
 * Mapping of supported Lit networks to their corresponding Vincent wrapped keys service URLs.
 *
 * Vincent only supports production 'datil' network and uses the shared wrapped keys infrastructure
 * at wrapped.litprotocol.com. All Vincent delegatee requests use the `/delegatee/encrypted` routes.
 *
 * @constant {Record<SupportedNetworks, string>}
 */
export const SERVICE_URL_BY_LIT_NETWORK: Record<SupportedNetworks, string> = {
  datil: 'https://wrapped.litprotocol.com',
};

/**
 * Authorization header prefix for JWT tokens used in Vincent wrapped keys service requests.
 *
 * Vincent delegatees authenticate using JWT tokens with the standard Bearer authorization scheme.
 * This prefix is prepended to the JWT token to form the complete Authorization header value.
 *
 * @constant {string}
 * @example
 * // Results in: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * const authHeader = `${JWT_AUTHORIZATION_SCHEMA_PREFIX}${jwtToken}`;
 */
export const JWT_AUTHORIZATION_SCHEMA_PREFIX = 'Bearer ';
