import { createPKPSignedJWT } from './core/create';
import { decodeJWT, verifyJWT } from './core/validate';
import { isJWTExpired } from './core/utils';

/** @namespace */
export const jwt = {
  /** @function
   * @hidden
   * */
  create: createPKPSignedJWT,
  /** @function */
  decode: decodeJWT,
  /** @function */
  verify: verifyJWT,
  /** @function */
  isExpired: isJWTExpired,
};
