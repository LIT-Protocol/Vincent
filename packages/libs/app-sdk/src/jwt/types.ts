import type { Wallet } from 'ethers';

import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import type { IRelayPKP } from '@lit-protocol/types';

export type JWTWalletSigner = Omit<Wallet, '_signingKey' | '_mnemonic'>;

/** Property keys that are set by internal logic during Vincent JWT creation, so should not be in your `payload`
 *
 * @category Interfaces
 */
export type InternallySetPayloadKeys =
  | 'iss'
  | 'sub'
  | 'aud'
  | 'iat'
  | 'exp'
  | 'publicKey'
  | 'role'
  | '__vincentJWTApiVersion';

type DisallowKeys<T, K extends keyof any> = {
  [P in Exclude<keyof T, K>]: T[P];
} & {
  [P in K]?: never;
};

/** Many standard payload properties are set automatically on Vincent JWTs, and will be overridden if you try to pass them
 * in the raw `payload` when creating a new JWT.
 *
 * This interface identifies the keys that should not be provided in your `payload`, as they are internally managed.
 *
 * See {@link InternallySetPayloadKeys} for the list.
 *
 * @category Interfaces
 */
export type PayloadWithoutInternallySetKeys = DisallowKeys<
  Record<string, any>,
  InternallySetPayloadKeys
>;

export interface CreateJWSConfig {
  payload: PayloadWithoutInternallySetKeys;
  wallet: JWTWalletSigner;
  config: {
    audience: string | string[];
    expiresInMinutes: number;
    subjectAddress?: `0x${string}`;
    role: VincentJWTRole;
  };
}

/** JWT payload properties that are shared by all Vincent JWTs
 *
 * @category Interfaces
 */
export interface JWTPayload {
  iat: number;
  exp: number;
  iss: `0x${string}`;
  aud: string | string[];
  sub?: `0x${string}`;
  nbf?: number;
  publicKey: `0x${string}`; // This is the uncompressed pubKey of the issuer

  __vincentJWTApiVersion: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

/**
 *
 * @category Interfaces
 */
export interface DecodedJWT {
  header: {
    typ: 'JWT';
    alg: 'ES256K';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [x: string]: any;
  };
  payload: JWTPayload;
  signature: string;
  data: string;
}

/**
 *
 * @category Interfaces
 */
export interface PKPAuthenticationMethod {
  type: string;
  value?: string;
}

/**
 *
 * @category Interfaces
 */
export interface AppInfo {
  id: number;
  version: number;
}

/** All valid Vincent JWT roles
 *
 * @category Interfaces
 * */
export type VincentJWTRole = 'platform-user' | 'app-user' | 'app-delegatee';

/**
 * @inline
 * @category Interfaces
 */
export interface VincentPKPPayload extends JWTPayload {
  pkpInfo: IRelayPKP;
  authentication: PKPAuthenticationMethod;
}

/**
 *
 * @category Interfaces
 */
export interface VincentJWTPlatformUser extends DecodedJWT {
  payload: VincentPKPPayload & {
    role: 'platform-user';
  };
}

/**
 *
 * @category Interfaces
 */
export interface VincentJWTAppUser extends DecodedJWT {
  payload: VincentPKPPayload & {
    role: 'app-user';
    app: AppInfo;
  };
}

/**
 *
 * @category Interfaces
 */
export interface VincentJWTDelegatee extends DecodedJWT {
  payload: JWTPayload & {
    role: 'app-delegatee';
    sub?: `0x${string}`;
  };
}

/**
 *
 * @category Interfaces
 */
export type AnyVincentJWT = VincentJWTPlatformUser | VincentJWTAppUser | VincentJWTDelegatee;

interface BaseJWTParams {
  payload?: PayloadWithoutInternallySetKeys;
  audience: string | string[];
  expiresInMinutes: number;
}

interface VincentPKPJWTParams extends BaseJWTParams {
  pkpWallet: PKPEthersWallet;
  pkpInfo: IRelayPKP;
  authentication: PKPAuthenticationMethod;
}

/**
 *
 * @category Interfaces
 */
export type CreatePlatformUserJWTParams = VincentPKPJWTParams;

/**
 *
 * @category Interfaces
 */
export interface CreateAppUserJWTParams extends VincentPKPJWTParams {
  app: AppInfo;
}

/**
 *
 * @category Interfaces
 */
export interface CreateDelegateeJWTParams extends BaseJWTParams {
  ethersWallet: Wallet;
  subjectAddress: `0x${string}`; // This is typically the delegator address that we're trying to accessing data for
}
