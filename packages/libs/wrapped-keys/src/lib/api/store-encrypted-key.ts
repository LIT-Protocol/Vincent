import type { StoreEncryptedKeyParams, StoreEncryptedKeyResult } from '../types';

import { storePrivateKey } from '../service-client';

/**
 * Stores an encrypted private key and its metadata to the Vincent wrapped keys backend service.
 *
 * This function requires a JWT token for Vincent service authentication.
 *
 * @param { StoreEncryptedKeyParams } params Parameters required to store the encrypted private key metadata
 * @returns { Promise<StoreEncryptedKeyResult> } The result containing the unique identifier for the stored key
 */
export async function storeEncryptedKey(
  params: StoreEncryptedKeyParams,
): Promise<StoreEncryptedKeyResult> {
  const { jwtToken, litNodeClient } = params;

  const { publicKey, keyType, dataToEncryptHash, ciphertext, memo } = params;

  return storePrivateKey({
    storedKeyMetadata: {
      publicKey,
      keyType,
      dataToEncryptHash,
      ciphertext,
      memo,
    },
    jwtToken,
    litNetwork: litNodeClient.config.litNetwork,
  });
}
