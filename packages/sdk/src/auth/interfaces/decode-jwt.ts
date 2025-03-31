import type { JWTDecoded, JWTPayload } from 'did-jwt/lib/JWT';

/**
 * Interface representing a decoded Vincent JWT
 *
 * This interface defines the structure of a decoded JWT, including the header, payload, and signature
 *
 * @interface DecodedJWT
 * @property {Object} header - The header of the JWT
 * @property {Object} payload - The payload of the JWT
 * @property {string} signature - The signature of the JWT
 */
export type DecodedJWT = JWTDecoded;

export interface DecodedVincentJWT extends JWTDecoded {
  payload: JWTPayload & {
    pkpPublicKey: string;
    pkpAddress: string;
  };
}
