import {
  createVincentAbility,
  supportedPoliciesForAbility,
  getSolanaKeyPairFromWrappedKey,
} from '@lit-protocol/vincent-ability-sdk';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  abilityParamsSchema,
} from './schemas';
import { signSolanaTransaction, deserializeTransaction } from './lit-action-helpers';

export const vincentAbility = createVincentAbility({
  packageName: '@lit-protocol/vincent-ability-sol-transaction-signer' as const,
  abilityDescription:
    'Sign a Solana transaction using a Vincent Agent Wallet with encrypted private key.' as const,
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([]),

  precheckFailSchema,

  executeSuccessSchema,
  executeFailSchema,

  precheck: async ({ abilityParams }, { succeed, fail }) => {
    const { serializedTransaction, versionedTransaction } = abilityParams;

    try {
      deserializeTransaction(serializedTransaction, versionedTransaction);

      return succeed();
    } catch (error) {
      return fail({
        error: `Failed to decode Solana transaction: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const { serializedTransaction, ciphertext, dataToEncryptHash, versionedTransaction } =
      abilityParams;
    const { tokenId } = delegatorPkpInfo;

    try {
      const solanaKeypair = await getSolanaKeyPairFromWrappedKey({
        agentWalletPkpTokenId: tokenId,
        ciphertext,
        dataToEncryptHash,
      });

      const transaction = deserializeTransaction(serializedTransaction, versionedTransaction);
      signSolanaTransaction({
        solanaKeypair,
        transaction,
        versionedTransaction,
      });

      const signedSerializedTransaction = versionedTransaction
        ? Buffer.from(transaction.serialize()).toString('base64')
        : transaction.serialize().toString('base64');

      return succeed({
        signedTransaction: signedSerializedTransaction,
      });
    } catch (error) {
      return fail({
        error: `Failed to sign Solana transaction: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
