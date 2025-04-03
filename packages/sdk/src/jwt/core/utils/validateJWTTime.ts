import { JWT_ERROR } from 'did-jwt';

/** Validates JWT time claims (iat and nbf)
 * @ignore
 *
 * @param payload - The decoded JWT payload
 * @param currentTime The time to compare the claims against
 * @returns true if time claims are valid, false otherwise
 */
export function validateJWTTime(
  payload: { nbf?: number; iat?: number },
  currentTime: number
): boolean {
  // Check 'not before' claim if present
  if (payload.nbf && currentTime < payload.nbf) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: Token not yet valid (nbf claim is in the future)`);
  }

  // Check 'issued at' claim if present
  // Allow a small leeway (30 seconds) for clock skew
  if (payload.iat && currentTime < payload.iat - 30) {
    throw new Error(
      `${JWT_ERROR.INVALID_JWT}: Token issued in the future (iat claim is ahead of current time)`
    );
  }

  return true;
}
