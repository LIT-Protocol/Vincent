import type { JWTHeader, JWTPayload } from 'did-jwt';

import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import type { IRelayPKP } from '@lit-protocol/types';

// Copied interface from did-jwt that is not exposed publicly
export interface JWTDecoded {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
  data: string;
}

/**
 * Configuration interface for creating a JWT (JSON Web Token) signed by a PKP wallet.
 * Vincent App developers will likely never need this function, as the provider of the JWT is the Vincent Connect page frontend
 *
 * @interface JWTConfig
 * @hidden
 * @property pkpWallet - The PKP Ethers wallet instance used for signing the JWT
 * @property pkp - The PKP object
 * @property payload - Custom claims to include in the JWT payload
 * @property expiresInMinutes - Token expiration time in minutes from current time
 * @property [app] - The app / appversion that the JWT is limited to (if it is at all)
 * @property audience - The domain(s) this token is intended for (aud claim)
 * @property authentication - The authentication method used to generate the JWT.
 *
 */
export interface JWTConfig {
  pkpWallet: PKPEthersWallet;
  pkp: IRelayPKP;
  payload: Record<string, unknown>;
  expiresInMinutes: number;
  audience: string | string[];
  app?: {
    id: number;
    version: number;
  };
  authentication: {
    type: string;
    value?: string;
  };
}

/**
 * Extended payload interface for Vincent-specific JWTs.
 *
 * @interface BaseVincentJWTPayload
 * @extends {JWTPayload} Extends the JWTPayload type from `did-jwt` with Vincent-specific properties
 *
 * @property pkp - The PKP details associated with the JWT.
 * @property authentication - The authentication method that was used to authenticate with the PKP that generated the JWT.
 *
 * @category Interfaces
 */
export interface BaseVincentJWTPayload extends JWTPayload {
  pkp: IRelayPKP;
  authentication: {
    type: string;
    value?: string;
  };
}

/**
 * Interface representing a decoded Vincent JWT
 *
 * @interface VincentJWT
 * @property { BaseVincentJWTPayload } payload - The payload of the JWT
 *
 * @category Interfaces
 */
export interface VincentJWT extends JWTDecoded {
  payload: BaseVincentJWTPayload;
}

/** App-specific Vincent JWT payloads are used to authenticate with a specific app @ a specific version */
interface VincentJWTAppSpecificPayload extends BaseVincentJWTPayload {
  app: {
    id: number;
    version: number;
  };
}

/** VincentJWTAppSpecific type JWTs are used to signal authorization from a user to use a specific app / appVersion
 */
export interface VincentJWTAppSpecific extends VincentJWT {
  payload: VincentJWTAppSpecificPayload;
}
