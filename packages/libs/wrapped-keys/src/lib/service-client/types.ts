import type { LIT_NETWORK_VALUES } from '@lit-protocol/constants';
import type { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

import type { StoredKeyData } from '../types';

/**
 * Base parameters required for all Vincent wrapped keys service API calls.
 *
 * @interface BaseApiParams
 * @property jwtToken - JWT token for Vincent delegatee authentication with the wrapped keys service
 * @property litNetwork - The Lit network being used
 */
interface BaseApiParams {
  jwtToken: string;
  litNetwork: LIT_NETWORK_VALUES;
}

/**
 * Parameters for fetching a specific encrypted private key from the Vincent wrapped keys service.
 *
 * @property delegatorAddress - The Vincent Agent Wallet address associated with the key
 * @property id - The unique identifier (UUID v4) of the encrypted private key to fetch
 */
export type FetchKeyParams = BaseApiParams & {
  delegatorAddress: string;
  id: string;
};

/**
 * Parameters for listing all encrypted private key metadata for a Vincent Agent Wallet.
 *
 * @property delegatorAddress - The Vincent Agent Wallet address to list keys for
 */
export type ListKeysParams = BaseApiParams & {
  delegatorAddress: string;
};

/**
 * Supported Lit networks for Vincent wrapped keys operations.
 * Vincent only supports production 'datil' network, not test networks.
 */
export type SupportedNetworks = Extract<LIT_NETWORK_VALUES, 'datil'>;

/**
 * Parameters for storing a single encrypted private key to the Vincent wrapped keys service.
 *
 * @interface StoreKeyParams
 * @extends BaseApiParams
 * @property storedKeyMetadata - The encrypted key metadata to store
 * @property storedKeyMetadata.publicKey - The public key of the encrypted keypair
 * @property storedKeyMetadata.keyType - The type of key (e.g., 'ed25519' for Solana)
 * @property storedKeyMetadata.dataToEncryptHash - SHA-256 hash of the ciphertext for verification
 * @property storedKeyMetadata.ciphertext - The base64 encoded, encrypted private key
 * @property storedKeyMetadata.memo - User-visible descriptor for the key
 * @property storedKeyMetadata.delegatorAddress - The Vincent delegator wallet address associated with the key
 * @property storedKeyMetadata.evmContractConditions - The serialized evm contract access control conditions that will gate decryption of the generated key
 */
export interface StoreKeyParams extends BaseApiParams {
  storedKeyMetadata: Pick<
    StoredKeyData,
    | 'publicKey'
    | 'keyType'
    | 'dataToEncryptHash'
    | 'ciphertext'
    | 'memo'
    | 'delegatorAddress'
    | 'evmContractConditions'
  >;
}

/**
 * Parameters for storing multiple encrypted private keys in batch to the Vincent wrapped keys service.
 * Supports up to 25 keys per batch operation.
 *
 * @interface StoreKeyBatchParams
 * @extends BaseApiParams
 * @property storedKeyMetadataBatch - Array of encrypted key metadata to store
 * @property storedKeyMetadataBatch[].publicKey - The public key of the encrypted keypair
 * @property storedKeyMetadataBatch[].keyType - The type of key (e.g., 'ed25519' for Solana)
 * @property storedKeyMetadataBatch[].dataToEncryptHash - SHA-256 hash of the ciphertext for verification
 * @property storedKeyMetadataBatch[].ciphertext - The base64 encoded, encrypted private key
 * @property storedKeyMetadataBatch[].memo - User-provided descriptor for the key
 * @property storedKeyMetadataBatch[].delegatorAddress - The Vincent delegator wallet address associated with the key
 * @property storedKeyMetadataBatch[].evmContractConditions - The serialized evm contract access control conditions that will gate decryption of the generated key
 */
export interface StoreKeyBatchParams extends BaseApiParams {
  storedKeyMetadataBatch: Pick<
    StoredKeyData,
    | 'publicKey'
    | 'keyType'
    | 'dataToEncryptHash'
    | 'ciphertext'
    | 'memo'
    | 'delegatorAddress'
    | 'evmContractConditions'
  >[];
}

/**
 * Internal parameters for constructing HTTP requests to the Vincent wrapped keys service.
 * Used by utility functions to build authenticated requests.
 *
 * @interface BaseRequestParams
 * @property jwtToken - JWT token for Vincent delegatee authentication
 * @property method - HTTP method for the request
 * @property litNetwork - The Lit network identifier for routing
 * @property requestId - Unique identifier for request tracking and debugging
 */
export interface BaseRequestParams {
  jwtToken: string;
  method: 'GET' | 'POST';
  litNetwork: LIT_NETWORKS_KEYS;
  requestId: string;
}
