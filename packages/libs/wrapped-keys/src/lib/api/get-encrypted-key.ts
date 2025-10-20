import type { GetEncryptedKeyDataParams, StoredKeyData } from '../types';

import { fetchPrivateKey } from '../service-client';

/**
 * Get a previously encrypted and persisted private key and its metadata for Vincent delegators.
 * Note that this method does _not_ decrypt the private key; only the _encrypted_ key and its metadata will be returned to the caller.
 *
 * This function requires a JWT token for Vincent service authentication.
 *
 * @param { GetEncryptedKeyDataParams } params Parameters required to fetch the encrypted private key metadata
 * @returns { Promise<StoredKeyData> } The encrypted private key and its associated metadata
 */
export async function getEncryptedKey(params: GetEncryptedKeyDataParams): Promise<StoredKeyData> {
  const { jwtToken, delegatorAddress, litNodeClient, id } = params;

  return fetchPrivateKey({
    jwtToken,
    delegatorAddress,
    id,
    litNetwork: litNodeClient.config.litNetwork,
  });
}
