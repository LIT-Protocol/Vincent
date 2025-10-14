import type { GenerateEncryptedSolanaPrivateKeyParams } from '../../raw-action-functions/solana/generateEncryptedSolanaPrivateKey';

import { litActionHandler } from '../../litActionHandler';
import { generateEncryptedSolanaPrivateKey } from '../../raw-action-functions/solana/generateEncryptedSolanaPrivateKey';

// Using local declarations to avoid _every file_ thinking these are always in scope
declare const evmContractConditions: GenerateEncryptedSolanaPrivateKeyParams['evmContractConditions'];

(async () =>
  litActionHandler(async () =>
    generateEncryptedSolanaPrivateKey({
      evmContractConditions,
    }),
  ))();
