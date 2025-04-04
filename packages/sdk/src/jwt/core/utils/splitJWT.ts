import { JWT_ERROR } from 'did-jwt';

/** Splits a JWT into its signed data portion and signature
 * @ignore
 *
 * @param jwt - The JWT string
 * @returns An object with signedData and signature
 */
export function splitJWT(jwt: string): { signedData: string; signature: string } {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT format: must contain 3 parts separated by "."`);
  }

  return {
    signedData: `${parts[0]}.${parts[1]}`,
    signature: parts[2],
  };
}
