import { toUtf8String } from 'ethers/lib/utils';

import type { DecodedJWT } from '../../types';

import { assertJWTAPIVersion } from '../../typeGuards';
import { fromBase64 } from './base64';

export function decodeJWT(jws: string): DecodedJWT {
  const parts = jws.match(/^([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)$/);
  if (parts) {
    const payload = JSON.parse(toUtf8String(fromBase64(parts[2])));
    assertJWTAPIVersion(payload.__vincentJWTApiVersion);

    return {
      header: JSON.parse(toUtf8String(fromBase64(parts[1]))),
      payload,
      signature: parts[3],
      data: `${parts[1]}.${parts[2]}`,
    };
  }

  throw new Error('invalid_argument: Incorrect format JWS');
}
