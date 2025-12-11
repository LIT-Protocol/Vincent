import type { ILitNodeClient, SessionSigsMap } from '@lit-protocol/types';

/**
 * The network type that the wrapped key will be used on.
 */
export type Network = 'solana';
export type KeyType = 'ed25519';

/**
 * @extends ApiParamsSupportedNetworks
 */
export type GeneratePrivateKeyAction = ApiParamsSupportedNetworks & {
  generateKeyParams: { memo: string };
};

/** All API calls for the wrapped keys service require these arguments.
 *
 * @property jwtToken - The JWT token for authenticating with the Vincent wrapped keys storage service.
 * @property delegatorAddress - The Vincent delegator Wallet Address that the wrapped keys will be associated with.
 * @property litNodeClient - The Lit Node Client used for executing the Lit Action and identifying which wrapped keys backend service to communicate with.
 */
export interface BaseApiParams {
  jwtToken: string;
  delegatorAddress: string;
  litNodeClient: ILitNodeClient;
}

export interface ApiParamsSupportedNetworks {
  network: Network;
}

/**
 * @extends BaseApiParams
 * @property network The network for which the private key needs to be generated; keys are generated differently for different networks
 * @property memo A (typically) user-provided descriptor for the encrypted private key
 * @property delegatorSessionSigs - The Session Signatures produced by the Vincent delegator for authenticating with the Lit network to execute Lit Actions that decrypt or generate new keys
 */
export type GeneratePrivateKeyParams = BaseApiParams &
  ApiParamsSupportedNetworks & {
    delegatorSessionSigs: SessionSigsMap;
    memo: string;
  };

/**
 * @property delegatorAddress The Vincent delegator PKP address that is associated with the encrypted private key
 * @property generatedPublicKey The public key component of the newly generated keypair
 * @property id The unique identifier (UUID V4) of the encrypted private key
 */
export interface GeneratePrivateKeyResult {
  delegatorAddress: string;
  generatedPublicKey: string;
  id: string;
}

/**
 * @extends BaseApiParams
 * @property delegatorSessionSigs - The Session Signatures produced by the Vincent delegator for authenticating with the Lit network to execute Lit Actions that generate new keys
 */
export type BatchGeneratePrivateKeysParams = BaseApiParams & {
  delegatorSessionSigs: SessionSigsMap;
  actions: GeneratePrivateKeyAction[];
};

/** Result structure for individual actions in batch generate operations */
export interface BatchGeneratePrivateKeysActionResult {
  generateEncryptedPrivateKey: GeneratePrivateKeyResult & { memo: string };
}

/** Result structure for batch generate operations */
export interface BatchGeneratePrivateKeysResult {
  delegatorAddress: string;
  results: BatchGeneratePrivateKeysActionResult[];
}

/** Exporting a previously persisted key only requires valid pkpSessionSigs and a LIT Node Client instance configured for the appropriate network.
 *
 * @extends BaseApiParams
 * @property delegatorSessionSigs The Session Signatures produced by the Vincent delegator for authenticating with the Lit network to decrypt the encrypted wrapped key
 * @property id The unique identifier (UUID V4) of the encrypted private key
 */
export type ExportPrivateKeyParams = BaseApiParams & {
  delegatorSessionSigs: SessionSigsMap;
  id: string;
};

/** Includes the decrypted private key and metadata that was stored alongside it in the wrapped keys service
 *
 * @property decryptedPrivateKey The decrypted, plain text private key that was persisted to the wrapped keys service
 * @property delegatorAddress The LIT PKP Address that the key was linked to; this is derived from the provided pkpSessionSigs
 * @property publicKey The public key of the key being imported into the wrapped keys service
 * @property keyType The algorithm type of the key; this might be K256, ed25519, or other key formats.  The `keyType` will be included in the metadata returned from the wrapped keys service
 * @property memo A (typically) user-provided descriptor for the encrypted private key
 * @property id The unique identifier (UUID V4) of the encrypted private key
 * @property litNetwork The Lit network that the client who stored the key was connected to
 */
