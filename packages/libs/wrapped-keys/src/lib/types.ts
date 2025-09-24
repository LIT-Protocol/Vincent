import type { ILitNodeClient, SessionSigsMap } from '@lit-protocol/types';

/** @typedef Network
 * The network type that the wrapped key will be used on.
 */
export type Network = 'solana';
export type KeyType = 'ed25519';

/** @typedef GeneratePrivateKeyAction
 * @extends ApiParamsSupportedNetworks
 */
export type GeneratePrivateKeyAction = ApiParamsSupportedNetworks & {
  generateKeyParams: { memo: string };
  signMessageParams?: { messageToSign: string | Uint8Array };
};

/** All API calls for the wrapped keys service require these arguments.
 *
 * @typedef BaseApiParams
 * @property {SessionSigsMap} delegateeSessionSigs - The Session Signatures produced by the Vincent Delegatee for authenticating with the Lit network to execute Lit Actions and decrypt keys.
 * @property {string} jwtToken - The JWT token from the Vincent Delegatee for authenticating with the Vincent wrapped keys service lambdas.
 * @property {string} agentWalletAddress - The Vincent Agent Wallet Address that the wrapped keys will be associated with.
 * @property {ILitNodeClient} litNodeClient - The Lit Node Client used for executing the Lit Action and identifying which wrapped keys backend service to communicate with.
 */
export interface BaseApiParams {
  delegateeSessionSigs: SessionSigsMap;
  jwtToken: string;
  agentWalletAddress: string;
  litNodeClient: ILitNodeClient;
}

export interface ApiParamsSupportedNetworks {
  network: Network;
}

/** @typedef GeneratePrivateKeyParams
 * @extends BaseApiParams
 * @property {Network} network The network for which the private key needs to be generated; keys are generated differently for different networks
 * @property { string } memo A (typically) user-provided descriptor for the encrypted private key
 */
export type GeneratePrivateKeyParams = BaseApiParams &
  ApiParamsSupportedNetworks & {
    memo: string;
  };

/** @typedef GeneratePrivateKeyResult
 * @property { string } agentWalletAddress The Vincent Agent Wallet Address that the key was linked to
 * @property { string } generatedPublicKey The public key component of the newly generated keypair
 * @property { string } id The unique identifier (UUID V4) of the encrypted private key
 */
export interface GeneratePrivateKeyResult {
  agentWalletAddress: string;
  generatedPublicKey: string;
  id: string;
}

/** @typedef BatchGeneratePrivateKeysParams
 * @extends BaseApiParams
 */
export type BatchGeneratePrivateKeysParams = BaseApiParams & {
  actions: GeneratePrivateKeyAction[];
};

/** Result structure for individual actions in batch generate operations */
export interface BatchGeneratePrivateKeysActionResult {
  generateEncryptedPrivateKey: GeneratePrivateKeyResult & { memo: string };
  signMessage?: { signature: string };
}

/** Result structure for batch generate operations */
export interface BatchGeneratePrivateKeysResult {
  agentWalletAddress: string;
  results: BatchGeneratePrivateKeysActionResult[];
}

/** Metadata for a key that has been stored, encrypted, on the wrapped keys backend service
 * Returned by `listPrivateKeyMetadata`; to get full stored key data including `ciphertext` and `dataToEncryptHash`
 * use `fetchPrivateKey()`
 *
 * @typedef StoredKeyMetadata
 * @property { string } publicKey The public key of the encrypted private key
 * @property { string } pkpAddress The Vincent Agent Wallet address that is associated with the encrypted private key
 * @property { string } keyType The type of key that was encrypted -- e.g. ed25519, K256, etc.
 * @property { string } memo A (typically) user-provided descriptor for the encrypted private key
 * @property { string } id The unique identifier (UUID V4) of the encrypted private key
 * @property { string } litNetwork The LIT network that the client who stored the key was connected to
 */
export interface StoredKeyMetadata {
  publicKey: string;
  pkpAddress: string;
  keyType: KeyType;
  litNetwork: string;
  memo: string;
  id: string;
}

/** Complete encrypted private key data, including the `ciphertext` and `dataToEncryptHash` necessary to decrypt the key
 *
 * @extends StoredKeyMetadata
 * @property { string } ciphertext The base64 encoded, salted & encrypted private key
 * @property { string } dataToEncryptHash SHA-256 of the ciphertext
 */
export interface StoredKeyData extends StoredKeyMetadata {
  ciphertext: string;
  dataToEncryptHash: string;
}

/** Result of storing a private key in the wrapped keys backend service
 * Includes the unique identifier which is necessary to get the encrypted ciphertext and dataToEncryptHash in the future
 *
 * @typedef StoreEncryptedKeyResult
 * @property { string } pkpAddress The Vincent Agent Wallet Address that the key was linked to
 * @property { string } id The unique identifier (UUID V4) of the encrypted private key
 */
export interface StoreEncryptedKeyResult {
  id: string;
  pkpAddress: string;
}

/** Result of storing a batch of private keys in the wrapped keys backend service
 * Includes an array of unique identifiers, which are necessary to get the encrypted ciphertext and dataToEncryptHash in the future
 *
 * @typedef StoreEncryptedKeyBatchResult
 * @property { string } pkpAddress The Vincent Agent Wallet Address that the key was linked to
 * @property { string[] } ids Array of the unique identifiers (UUID V4) of the encrypted private keys in the same order provided
 */
export interface StoreEncryptedKeyBatchResult {
  ids: string[];
  pkpAddress: string;
}

/** @typedef ListEncryptedKeyMetadataParams
 * @extends BaseApiParams
 */
export type ListEncryptedKeyMetadataParams = BaseApiParams;

/** @typedef GetEncryptedKeyDataParams
 * @extends BaseApiParams
 * @property { string } id The unique identifier (UUID V4) of the encrypted private key to fetch
 */
export type GetEncryptedKeyDataParams = BaseApiParams & {
  id: string;
};

/** @typedef StoreEncryptedKeyParams
 * @extends BaseApiParams
 * @property { string } publicKey The public key of the encrypted private key
 * @property { KeyType } keyType The type of key that was encrypted
 * @property { string } ciphertext The base64 encoded, salted & encrypted private key
 * @property { string } dataToEncryptHash SHA-256 of the ciphertext
 * @property { string } memo A (typically) user-provided descriptor for the encrypted private key
 */
export type StoreEncryptedKeyParams = BaseApiParams & {
  publicKey: string;
  keyType: KeyType;
  ciphertext: string;
  dataToEncryptHash: string;
  memo: string;
};

/** @typedef StoreEncryptedKeyBatchParams
 * @extends BaseApiParams
 * @property { Array } keyBatch Array of encrypted private keys to store
 */
export type StoreEncryptedKeyBatchParams = BaseApiParams & {
  keyBatch: Array<{
    publicKey: string;
    keyType: KeyType;
    ciphertext: string;
    dataToEncryptHash: string;
    memo: string;
  }>;
};
