import { createPKPSignedJWT } from './core/create';
import { decodeJWT, verifyJWT } from './core/validate';
import { isJWTExpired } from './core/utils';

export const create = createPKPSignedJWT;

/**  Helper methods for working with Vincent-issues JWTs.
 *
 * @category Vincent SDK API
 * @namespace
 * @inline
 */
export const jwt = {
  /** @function
   * @hidden
   * */
  create,

  /** Decodes a Vincent JWT in string form and returns an {@link VincentJWT} decoded object for your use
   *
   * @function
   * @example
   * ```typescript
   *   try {
   *     const decodedVincentJWT = decode(jwt);
   *   } catch(e) {
   *    // Handle malformed JWT string case
   *   }
   *
   *   // You still need to verify the JWT!
   *  ```
   * */
  decode: decodeJWT,

  /**
   * @inline
   * @expand
   * @function
   *
   * @example
   * ```typescript
   *  try {
   *    const decodedAndVerifiedVincentJWT = verify(jwt, 'https://myapp.com');
   *   } catch(e) {
   *    // Handle invalid/expired JWT casew
   *  }
   * ```
   * */
  verify: verifyJWT,

  /**
   * When a JWT is expired, you need to use {@link VincentWebAppClient.redirectToConsentPage} to get a new JWT
   * @inline
   * @expand
   * @function
   *
   * @example
   *  ```typescript
   *   import { jwt } from '@lit-protocol/vincent-sdk';
   *
   *   const { decode, isExpired } = jwt;
   *
   *   const decodedVincentJWT = decode(jwt);
   *   const isJWTExpired = isExpired(decodedVincentJWT);
   *
   *   if(!isJWTExpired) {
   *     // User is logged in
   *   } else {
   *     // User needs to get a new JWT
   *     vincentWebAppClient.redirectToConsentPage({redirectUri: window.location.href });
   *   }
   * ```
   * */
  isExpired: isJWTExpired,
};
