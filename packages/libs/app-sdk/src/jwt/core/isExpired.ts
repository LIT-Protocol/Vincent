import type { AnyVincentJWT } from '../types';

/** Checks if a JWT is expired based on its 'exp' claim
 *
 * @returns true if expired, false otherwise
 * @param decodedJWT
 * @category API > Verify
 */
export function isExpired(decodedJWT: AnyVincentJWT): boolean {
  const { payload } = decodedJWT;

  // Tokens that never expire are treated as expired for security.
  if (!payload.exp) {
    return true;
  }

  // JWT exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime >= payload.exp;
}
