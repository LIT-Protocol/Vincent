import * as didJWT from 'did-jwt';
import { ethers } from 'ethers';
import { arrayify } from 'ethers/lib/utils';

import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

import type { JWTConfig, VincentJWTPayload } from '../types';

import { toBase64Url } from './utils/base64';

/**
 * Creates a signer function compatible with did-jwt that uses a PKP wallet for signing
 *
 * This function returns a signing function that conforms to the did-jwt library's
 * signer interface. When called, it signs data using the PKP wallet, formatting
 * the signature according to ES256K requirements (without recovery parameter).
 *
 * @param pkpWallet - The PKP Ethers wallet instance that will be used for signing
 * @returns A signing function that takes data and returns a base64url-encoded signature
 * @private
 * @example
 * ```typescript
 * const pkpWallet = new PKPEthersWallet({ ... });
 * const signer = createPKPSigner(pkpWallet);
 * const signature = await signer('data to sign');
 * ```
 */
function createPKPSigner(pkpWallet: PKPEthersWallet) {
  /**
   * The actual signer function conforming to the did-jwt signer interface
   *
   * @param data - The data to sign, either as a string or Uint8Array
   * @returns A promise that resolves to the base64url-encoded signature
   */
  return async (data: string | Uint8Array): Promise<string> => {
    const dataBytes = typeof data === 'string' ? Uint8Array.from(Buffer.from(data, 'utf8')) : data;

    const sig = await pkpWallet.signMessage(dataBytes);
    const { r, s } = ethers.utils.splitSignature(sig);

    const rBytes = arrayify(r);
    const sBytes = arrayify(s);

    // ES256K signature is r and s concatenated (64 bytes total)
    const sigBytes = new Uint8Array(64);
    sigBytes.set(rBytes, 0);
    sigBytes.set(sBytes, 32);

    return toBase64Url(sigBytes);
  };
}

/**
 * Creates a JWT signed by a PKP wallet using the ES256K algorithm
 *
 * This function creates a JWT with the provided payload, adding standard claims
 * like iat (issued at), exp (expiration), and iss (issuer). It also includes the
 * PKP public key in the payload, which is used for verification.
 *
 * @param config - Configuration object containing all parameters for JWT creation
 * @returns A promise that resolves to the signed JWT string
 * @hidden
 * @example
 * ```typescript
 * const jwt = await createPKPSignedJWT({
 *   pkpWallet: pkpWallet,
 *   pkp: pkpInfo,
 *   payload: { name: "Lit Protocol User", customField: "value" },
 *   expiresInMinutes: 30, // expires in 30 minutes
 *   audience: "example.com" // audience domain
 * });
 * ```
 */
export async function create(config: JWTConfig): Promise<string> {
  const { app, pkpWallet, pkp, payload, expiresInMinutes, audience, authentication } = config;
  const signer = createPKPSigner(pkpWallet);

  // iat and exp are expressed in seconds https://datatracker.ietf.org/doc/html/rfc7519
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInMinutes * 60;

  const walletAddress = await pkpWallet.getAddress();

  const fullPayload: VincentJWTPayload = {
    ...payload,
    aud: audience,
    iat,
    exp,
    iss: `did:ethr:${walletAddress}`,
    pkp,
    app,
    authentication: {
      type: authentication.type,
      ...(authentication.value ? { value: authentication.value } : {}),
    },
  };

  const jwt = await didJWT.createJWT(
    fullPayload,
    {
      issuer: `did:ethr:${walletAddress}`,
      signer,
    },
    {
      alg: 'ES256K',
    }
  );

  return jwt;
}
