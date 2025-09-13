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
  const { jwtToken, agentWalletAddress, litNodeClient, keyBatch } = params;

  const storedKeyMetadataBatch: StoreKeyBatchParams['storedKeyMetadataBatch'] = keyBatch.map(
    ({
      keyType,
      publicKey,
      memo,
      dataToEncryptHash,
      ciphertext,
    }): Pick<
      StoredKeyData,
      'publicKey' | 'keyType' | 'dataToEncryptHash' | 'ciphertext' | 'memo'
    > => ({
      publicKey,
      memo,
      dataToEncryptHash,
      ciphertext,
      keyType,
    }),
  );

  return storePrivateKeyBatch({
    storedKeyMetadataBatch,
    jwtToken,
    litNetwork: litNodeClient.config.litNetwork,
  });
}
