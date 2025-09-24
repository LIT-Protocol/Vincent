import {
  createVincentAbility,
  supportedPoliciesForAbility,
  getSolanaKeyPairFromWrappedKey,
} from '@lit-protocol/vincent-ability-sdk';
import type { Transaction, VersionedTransaction } from '@solana/web3.js';

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
    const { serializedTransaction } = abilityParams;

    try {
      deserializeTransaction(serializedTransaction);

      return succeed();
    } catch (error) {
      return fail({
        error: `Failed to decode Solana transaction: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const { serializedTransaction, ciphertext, dataToEncryptHash, legacyTransactionOptions } =
      abilityParams;
    const { tokenId } = delegatorPkpInfo;

    try {
      const solanaKeypair = await getSolanaKeyPairFromWrappedKey({
        agentWalletPkpTokenId: tokenId,
        ciphertext,
        dataToEncryptHash,
      });

      const { transaction, version } = deserializeTransaction(serializedTransaction);

      signSolanaTransaction({
        solanaKeypair,
        transaction,
        version,
      });

      let signedSerializedTransaction: string;
      if (version === 'legacy') {
        const legacyTx = transaction as Transaction;
        if (!legacyTx.feePayer) legacyTx.feePayer = solanaKeypair.publicKey;

        signedSerializedTransaction = Buffer.from(
          legacyTx.serialize({
            requireAllSignatures: legacyTransactionOptions?.requireAllSignatures ?? true,
            verifySignatures: legacyTransactionOptions?.verifySignatures ?? false,
          }),
        ).toString('base64');
      } else {
        const versionedTx = transaction as VersionedTransaction;
        signedSerializedTransaction = Buffer.from(versionedTx.serialize()).toString('base64');
      }

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
