import { arrayify, splitSignature, toUtf8Bytes } from 'ethers/lib/utils';

import type {
  CreateAppUserJWTParams,
  CreateDelegateeJWTParams,
  CreatePlatformUserJWTParams,
  CreateJWSConfig,
  JWTWalletSigner,
} from '../types';

import { VINCENT_JWT_API_VERSION } from '../constants';
import { toBase64Url } from './utils/base64';

function createES256KSigner(wallet: JWTWalletSigner) {
  return async (data: string | Uint8Array): Promise<string> => {
    const messageBytes = typeof data === 'string' ? toUtf8Bytes(data) : data;
    const sig = await wallet.signMessage(messageBytes);
    const { r, s } = splitSignature(sig);
    const sigBytes = new Uint8Array(64);
    sigBytes.set(arrayify(r), 0);
    sigBytes.set(arrayify(s), 32);
    return toBase64Url(sigBytes);
  };
}

async function createJWS({ payload, wallet, config }: CreateJWSConfig) {
  const { expiresInMinutes, audience, subjectAddress, role } = config;

  const iat = Math.floor(Date.now() / 1000);
  const exp = <number>(payload.nbf || Math.floor(Date.now() / 1000) + expiresInMinutes * 60);
  const header = { alg: 'ES256K', typ: 'JWT' };
  const _payload = {
    ...payload,
    iat,
    exp,
    iss: await wallet.getAddress(),
    publicKey: wallet.publicKey,
    aud: audience,
    role,
    ...(subjectAddress ? { sub: subjectAddress } : {}),

    __vincentJWTApiVersion: VINCENT_JWT_API_VERSION,
  };

  const signingInput = [
    toBase64Url(toUtf8Bytes(JSON.stringify(header))),
    toBase64Url(toUtf8Bytes(JSON.stringify(_payload))),
  ].join('.');

  const signature = await createES256KSigner(wallet)(signingInput);

  // JWS Compact Serialization
  // https://www.rfc-editor.org/rfc/rfc7515#section-7.1
  return [signingInput, signature].join('.');
}

/**
 * Create JWT for a platform user
 * @category API > Create
 * */
export async function createPlatformUserJWT(config: CreatePlatformUserJWTParams): Promise<string> {
  const { pkpWallet, pkpInfo, authentication, audience, expiresInMinutes, payload = {} } = config;

  return createJWS({
    payload: {
      ...payload,
      pkpInfo,
      authentication,
    },
    wallet: pkpWallet,
    config: { audience, expiresInMinutes, role: 'platform-user' },
  });
}

/** Create JWT for an app-scoped user
 * @category API > Create
 * */
export async function createAppUserJWT(config: CreateAppUserJWTParams): Promise<string> {
  const {
    app,
    pkpWallet,
    pkpInfo,
    authentication,
    audience,
    expiresInMinutes,
    payload = {},
  } = config;

  return createJWS({
    payload: {
      ...payload,
      pkpInfo,
      app,
      authentication,
    },
    wallet: pkpWallet,
    config: { audience, expiresInMinutes, role: 'app-user' },
  });
}

/**
 * Creates a JWT for an app delegatee (Ethereum account that may act on behalf of a user).
 *
 * If your use-case is to authenticate with a service on behalf of a specific delegator, you must provide a valid `subjectAddress`
 * which should be a valid delegator for your Delegatee address.
 *
 * @category API > Create
 */
export async function createDelegateeJWT(config: CreateDelegateeJWTParams): Promise<string> {
  const { ethersWallet, subjectAddress, audience, expiresInMinutes, payload = {} } = config;

  console.log('Creating delegatee JWT');

  return createJWS({
    payload,
    wallet: ethersWallet,
    config: { audience, expiresInMinutes, subjectAddress, role: 'app-delegatee' },
  });
}
