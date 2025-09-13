import type { AccessControlConditions } from '@lit-protocol/types';

import type { GeneratePrivateKeyParams } from '../types';

import { postLitActionValidation } from './utils';

/**
 * Extended parameters for single key generation with Lit Actions
 * @extends GeneratePrivateKeyParams
 * @property {AccessControlConditions} accessControlConditions - The access control conditions that will gate decryption of the generated key
 * @property {string} litActionIpfsCid - IPFS CID of the Lit Action to execute
 */
interface GeneratePrivateKeyLitActionParams extends GeneratePrivateKeyParams {
  accessControlConditions: AccessControlConditions;
  litActionIpfsCid: string;
}

/**
 * Result structure for a generated encrypted private key
 * @property {string} ciphertext - The encrypted private key
 * @property {string} dataToEncryptHash - The hash of the encrypted data (used for decryption verification)
 * @property {string} publicKey - The public key of the generated keypair
 */
interface GeneratePrivateKeyLitActionResult {
  ciphertext: string;
  dataToEncryptHash: string;
  publicKey: string;
}

/**
 * Executes a Lit Action to generate a single encrypted private key for a Vincent Agent Wallet.
 *
 * This function directly invokes the Lit Action that generates a Solana keypair and encrypts
 * it with the provided access control conditions. The key is generated inside the secure
 * Lit Action environment and returned encrypted, ensuring the raw private key is never exposed.
 *
 * @param {GeneratePrivateKeyLitActionParams} params - Parameters for key generation including
 *   delegatee session signatures, access control conditions, and the agent wallet address
 *
 * @returns {Promise<GeneratePrivateKeyLitActionResult>} The generated encrypted private key data
 *   containing the ciphertext, dataToEncryptHash, and public key
 *
 * @throws {Error} If the Lit Action execution fails or returns invalid data
 *
 * @example
 * ```typescript
 * const result = await generateKeyWithLitAction({
 *   litNodeClient,
 *   delegateeSessionSigs,
 *   agentWalletAddress: '0x...',
 *   accessControlConditions: [...],
 *   litActionIpfsCid: 'Qm...',
 *   network: 'solana',
 *   memo: 'Trading wallet'
 * });
 * console.log('Generated public key:', result.publicKey);
 * ```
 */
export async function generateKeyWithLitAction({
  litNodeClient,
  delegateeSessionSigs,
  litActionIpfsCid,
  accessControlConditions,
  agentWalletAddress,
}: GeneratePrivateKeyLitActionParams): Promise<GeneratePrivateKeyLitActionResult> {
  const result = await litNodeClient.executeJs({
    useSingleNode: true,
    sessionSigs: delegateeSessionSigs,
    ipfsId: litActionIpfsCid,
    jsParams: {
      agentWalletAddress,
      accessControlConditions,
    },
  });

  const response = postLitActionValidation(result);
  return JSON.parse(response);
}
