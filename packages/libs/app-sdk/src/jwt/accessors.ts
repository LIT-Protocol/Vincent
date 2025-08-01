import type { IRelayPKP } from '@lit-protocol/types';

import type { VincentJWT, VincentJWTAppSpecific } from './types';

import { isAppSpecificJWT } from './typeGuards';

export function getAppInfo(decodedJWT: VincentJWTAppSpecific): {
  appId: number;
  version: number;
} {
  if (!isAppSpecificJWT(decodedJWT)) {
    throw new Error('JWT is not app specific');
  }

  return { appId: decodedJWT.payload.app.id, version: decodedJWT.payload.app.version };
}

export function getPKPInfo(decodedJWT: VincentJWT): IRelayPKP {
  return decodedJWT.payload.pkp;
}
