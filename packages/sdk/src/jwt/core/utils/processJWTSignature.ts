/** Processes a JWT signature from base64url to binary
 * @ignore
 *
 * @param signature - The base64url encoded signature string
 * @returns A Uint8Array of the binary signature
 */
export function processJWTSignature(signature: string): Uint8Array {
  // Convert base64url to base64
  let base64 = signature.replace(/-/g, '+').replace(/_/g, '/');

  // Pad with '=' if needed
  while (base64.length % 4) {
    base64 += '=';
  }

  // Decode base64 to binary
  const binary = Buffer.from(base64, 'base64');
  return new Uint8Array(binary);
}
