import type { AccessControlConditions } from '@lit-protocol/types';

import type { BatchGeneratePrivateKeysParams, Network } from '../types';

import { postLitActionValidation } from './utils';

/**
 * Extended parameters for batch key generation with Lit Actions
 * @extends BatchGeneratePrivateKeysParams
 * @property {AccessControlConditions} accessControlConditions - The access control conditions that will gate decryption of the generated keys
 * @property {string} litActionIpfsCid - IPFS CID of the Lit Action to execute
 */
interface BatchGeneratePrivateKeysWithLitActionParams extends BatchGeneratePrivateKeysParams {
  accessControlConditions: AccessControlConditions;
  litActionIpfsCid: string;
}

/**
 * Result structure for a single generated encrypted private key
 * @property {string} ciphertext - The encrypted private key
 * @property {string} dataToEncryptHash - The hash of the encrypted data (used for decryption verification)
 * @property {string} publicKey - The public key of the generated keypair
 * @property {string} memo - User-provided descriptor for the key
 */
interface GeneratePrivateKeyLitActionResult {
  ciphertext: string;
  dataToEncryptHash: string;
  publicKey: string;
  memo: string;
}

/**
 * Result structure for a single action in batch key generation
 * @property {Network} network - The network for which the key was generated ('solana' for Vincent)
 * @property {{ signature: string }} [signMessage] - Optional message signature if signing was requested
 * @property {GeneratePrivateKeyLitActionResult} generateEncryptedPrivateKey - The generated encrypted key data
 */
interface BatchGeneratePrivateKeysWithLitActionResult {
  network: Network;
  signMessage?: { signature: string };
  generateEncryptedPrivateKey: GeneratePrivateKeyLitActionResult;
}

/**
 * Executes a Lit Action to generate multiple encrypted private keys in batch for Vincent Agent Wallets.
 *
 * This function directly invokes the Lit Action that generates multiple Solana keypairs and encrypts
 * them with the provided access control conditions. The keys are generated inside the secure
 * Lit Action environment and returned encrypted, ensuring the raw private keys are never exposed.
 *
 * @param {BatchGeneratePrivateKeysWithLitActionParams} args - Parameters for batch key generation including
 *   delegatee session signatures, access control conditions, and actions specifying key generation details
 *
 * @returns {Promise<BatchGeneratePrivateKeysWithLitActionResult[]>} Array of results, one for each generated key,
 *   containing the encrypted private key, public key, and optional message signatures
 *
 * @throws {Error} If the Lit Action execution fails or returns invalid data
 */
export async function batchGenerateKeysWithLitAction(
  args: BatchGeneratePrivateKeysWithLitActionParams,
): Promise<BatchGeneratePrivateKeysWithLitActionResult[]> {
  const {
    accessControlConditions,
    litNodeClient,
    actions,
    delegateeSessionSigs,
    litActionIpfsCid,
  } = args;

  const result = await litNodeClient.executeJs({
    useSingleNode: true,
    sessionSigs: delegateeSessionSigs,
    ipfsId: litActionIpfsCid,
    jsParams: {
      actions,
      accessControlConditions,
    },
  });

  const response = postLitActionValidation(result);
  return JSON.parse(response);
}
