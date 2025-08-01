import type {
  VincentJWTAppUser,
  AnyVincentJWT,
  VincentJWTPlatformUser,
  VincentJWTDelegatee,
} from '../types';

import { JWT_ERROR } from '../constants';
import { isAppUser, isDelegateee, isPlatformUser } from '../typeGuards';
import { decodeVincentJWT } from './decode';
import { isExpired } from './isExpired';
import { validateJWTTime } from './utils';
import { verifyES256KSignature } from './utils/verifyES256KSignature';

/**
 * Verifies a Vincent JWT's:
 * - signature using `publicKey`
 * - expiration, not-before, issued-at
 * - audience against `expectedAudience`
 *
 * This method is called internally from the type-specific JWT verify methods and is not end-user facing
 *
 * @internal
 */

export async function verifyAnyVincentJWT({
  jwt,
  expectedAudience,
}: {
  jwt: string;
  expectedAudience: string;
}): Promise<AnyVincentJWT> {
  if (!expectedAudience) {
    throw new Error(`You must provide an expectedAudience`);
  }

  const decoded = decodeVincentJWT(jwt);
  const { payload } = decoded;
  const { aud, exp, publicKey } = payload;

  if (!exp) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: Missing expiration (exp)`);
  }

  if (isExpired(decoded)) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT expired at ${exp}`);
  }

  validateJWTTime(payload, Math.floor(Date.now() / 1000));

  const audiences = Array.isArray(aud) ? aud : [aud];
  if (!audiences.includes(expectedAudience)) {
    throw new Error(
      `${JWT_ERROR.INVALID_AUDIENCE}: Expected audience ${expectedAudience} not found in aud claim`
    );
  }

  if (!publicKey) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: Missing publicKey in payload`);
  }

  await verifyES256KSignature({ decoded });
  return decoded;
}

/** Verify a JWT that must decode to a VincentAppUserJWT
 *
 * @category API > Verify
 */
export async function verifyVincentAppUserJWT({
  jwt,
  expectedAudience,
  requiredAppId,
}: {
  jwt: string;
  expectedAudience: string;
  requiredAppId: number;
}): Promise<VincentJWTAppUser> {
  const decoded = await verifyAnyVincentJWT({ jwt, expectedAudience });

  if (!isAppUser(decoded)) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT is not an app-user token`);
  }

  const { app } = decoded.payload;

  if (!app || app.id !== requiredAppId) {
    throw new Error(
      `${JWT_ERROR.INVALID_JWT}: appId mismatch; expected ${requiredAppId}, got ${app?.id}`
    );
  }

  await verifyES256KSignature({ decoded });
  return decoded;
}

/**
 *
 * @category API > Verify
 */
export async function verifyVincentPlatformJWT({
  jwt,
  expectedAudience,
}: {
  jwt: string;
  expectedAudience: string;
}): Promise<VincentJWTPlatformUser> {
  const decoded = await verifyAnyVincentJWT({ jwt, expectedAudience });

  if (!isPlatformUser(decoded)) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT is not a platform token`);
  }

  await verifyES256KSignature({ decoded });
  return decoded;
}

/**
 *
 * @category API > Verify
 */
export async function verifyVincentDelegateeJWT({
  jwt,
  expectedAudience,
}: {
  jwt: string;
  expectedAudience: string;
}): Promise<VincentJWTDelegatee> {
  const decoded = await verifyAnyVincentJWT({ jwt, expectedAudience });

  if (!isDelegateee(decoded)) {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: JWT is not a platform token`);
  }

  await verifyES256KSignature({ decoded });
  return decoded;
}
