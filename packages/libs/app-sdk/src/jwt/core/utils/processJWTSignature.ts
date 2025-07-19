import { fromBase64 } from './base64';

/** Processes a JWT signature from base64url to binary
 * @ignore
 *
 * @param signature - The base64url encoded signature string
 * @returns A Uint8Array of the binary signature
 */
export function processJWTSignature(signature: string): Uint8Array {
  return fromBase64(signature);
}
