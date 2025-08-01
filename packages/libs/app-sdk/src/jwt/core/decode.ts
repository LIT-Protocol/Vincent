import type {
  VincentJWTPlatformUser,
  VincentJWTAppUser,
  VincentJWTDelegatee,
  AnyVincentJWT,
  DecodedJWT,
} from '../types';

import { JWT_ERROR } from '../constants';
import { assertIsPKPSignedVincentJWT } from '../typeGuards';
import { decodeJWT } from './utils/decodeJWTStr';

export function decodeVincentJWT(jwt: string): AnyVincentJWT {
  const decoded = decodeJWT(jwt);

  if (!decoded || typeof decoded !== 'object') {
    throw new Error(`${JWT_ERROR.INVALID_JWT}: Could not decode JWT`);
  }

  const role = decoded.payload?.role;

  switch (role) {
    case 'platform-user':
      assertIsPKPSignedVincentJWT(decoded as DecodedJWT);
      return decoded as VincentJWTPlatformUser;
    case 'app-user':
      assertIsPKPSignedVincentJWT(decoded as DecodedJWT);
      return decoded as VincentJWTAppUser;
    case 'app-delegatee':
      return decoded as VincentJWTDelegatee;

    default:
      throw new Error(`${JWT_ERROR.INVALID_JWT}: Unrecognized role: ${role}`);
  }
}
