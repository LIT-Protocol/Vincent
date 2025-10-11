import type { StoreKeyBatchParams } from '../service-client/types';
import type {
  StoreEncryptedKeyBatchParams,
  StoreEncryptedKeyBatchResult,
  StoredKeyData,
} from '../types';

import { storePrivateKeyBatch } from '../service-client';

/**
 * Stores a batch of encrypted private keys and their metadata to the Vincent wrapped keys backend service.
 *
 * This function requires a JWT token for Vincent service authentication.
 *
 * @param { StoreEncryptedKeyBatchParams } params Parameters required to store the batch of encrypted private key metadata
 * @returns { Promise<StoreEncryptedKeyBatchResult> } The result containing unique identifiers for the stored keys
 */
export async function storeEncryptedKeyBatch(
  params: StoreEncryptedKeyBatchParams,
): Promise<StoreEncryptedKeyBatchResult> {
  const { jwtToken, litNodeClient, keyBatch, delegatorAddress } = params;

  const storedKeyMetadataBatch: StoreKeyBatchParams['storedKeyMetadataBatch'] = keyBatch.map(
    ({
      keyType,
      publicKey,
      memo,
      dataToEncryptHash,
      ciphertext,
      accessControlConditions,
    }): Pick<
      StoredKeyData,
      | 'publicKey'
      | 'keyType'
      | 'dataToEncryptHash'
      | 'ciphertext'
      | 'memo'
      | 'delegatorAddress'
      | 'accessControlConditions'
    > => ({
      publicKey,
      memo,
      dataToEncryptHash,
      ciphertext,
      keyType,
      delegatorAddress,
      accessControlConditions,
    }),
  );

  return storePrivateKeyBatch({
    storedKeyMetadataBatch,
    jwtToken,
    litNetwork: litNodeClient.config.litNetwork,
  });
}
