import type { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import type { IRelayPKP } from '@lit-protocol/types';
import type { JWTDecoded, JWTPayload } from 'did-jwt/lib/JWT';

/**
 * Configuration interface for creating a JWT (JSON Web Token) signed by a PKP wallet.
 * Vincent App developers will likely never need this function, as the provider of the JWT is the Vincent consent page frontend
 *
 * @interface JWTConfig
 * @hidden
 * @property {PKPEthersWallet} pkpWallet - The PKP Ethers wallet instance used for signing the JWT
 * @property {IRelayPKP} pkp - The PKP object
 * @property {Record<string, unknown>} payload - Custom claims to include in the JWT payload
 * @property {number} expiresInMinutes - Token expiration time in minutes from current time
 * @property {string} audience - The domain(s) this token is intended for (aud claim)
 */
export interface JWTConfig {
  pkpWallet: PKPEthersWallet;
  pkp: IRelayPKP;
  payload: Record<string, unknown>;
  expiresInMinutes: number;
  audience: string | string[];
  app: {
    id: string;
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
 * @property {string} app - The app associated with the JWT.
 * @property {string} pkp - The PKP associated with the JWT.
 * @property {string} authentication - The authentication method used to generate the JWT.
 */
export interface VincentJWTPayload extends JWTPayload {
  pkp: IRelayPKP;
  app: {
    id: string;
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
 * @extends { JWTDecoded } Extends the payload provided by the JWTDecoded type from `did-jwt` with Vincent-specific properties
 * @property {VincentJWTPayload} payload - The payload of the JWT
 */
export interface VincentJWT extends JWTDecoded {
  payload: VincentJWTPayload;
}
