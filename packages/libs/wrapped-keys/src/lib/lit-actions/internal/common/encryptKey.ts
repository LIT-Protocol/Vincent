import type { LitNamespace } from '../../../Lit';

import { LIT_PREFIX } from '../../../constants';

declare const Lit: typeof LitNamespace;

/**
 * @private
 * @returns { Promise<{ciphertext: string, dataToEncryptHash: string, publicKey: string, accessControlConditions: string}> } - The ciphertext & dataToEncryptHash which are the result of the encryption, the publicKey of the newly generated Wrapped Key, and the access control conditions used for encryption.
 */
export async function encryptPrivateKey({
  accessControlConditions,
  privateKey,
  publicKey,
}: {
  accessControlConditions: string;
  privateKey: string;
  publicKey: string;
}): Promise<{
  ciphertext: string;
  dataToEncryptHash: string;
  publicKey: string;
  accessControlConditions: string;
}> {
  const { ciphertext, dataToEncryptHash } = await Lit.Actions.encrypt({
    accessControlConditions,
    to_encrypt: new TextEncoder().encode(LIT_PREFIX + privateKey),
  });

  return {
    ciphertext,
    dataToEncryptHash,
    publicKey,
    accessControlConditions,
  };
}
