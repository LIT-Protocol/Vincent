import * as secp256k1 from '@noble/secp256k1';
import * as didJWT from 'did-jwt';
import { JWT_ERROR } from 'did-jwt';
import { ethers } from 'ethers';
import { arrayify, toUtf8Bytes } from 'ethers/lib/utils';

import type { VincentJWT, VincentJWTAppSpecific } from '../types';

import { isAppSpecificJWT, assertIsVincentJWT } from '../typeGuards';
import { isExpired } from './isExpired';
import { processJWTSignature, splitJWT, validateJWTTime } from './utils';

export function verify({
  jwt,
  expectedAudience,
}: {
  jwt: string;
  expectedAudience: string;
  requiredAppId: undefined;
}): VincentJWT;

export function verify({
  jwt,
  expectedAudience,
  requiredAppId,
}: {
  jwt: string;
  expectedAudience: string;
  requiredAppId: number;
}): VincentJWTAppSpecific;

export function verify({
  jwt,
  expectedAudience,
  requiredAppId,
}: {
  jwt: string;
  expectedAudience: string;
  requiredAppId: number | undefined;
}): VincentJWT | VincentJWTAppSpecific;

/**
 * Decodes and verifies an {@link VincentJWT} token in string form
 *
 * This function returns the decoded {@link VincentJWT} object only if:
 * 1. The JWT signature is valid
 * 2. The JWT is not expired
 * 3. All time claims (nbf, iat) are valid
 * 4. The JWT has an audience claim that includes the expected audience
 *
 * @param params
 * @param jwt - The JWT string to verify
 * @param expectedAudience - String that should be in the audience claim(s)
 * @param requiredAppId - The appId that should be in the payload of the JWT. If app is not defined, or app.id is different, this method will throw.
 *
 * @returns {VincentJWT} The decoded VincentJWT object if it was verified successfully
 *
 * @category API
 * @inline
 * @expand
 * @function
 *
 * @example
 * ```typescript
 *  import { verify } from '@lit-protocol/vincent-app-sdk/jwt';
 *
 *  try {
 *    const decodedAndVerifiedVincentJWT = verify({ jwt, expectedAudience: 'https://myapp.com', requiredAppId: 555 });
 *   } catch(e) {
 *    // Handle invalid/expired JWT casew
 *  }
 * ```
 */
export function verify({
  jwt,
  expectedAudience,
  requiredAppId,
}: {
  jwt: string;
  expectedAudience: string;
  requiredAppId: number | undefined;
}): VincentJWT | VincentJWTAppSpecific {
  if (!expectedAudience) {
    throw new Error(`You must provide an expectedAudience`);
  }

  const decoded = decode({ jwt, requiredAppId });
  const { aud, exp, pkp } = decoded.payload;

  if (!exp) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT does not contain an expiration claim (exp)`);
  }

  const expired = isExpired(decoded);
  if (expired) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT expired at ${exp}`);
  }

  validateJWTTime(decoded.payload, Math.floor(Date.now() / 1000));

  // Always validate audience - reject if no audience claim or expected audience isn't included
  if (!aud) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT does not contain an audience claim (aud)`);
  }

  const audiences = Array.isArray(aud) ? aud : [aud];

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

    const publicKeyBytes = arrayify(pkp.publicKey);

    // PKPEthersWallet.signMessage() adds Ethereum prefix, so we need to add it here too
    const ethPrefixedMessage = '\x19Ethereum Signed Message:\n' + signedData.length + signedData;
    const messageHash = ethers.utils.keccak256(toUtf8Bytes(ethPrefixedMessage));
    const messageHashBytes = arrayify(messageHash);

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

export function decode({
  jwt,
  requiredAppId,
}: {
  jwt: string;
  requiredAppId: undefined;
}): VincentJWT;

export function decode({
  jwt,
  requiredAppId,
}: {
  jwt: string;
  requiredAppId: number;
}): VincentJWTAppSpecific;

export function decode({
  jwt,
  requiredAppId,
}: {
  jwt: string;
  requiredAppId: number | undefined;
}): VincentJWT | VincentJWTAppSpecific;

/** Decodes a Vincent JWT in string form and returns an {@link VincentJWT} decoded object for your use
 *
 * @param jwt - The jwt in string form. It will be decoded and checked to be sure it is not malformed.
 * @param requiredAppId - The appId that should be in the payload of the JWT. If app is not defined, or app.id is different, this method will throw.
 *
 * <div class="box info-box">
 *   <p class="box-title info-box-title">
 *     <span class="box-icon info-icon">Info</span> Note
 *   </p>
 * This method only <i><b>decodes</b></i> the JWT_ -- you still need to {@link verify} the JWT to be sure it is valid!
 * If the JWT is expired, you need to use a {@link webAuthClient.WebAuthClient | WebAuthClient} to get a new JWT.
 *
 * See {@link webAuthClient.getWebAuthClient | getWebAuthClient}
 *
 * </div>
 * @inline
 * @expand
 * @function
 * @category API
 *
 * @example
 *  ```typescript
 *   import { decode, isExpired } from '@lit-protocol/vincent-app-sdk/jwt';
 *
 *   const decodedVincentJWT = decode({ jwt, requiredAppId: 555 });
 *   const isJWTExpired = isExpired(decodedVincentJWT);
 *
 *   if(!isJWTExpired) {
 *     // User is logged in
 *     // You still need to verify the JWT!
 *   } else {
 *     // User needs to get a new JWT
 *     webAuthClient.redirectToConnectPage({redirectUri: window.location.href });
 *   }
 *
 *  ```
 * */
export function decode({
  jwt,
  requiredAppId,
}: {
  jwt: string;
  requiredAppId: number | undefined;
}): VincentJWT | VincentJWTAppSpecific {
  const decodedJwt = didJWT.decodeJWT(jwt);

  assertIsVincentJWT(decodedJwt);

  if (requiredAppId) {
    if (!isAppSpecificJWT(decodedJwt)) {
      throw new Error(
        `${JWT_ERROR.INVALID_JWT}: JWT is not app specific; cannot verify requiredAppId`
      );
    }

    const { app } = decodedJwt.payload;
    if (requiredAppId !== app.id) {
      throw new Error(
        `${JWT_ERROR.INVALID_JWT}: appId in JWT does not match requiredAppId. Expected ${requiredAppId}, got ${app.id} `
      );
    }
  }

  return decodedJwt;
}
