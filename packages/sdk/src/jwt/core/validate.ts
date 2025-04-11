import * as secp256k1 from '@noble/secp256k1';
import * as didJWT from 'did-jwt';
import { JWT_ERROR } from 'did-jwt';
import { ethers } from 'ethers';
import { VincentJWT } from '../types';
import { isJWTExpired, processJWTSignature, splitJWT, validateJWTTime } from './utils';

/**
 * Decodes and verifies an {@link VincentJWT} token in string form
 *
 * This function returns the decoded {@link VincentJWT} object only if:
 * 1. The JWT signature is valid
 * 2. The JWT is not expired
 * 3. All time claims (nbf, iat) are valid
 * 4. The JWT has an audience claim that includes the expected audience
 *
 * @param {string} jwt - The JWT string to verify
 * @param {string} expectedAudience - String that should be in the audience claim(s)
 *
 * @returns {VincentJWT} The decoded VincentJWT object if it was verified successfully
 */
export function verifyJWT(jwt: string, expectedAudience: string): VincentJWT {
  if (!expectedAudience) {
    throw new Error(`You must provide an expectedAudience`);
  }

  const decoded = decodeJWT(jwt);

  if (!decoded.payload.exp) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT does not contain an expiration claim (exp)`);
  }

  const isExpired = isJWTExpired(decoded);
  if (isExpired) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT expired at ${decoded.payload.exp}`);
  }

  validateJWTTime(decoded.payload, Math.floor(Date.now() / 1000));

  // Always validate audience - reject if no audience claim or expected audience isn't included
  if (!decoded.payload.aud) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT does not contain an audience claim (aud)`);
  }

  const audiences = Array.isArray(decoded.payload.aud)
    ? decoded.payload.aud
    : [decoded.payload.aud];

  if (!audiences.includes(expectedAudience)) {
    throw new Error(
      `${JWT_ERROR.INVALID_AUDIENCE}: Expected audience ${expectedAudience} not found in aud claim`
    );
  }

  try {
    const { signedData, signature } = splitJWT(jwt);

    // Process signature from base64url to binary
    const signatureBytes = processJWTSignature(signature);

    // Extract r and s values from the signature
    const r = signatureBytes.slice(0, 32);
    const s = signatureBytes.slice(32, 64);

    // Process public key
    let publicKey = decoded.payload.pkp.publicKey;
    if (publicKey.startsWith('0x')) {
      publicKey = publicKey.substring(2);
    }

    const publicKeyBytes = Buffer.from(publicKey, 'hex');

    // PKPEthersWallet.signMessage() adds Ethereum prefix, so we need to add it here too
    const ethPrefixedMessage = '\x19Ethereum Signed Message:\n' + signedData.length + signedData;
    const messageBuffer = Buffer.from(ethPrefixedMessage, 'utf8');

    const messageHash = ethers.utils.keccak256(messageBuffer);
    const messageHashBytes = Buffer.from(messageHash.substring(2), 'hex');

    const signatureForSecp = new Uint8Array([...r, ...s]);

    // Verify the signature against the public key
    const isVerified = secp256k1.verify(signatureForSecp, messageHashBytes, publicKeyBytes);

    if (!isVerified) {
      throw new Error(`Signature verify() did not pass for ${signature}`);
    }

    return decoded;
  } catch (error) {
    throw new Error(
      `${JWT_ERROR.INVALID_SIGNATURE}: Invalid signature: ${(error as Error).message}`
    );
  }
}

/** This function uses the did-jwt library to decode a JWT string into its payload adding any extra Vincent fields
 *
 * @param {string} jwt - The JWT string to decode
 * @returns The decoded Vincent JWT fields
 */
export function decodeJWT(jwt: string): VincentJWT {
  return didJWT.decodeJWT(jwt) as VincentJWT;
}
