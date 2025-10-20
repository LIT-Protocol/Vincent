import type { ListEncryptedKeyMetadataParams, StoredKeyMetadata } from '../types';

import { listPrivateKeyMetadata } from '../service-client';

/**
 * Get list of metadata for previously encrypted and persisted private keys for Vincent delegators.
 * Note that this method does include the `ciphertext` or `dataToEncryptHash` values necessary to decrypt the keys.
 * To get those values, call `getEncryptedKey()` with the `id` for the appropriate key returned by this method.
 *
 * This function requires a JWT token for Vincent service authentication.
 *
 * @param { ListEncryptedKeyMetadataParams } params Parameters required to fetch the encrypted private key metadata
 * @returns { Promise<StoredKeyMetadata[]> } Array of encrypted private key metadata
 */
export async function listEncryptedKeyMetadata(
  params: ListEncryptedKeyMetadataParams,
): Promise<StoredKeyMetadata[]> {
  const { jwtToken, delegatorAddress, litNodeClient } = params;

  return listPrivateKeyMetadata({
    jwtToken,
    delegatorAddress,
    litNetwork: litNodeClient.config.litNetwork,
  });
}
