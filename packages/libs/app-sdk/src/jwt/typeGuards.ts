import { JWT_ERROR } from 'did-jwt';

import type { JWTDecoded, VincentJWT, VincentJWTAppSpecific } from './types';

import { isDefinedObject } from './core/utils/index';

/** Use this typeguard function to identify if the JWT is appId specific and make subsequent type-safe
 * references into the payload of the JWT
 */
export function isAppSpecificJWT(decodedJWT: VincentJWT): decodedJWT is VincentJWTAppSpecific {
  return decodedJWT.payload.app && decodedJWT.payload.app.id;
}

/** Use this typeguard function to identify if the JWT is a general authentication JWT that has no specific app target */
export function isGeneralJWT(decodedJWT: VincentJWT): decodedJWT is VincentJWT {
  return !isAppSpecificJWT(decodedJWT);
}

/** This assert function is used internally to throw if decoding a JWT that is expected to be a VincentJWT gives a malformed response.
 * You probably don't need it -- use `decode()` and `verify()`
 *
 * @hidden
 */
export function assertIsVincentJWT(
  decodedJWT: JWTDecoded
): asserts decodedJWT is VincentJWT | VincentJWTAppSpecific {
  const { authentication, pkp } = decodedJWT.payload;

  if (!isDefinedObject(authentication)) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: Missing "authentication" field in JWT payload.`);
  }

  if (!isDefinedObject(pkp)) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: Missing "pkp" field in JWT payload.`);
  }
}
