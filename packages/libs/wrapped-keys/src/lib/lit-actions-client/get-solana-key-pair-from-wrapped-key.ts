import { Keypair } from '@solana/web3.js';

import type { LitNamespace } from '../Lit';

import { removeSaltFromDecryptedKey } from '../utils';

declare const Lit: typeof LitNamespace;

/**
 * Helper function to decrypt a Vincent Solana Wrapped Key and initialize a Solana Keypair.
 *
 * @param delegatorAddress - The PKP ethereum address of the vincent delegator
 * @param ciphertext - The encrypted wrapped key
 * @param dataToEncryptHash - Hash of the encrypted data
 * @returns A Solana Keypair instance
 * @throws Error if the decrypted private key is not prefixed with 'lit_' or if decryption fails
 */
export async function getSolanaKeyPairFromWrappedKey({
  ciphertext,
  dataToEncryptHash,
  evmContractConditions,
}: {
  delegatorAddress: string;
  ciphertext: string;
  dataToEncryptHash: string;
  evmContractConditions: any[];
}): Promise<Keypair> {
  const decryptedPrivateKey = await Lit.Actions.decryptAndCombine({
    accessControlConditions: evmContractConditions,
    ciphertext,
    dataToEncryptHash,
    chain: 'ethereum',
    authSig: null,
  });

  const noSaltPrivateKey = removeSaltFromDecryptedKey(decryptedPrivateKey);
  const solanaKeypair = Keypair.fromSecretKey(Buffer.from(noSaltPrivateKey, 'hex'));

  return solanaKeypair;
}
