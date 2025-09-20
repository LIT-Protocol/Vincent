import type { LIT_NETWORK_VALUES } from '@lit-protocol/constants';
import type { LIT_NETWORKS_KEYS } from '@lit-protocol/types';

import type { StoredKeyData } from '../types';

/**
 * Base parameters required for all Vincent wrapped keys service API calls.
 *
 * @interface BaseApiParams
 * @property {string} jwtToken - JWT token for Vincent delegatee authentication with the wrapped keys service
 * @property {LIT_NETWORK_VALUES} litNetwork - The Lit network being used
 */
interface BaseApiParams {
  jwtToken: string;
  litNetwork: LIT_NETWORK_VALUES;
}

/**
 * Parameters for fetching a specific encrypted private key from the Vincent wrapped keys service.
 *
 * @typedef {BaseApiParams & Object} FetchKeyParams
 * @property {string} agentWalletAddress - The Vincent Agent Wallet address associated with the key
 * @property {string} id - The unique identifier (UUID v4) of the encrypted private key to fetch
 */
export type FetchKeyParams = BaseApiParams & {
  agentWalletAddress: string;
  id: string;
};

/**
 * Parameters for listing all encrypted private key metadata for a Vincent Agent Wallet.
 *
 * @typedef {BaseApiParams & Object} ListKeysParams
 * @property {string} agentWalletAddress - The Vincent Agent Wallet address to list keys for
 */
export type ListKeysParams = BaseApiParams & {
  agentWalletAddress: string;
};

/**
 * Supported Lit networks for Vincent wrapped keys operations.
 * Vincent only supports production 'datil' network, not test networks.
 *
 * @typedef {'datil'} SupportedNetworks
 */
export type SupportedNetworks = Extract<LIT_NETWORK_VALUES, 'datil'>;

/**
 * Parameters for storing a single encrypted private key to the Vincent wrapped keys service.
 *
 * @interface StoreKeyParams
 * @extends BaseApiParams
 * @property {Object} storedKeyMetadata - The encrypted key metadata to store
 * @property {string} storedKeyMetadata.publicKey - The public key of the encrypted keypair
 * @property {string} storedKeyMetadata.keyType - The type of key (e.g., 'ed25519' for Solana)
 * @property {string} storedKeyMetadata.dataToEncryptHash - SHA-256 hash of the ciphertext for verification
 * @property {string} storedKeyMetadata.ciphertext - The base64 encoded, encrypted private key
 * @property {string} storedKeyMetadata.memo - User-provided descriptor for the key
 */
export interface StoreKeyParams extends BaseApiParams {
  storedKeyMetadata: Pick<
    StoredKeyData,
    'publicKey' | 'keyType' | 'dataToEncryptHash' | 'ciphertext' | 'memo'
  >;
}

/**
 * Parameters for storing multiple encrypted private keys in batch to the Vincent wrapped keys service.
 * Supports up to 25 keys per batch operation.
 *
 * @interface StoreKeyBatchParams
 * @extends BaseApiParams
 * @property {Array} storedKeyMetadataBatch - Array of encrypted key metadata to store
 * @property {string} storedKeyMetadataBatch[].publicKey - The public key of the encrypted keypair
 * @property {string} storedKeyMetadataBatch[].keyType - The type of key (e.g., 'ed25519' for Solana)
 * @property {string} storedKeyMetadataBatch[].dataToEncryptHash - SHA-256 hash of the ciphertext for verification
 * @property {string} storedKeyMetadataBatch[].ciphertext - The base64 encoded, encrypted private key
 * @property {string} storedKeyMetadataBatch[].memo - User-provided descriptor for the key
 */
export interface StoreKeyBatchParams extends BaseApiParams {
  storedKeyMetadataBatch: Pick<
    StoredKeyData,
    'publicKey' | 'keyType' | 'dataToEncryptHash' | 'ciphertext' | 'memo'
  >[];
}

/**
 * Internal parameters for constructing HTTP requests to the Vincent wrapped keys service.
 * Used by utility functions to build authenticated requests.
 *
 * @interface BaseRequestParams
 * @property {string} jwtToken - JWT token for Vincent delegatee authentication
 * @property {'GET' | 'POST'} method - HTTP method for the request
 * @property {LIT_NETWORKS_KEYS} litNetwork - The Lit network identifier for routing
 * @property {string} requestId - Unique identifier for request tracking and debugging
 */
export interface BaseRequestParams {
  jwtToken: string;
  method: 'GET' | 'POST';
  litNetwork: LIT_NETWORKS_KEYS;
  requestId: string;
}
