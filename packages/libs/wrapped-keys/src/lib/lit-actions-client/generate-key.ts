import type { EvmContractConditions } from '@lit-protocol/types';

import type { GeneratePrivateKeyParams } from '../types';

import { postLitActionValidation } from './utils';

/**
 * Extended parameters for single key generation with Lit Actions
 * @extends GeneratePrivateKeyParams
 * @property {EvmContractConditions} evmContractConditions - The evm contract access control conditions that will gate decryption of the generated key
 * @property {string} litActionIpfsCid - IPFS CID of the Lit Action to execute
 */
interface GeneratePrivateKeyLitActionParams extends GeneratePrivateKeyParams {
  evmContractConditions: EvmContractConditions;
  litActionIpfsCid: string;
}

/**
 * Result structure for a generated encrypted private key
 * @property {string} ciphertext - The encrypted private key
 * @property {string} dataToEncryptHash - The hash of the encrypted data (used for decryption verification)
 * @property {string} publicKey - The public key of the generated keypair
 * @property {string} evmContractConditions - The evm contract access control conditions that will gate decryption of the generated key
 */
interface GeneratePrivateKeyLitActionResult {
  ciphertext: string;
  dataToEncryptHash: string;
  publicKey: string;
  evmContractConditions: string;
}

/**
 * Executes a Lit Action to generate a single encrypted private key for a Vincent delegator.
 *
 * This function directly invokes the Lit Action that generates a Solana keypair and encrypts
 * it with the provided evm contract access control conditions. The key is generated inside the secure
 * Lit Action environment and returned encrypted, ensuring the raw private key is never exposed.
 *
 * @param {GeneratePrivateKeyLitActionParams} params - Parameters for key generation including
 *   delegatee session signatures, evm contract access control conditions, and the delegator address
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
 *   delegatorAddress: '0x...',
 *   evmContractConditions: [...],
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
  evmContractConditions,
  delegatorAddress,
}: GeneratePrivateKeyLitActionParams): Promise<GeneratePrivateKeyLitActionResult> {
  const result = await litNodeClient.executeJs({
    useSingleNode: true,
    sessionSigs: delegateeSessionSigs,
    ipfsId: litActionIpfsCid,
    jsParams: {
      delegatorAddress,
      evmContractConditions,
    },
  });

  const response = postLitActionValidation(result);
  return JSON.parse(response);
}
