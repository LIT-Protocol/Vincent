import { batchGenerateEncryptedKeys } from './common/batchGenerateEncryptedKeys';
import { generateEncryptedSolanaPrivateKey } from './solana/generateEncryptedSolanaPrivateKey';

export const rawActionFunctions = {
  batchGenerateEncryptedKeys,
  generateEncryptedSolanaPrivateKey,
};
