/**
 * Supported Lit Action types for Vincent wrapped keys operations.
 *
 * Vincent supports only key generation operations, not signing or export operations.
 *
 * @typedef {'generateEncryptedKey' | 'batchGenerateEncryptedKeys'} LitActionType
 *
 * - `'generateEncryptedKey'` - Generates a single encrypted Solana private key
 * - `'batchGenerateEncryptedKeys'` - Generates multiple encrypted Solana private keys in batch
 */
export type LitActionType = 'generateEncryptedKey' | 'batchGenerateEncryptedKeys';
