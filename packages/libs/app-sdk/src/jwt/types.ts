import type { JWTHeader, JWTPayload } from 'did-jwt';

import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import type { IRelayPKP } from '@lit-protocol/types';

// Copied interface from did-jwt that is not exposed publicly
interface JWTDecoded {
  header: JWTHeader;
  payload: JWTPayload;
  signature: string;
  data: string;
}

/**
 * Configuration interface for creating a JWT (JSON Web Token) signed by a PKP wallet.
 * Vincent App developers will likely never need this function, as the provider of the JWT is the Vincent delegation auth page frontend
 *
 * @interface JWTConfig
 * @hidden
 * @property pkpWallet - The PKP Ethers wallet instance used for signing the JWT
 * @property pkp - The PKP object
 * @property payload - Custom claims to include in the JWT payload
 * @property expiresInMinutes - Token expiration time in minutes from current time
 * @property audience - The domain(s) this token is intended for (aud claim)
 */
export interface JWTConfig {
  pkpWallet: PKPEthersWallet;
  pkp: IRelayPKP;
  payload: Record<string, unknown>;
  expiresInMinutes: number;
  audience: string | string[];
  app: {
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
 * @interface VincentJWTPayload
 * @extends {JWTPayload} Extends the JWTPayload type from `did-jwt` with Vincent-specific properties
 * @property app - The app associated with the JWT.
 * @property pkp - The PKP associated with the JWT.
 * @property authentication - The authentication method used to generate the JWT.
 *
 * @category Interfaces
 */
export interface VincentJWTPayload extends JWTPayload {
  pkp: IRelayPKP;
  app: {
    id: number;
    version: number;
  };
  authentication: {
    type: string;
    value?: string;
  };
}

/**
 * Interface representing a decoded Vincent JWT
 *
 * @interface VincentJWT
 * @property { VincentJWTPayload } payload - The payload of the JWT
 *
 * @category Interfaces
 */
export interface VincentJWT extends JWTDecoded {
  payload: VincentJWTPayload;
}
