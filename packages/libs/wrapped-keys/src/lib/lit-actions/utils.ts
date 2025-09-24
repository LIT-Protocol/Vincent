import { VINCENT_PREFIX } from '../constants';

export function removeSaltFromDecryptedKey(decryptedPrivateKey: string) {
  if (!decryptedPrivateKey.startsWith(VINCENT_PREFIX)) {
    throw new Error(
      `PKey was not encrypted with salt; all wrapped keys must be prefixed with '${VINCENT_PREFIX}'`,
    );
  }

  return decryptedPrivateKey.slice(VINCENT_PREFIX.length);
}
