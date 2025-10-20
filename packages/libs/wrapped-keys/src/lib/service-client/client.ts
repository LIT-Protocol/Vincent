import type {
  StoredKeyData,
  StoredKeyMetadata,
  StoreEncryptedKeyBatchResult,
  StoreEncryptedKeyResult,
} from '../types';
import type { FetchKeyParams, ListKeysParams, StoreKeyBatchParams, StoreKeyParams } from './types';

import { generateRequestId, getBaseRequestParams, makeRequest } from './utils';

/** Fetches previously stored private key metadata from the Vincent wrapped keys service.
 * Note that this list will not include `ciphertext` or `dataToEncryptHash` necessary to decrypt the keys.
 * Use `fetchPrivateKey()` to get those values.
 *
 * @param { ListKeysParams } params Parameters required to fetch the private key metadata
 * @returns { Promise<StoredKeyMetadata[]> } The private key metadata objects
 */
export async function listPrivateKeyMetadata(params: ListKeysParams): Promise<StoredKeyMetadata[]> {
  const { litNetwork, jwtToken, delegatorAddress } = params;

  const requestId = generateRequestId();
  const { baseUrl, initParams } = getBaseRequestParams({
    litNetwork,
    jwtToken,
    method: 'GET',
    requestId,
  });

  return makeRequest<StoredKeyMetadata[]>({
    url: `${baseUrl}/delegatee/encrypted/${delegatorAddress}`,
    init: initParams,
    requestId,
  });
}

/** Fetches complete previously stored private key data from the Vincent wrapped keys service.
 * Includes the `ciphertext` and `dataToEncryptHash` necessary to decrypt the key.
 *
 * @param { FetchKeyParams } params Parameters required to fetch the private key data
 * @returns { Promise<StoredKeyData> } The private key data object
 */
export async function fetchPrivateKey(params: FetchKeyParams): Promise<StoredKeyData> {
  const { litNetwork, jwtToken, id, delegatorAddress } = params;

  const requestId = generateRequestId();
  const { baseUrl, initParams } = getBaseRequestParams({
    litNetwork,
    jwtToken,
    method: 'GET',
    requestId,
  });

  return makeRequest<StoredKeyData>({
    url: `${baseUrl}/delegatee/encrypted/${delegatorAddress}/${id}`,
    init: initParams,
    requestId,
  });
}

/** Stores private key metadata into the Vincent wrapped keys service backend
 *
 * @param { StoreKeyParams } params Parameters required to store the private key metadata
 * @returns { Promise<StoreEncryptedKeyResult> } Result with id and Vincent wallet address on successful write to the service.
 */
export async function storePrivateKey(params: StoreKeyParams): Promise<StoreEncryptedKeyResult> {
  const { litNetwork, jwtToken, storedKeyMetadata } = params;

  const requestId = generateRequestId();
  const { baseUrl, initParams } = getBaseRequestParams({
    litNetwork,
    jwtToken,
    method: 'POST',
    requestId,
  });

  const { pkpAddress, id } = await makeRequest<StoreEncryptedKeyResult>({
    url: `${baseUrl}/delegatee/encrypted`,
    init: {
      ...initParams,
      body: JSON.stringify(storedKeyMetadata),
    },
    requestId,
  });

  return { pkpAddress, id };
}

/** Stores a batch of up to 25 private key metadata into the Vincent wrapped keys service backend
 *
 * @param { StoreKeyBatchParams } params Parameters required to store the private key metadata batch
 * @returns { Promise<StoreEncryptedKeyBatchResult> } Result with ids and Vincent wallet address on successful write to the service.
 */
export async function storePrivateKeyBatch(
  params: StoreKeyBatchParams,
): Promise<StoreEncryptedKeyBatchResult> {
  const { litNetwork, jwtToken, storedKeyMetadataBatch } = params;

  const requestId = generateRequestId();
  const { baseUrl, initParams } = getBaseRequestParams({
    litNetwork,
    jwtToken,
    method: 'POST',
    requestId,
  });

  const { pkpAddress, ids } = await makeRequest<StoreEncryptedKeyBatchResult>({
    url: `${baseUrl}/delegatee/encrypted_batch`,
    init: {
      ...initParams,
      body: JSON.stringify({ keyParamsBatch: storedKeyMetadataBatch }),
    },
    requestId,
  });

  return { pkpAddress, ids };
}
