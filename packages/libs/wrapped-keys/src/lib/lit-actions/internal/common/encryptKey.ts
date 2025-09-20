import { VINCENT_PREFIX } from '../../constants';

/* global Lit */

/**
 * @private
 * @returns { Promise<{ciphertext: string, dataToEncryptHash: string, publicKey: string}> } - The ciphertext & dataToEncryptHash which are the result of the encryption, and the publicKey of the newly generated Wrapped Key.
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
}> {
  const { ciphertext, dataToEncryptHash } = await Lit.Actions.encrypt({
    accessControlConditions,
    to_encrypt: new TextEncoder().encode(VINCENT_PREFIX + privateKey),
  });

  return {
    ciphertext,
    dataToEncryptHash,
    publicKey,
  };
}
