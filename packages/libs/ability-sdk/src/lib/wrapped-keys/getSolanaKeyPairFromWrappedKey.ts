import { Keypair } from '@solana/web3.js';

import { api } from '@lit-protocol/vincent-wrapped-keys';
const { getVincentRegistryAccessControlCondition } = api;

declare const Lit: {
  Actions: {
    decryptAndCombine: (params: {
      accessControlConditions: any[];
      ciphertext: string;
      dataToEncryptHash: string;
      authSig: any;
      chain: string;
    }) => Promise<string>;
  };
};

/**
 * Helper function to decrypt a Vincent Solana Wrapped Key and initialize a Solana Keypair.
 *
 * @param agentWalletPkpTokenId - The PKP token ID of the vincent agent wallet
 * @param ciphertext - The encrypted wrapped key
 * @param dataToEncryptHash - Hash of the encrypted data
 * @returns A Solana Keypair instance
 * @throws Error if the decrypted private key is not prefixed with 'vincent_' or if decryption fails
 */
export async function getSolanaKeyPairFromWrappedKey({
  agentWalletPkpTokenId,
  ciphertext,
  dataToEncryptHash,
}: {
  agentWalletPkpTokenId: string;
  ciphertext: string;
  dataToEncryptHash: string;
}): Promise<Keypair> {
  const accessControlConditions = [
    await getVincentRegistryAccessControlCondition({
      agentWalletPkpTokenId,
    }),
  ];

  const decryptedPrivateKey = await Lit.Actions.decryptAndCombine({
    accessControlConditions,
    ciphertext,
    dataToEncryptHash,
    chain: 'ethereum',
    authSig: null,
  });

  const VINCENT_PREFIX = 'vincent_';
  if (!decryptedPrivateKey.startsWith(VINCENT_PREFIX)) {
    throw new Error(
      `Private key was not encrypted with salt; all wrapped keys must be prefixed with '${VINCENT_PREFIX}'`,
    );
  }

  const noSaltPrivateKey = decryptedPrivateKey.slice(VINCENT_PREFIX.length);
  const solanaKeypair = Keypair.fromSecretKey(Buffer.from(noSaltPrivateKey, 'hex'));

  return solanaKeypair;
}