export interface ExportPrivateKeyResult {
  delegatorAddress: string;
  decryptedPrivateKey: string;
  publicKey: string;
  keyType: KeyType;
  memo: string;
  id: string;
  litNetwork: string;
}

/** Metadata for a key that has been stored, encrypted, on the wrapped keys backend service
 * Returned by `listPrivateKeyMetadata`; to get full stored key data including `ciphertext` and `dataToEncryptHash`
 * use `fetchPrivateKey()`
 *
 * @property publicKey The public key of the encrypted private key
 * @property delegatorAddress The Vincent delegator PKP address that is associated with the encrypted private key
 * @property keyType The type of key that was encrypted -- e.g. ed25519, K256, etc.
 * @property memo A (typically) user-provided descriptor for the encrypted private key
 * @property id The unique identifier (UUID V4) of the encrypted private key
 * @property litNetwork The LIT network that the client who stored the key was connected to
 */
export interface StoredKeyMetadata {
  publicKey: string;
  delegatorAddress: string;
  keyType: KeyType;
  litNetwork: string;
  memo: string;
  id: string;
}

/** Complete encrypted private key data, including the `ciphertext`, `dataToEncryptHash` and `vincentWalletAddress` necessary to decrypt the key
 *
 * @extends StoredKeyMetadata
 * @property ciphertext The base64 encoded, salted & encrypted private key
 * @property dataToEncryptHash SHA-256 of the ciphertext
 * @property delegatorAddress The Vincent delegator wallet address associated with the key
 * @property evmContractConditions The serialized evm contract access control conditions that will gate decryption of the generated key
 */
export interface StoredKeyData extends StoredKeyMetadata {
  ciphertext: string;
  dataToEncryptHash: string;
  delegatorAddress: string;
  evmContractConditions: string;
}

/** Result of storing a private key in the wrapped keys backend service
 * Includes the unique identifier which is necessary to get the encrypted ciphertext and dataToEncryptHash in the future
 *
 * @property delegatorAddress The Vincent delegator PKP address that the key was linked to
 * @property id The unique identifier (UUID V4) of the encrypted private key
 */
export interface StoreEncryptedKeyResult {
  id: string;
  delegatorAddress: string;
}

/** Result of storing a batch of private keys in the wrapped keys backend service
 * Includes an array of unique identifiers, which are necessary to get the encrypted ciphertext and dataToEncryptHash in the future
 *
 * @property delegatorAddress The Vincent delegator PKP address that the key was linked to
 * @property ids Array of the unique identifiers (UUID V4) of the encrypted private keys in the same order provided
 */
export interface StoreEncryptedKeyBatchResult {
  ids: string[];
  delegatorAddress: string;
}

/** Params for listing encrypted key matadata for a Vincent delegator
 */
export type ListEncryptedKeyMetadataParams = BaseApiParams;

/** Params for getting a specific encrypted key
 * @property id The unique identifier (UUID V4) of the encrypted private key to fetch
 */
export type GetEncryptedKeyDataParams = BaseApiParams & {
  id: string;
};

/** Params for storing a single encrypted private key to the wrapped keys backend service
 *
 * @property publicKey The public key of the encrypted private key
 * @property keyType The type of key that was encrypted
 * @property ciphertext The base64 encoded, salted & encrypted private key
 * @property dataToEncryptHash SHA-256 of the ciphertext
 * @property memo A (typically) user-provided descriptor for the encrypted private key
 * @property evmContractConditions The serialized evm contract access control conditions that will gate decryption of the generated key
 */
export type StoreEncryptedKeyParams = BaseApiParams & {
  publicKey: string;
  keyType: KeyType;
  ciphertext: string;
  dataToEncryptHash: string;
  memo: string;
  evmContractConditions: string;
};

/** Params for storing a batch of encrypted private keys to the wrapped keys backend service.
 *
 * @property keyBatch Array of encrypted private keys to store
 */
export type StoreEncryptedKeyBatchParams = BaseApiParams & {
  keyBatch: Array<{
    publicKey: string;
    keyType: KeyType;
    ciphertext: string;
    dataToEncryptHash: string;
    memo: string;
    evmContractConditions: string;
  }>;
};
