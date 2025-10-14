import { encryptPrivateKey } from '../../internal/common/encryptKey';
import { generateSolanaPrivateKey } from '../../internal/solana/generatePrivateKey';

/**
 * Bundles solana/web3.js package as it's required to generate a random Solana key and only allows the provided PKP to decrypt it
 *
 * @param {string} evmContractConditions - The evm contract access control condition that allows only the pkpAddress to decrypt the Wrapped Key
 *
 * @returns { Promise<{ciphertext: string, dataToEncryptHash: string, publicKey: string}> } - Returns JSON object with ciphertext & dataToEncryptHash which are the result of the encryption. Also returns the publicKey of the newly generated Solana Wrapped Key.
 */
export interface GenerateEncryptedSolanaPrivateKeyParams {
  evmContractConditions: string;
}

export async function generateEncryptedSolanaPrivateKey({
  evmContractConditions,
}: GenerateEncryptedSolanaPrivateKeyParams): Promise<{
  ciphertext: string;
  dataToEncryptHash: string;
  publicKey: string;
  evmContractConditions: string;
}> {
  const { privateKey, publicKey } = generateSolanaPrivateKey();

  return encryptPrivateKey({
    evmContractConditions,
    publicKey,
    privateKey,
  });
}
