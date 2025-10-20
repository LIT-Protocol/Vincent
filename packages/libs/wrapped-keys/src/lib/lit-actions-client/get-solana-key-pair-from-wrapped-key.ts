import { Keypair } from '@solana/web3.js';

import type { LitNamespace } from '../Lit';

import { getVincentRegistryAccessControlCondition } from '../api/utils';
import { LIT_PREFIX } from '../constants';

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
  delegatorAddress,
  ciphertext,
  dataToEncryptHash,
}: {
  delegatorAddress: string;
  ciphertext: string;
  dataToEncryptHash: string;
}): Promise<Keypair> {
  const accessControlConditions = [
    await getVincentRegistryAccessControlCondition({
      delegatorAddress,
    }),
  ];

  const decryptedPrivateKey = await Lit.Actions.decryptAndCombine({
    accessControlConditions,
    ciphertext,
    dataToEncryptHash,
    chain: 'ethereum',
    authSig: null,
  });

  if (!decryptedPrivateKey.startsWith(LIT_PREFIX)) {
    throw new Error(
      `Private key was not encrypted with salt; all wrapped keys must be prefixed with '${LIT_PREFIX}'`,
    );
  }

  const noSaltPrivateKey = decryptedPrivateKey.slice(LIT_PREFIX.length);
  const solanaKeypair = Keypair.fromSecretKey(Buffer.from(noSaltPrivateKey, 'hex'));

  return solanaKeypair;
}
