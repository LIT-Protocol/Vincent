import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { JWTConfig } from '../types';
import * as didJWT from 'did-jwt';
import { ethers } from 'ethers';

/**
 * Creates a signer function compatible with did-jwt that uses a PKP wallet for signing
 *
 * This function returns a signing function that conforms to the did-jwt library's
 * signer interface. When called, it signs data using the PKP wallet, formatting
 * the signature according to ES256K requirements (without recovery parameter).
 *
 * @param pkpWallet - The PKP Ethers wallet instance that will be used for signing
 * @returns A signing function that takes data and returns a base64url-encoded signature
 * @example
 * ```typescript
 * const pkpWallet = new PKPEthersWallet({ ... });
 * const signer = createPKPSigner(pkpWallet);
 * const signature = await signer('data to sign');
 * ```
 */
export function createPKPSigner(pkpWallet: PKPEthersWallet) {
  /**
   * Converts a hex string to a Uint8Array
   *
   * @param hex - The hex string to convert (with or without 0x prefix)
   * @returns A Uint8Array representation of the hex string
   */
  const hexToUint8Array = (hex: string): Uint8Array => {
    if (hex.startsWith('0x')) {
      hex = hex.slice(2);
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  };

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

    const rBytes = hexToUint8Array(r.slice(2));
    const sBytes = hexToUint8Array(s.slice(2));

    // ES256K signature is r and s concatenated (64 bytes total)
    const sigBytes = new Uint8Array(64);
    sigBytes.set(rBytes, 0);
    sigBytes.set(sBytes, 32);

    // Convert to base64url encoding
    const base64Sig = Buffer.from(sigBytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return base64Sig;
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
export async function createPKPSignedJWT(config: JWTConfig): Promise<string> {
  const { pkpWallet, pkp, payload, expiresInMinutes, audience } = config;
  const signer = createPKPSigner(pkpWallet);

  // iat and exp are expressed in seconds https://datatracker.ietf.org/doc/html/rfc7519
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInMinutes * 60;

  const walletAddress = await pkpWallet.getAddress();

  const fullPayload: {
    iat: number;
    exp: number;
    iss: string;
    pkpPublicKey: string;
    aud?: string | string[];
    [key: string]: unknown;
  } = {
    ...payload,
    aud: audience,
    iat,
    exp,
    iss: `did:ethr:${walletAddress}`,
    pkpPublicKey: pkp.publicKey,
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
