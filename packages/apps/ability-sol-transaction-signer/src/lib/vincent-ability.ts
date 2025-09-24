import {
  createVincentAbility,
  supportedPoliciesForAbility,
  getSolanaKeyPairFromWrappedKey,
} from '@lit-protocol/vincent-ability-sdk';
import { clusterApiUrl, Transaction } from '@solana/web3.js';

import {
  executeFailSchema,
  executeSuccessSchema,
  precheckFailSchema,
  abilityParamsSchema,
} from './schemas';
import {
  signSolanaTransaction,
  deserializeTransaction,
  verifyBlockhashForCluster,
} from './lit-action-helpers';

declare const Lit: {
  Actions: {
    getRpcUrl: (params: { chain: string }) => Promise<string>;
  };
};

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
    const { serializedTransaction, cluster, rpcUrl } = abilityParams;

    if (!rpcUrl) {
      console.log(
        '[@lit-protocol/vincent-ability-sol-transaction-signer] rpcUrl not provided using @solana/web3.js default',
      );
    }

    try {
      const transaction = deserializeTransaction(serializedTransaction);

      // Verify blockhash matches the specified cluster
      const verification = await verifyBlockhashForCluster({
        transaction,
        cluster,
        rpcUrl: rpcUrl || clusterApiUrl(cluster),
      });
      if (!verification.valid) {
        return fail({
          error: `[@lit-protocol/vincent-ability-sol-transaction-signer] ${verification.error}`,
        });
      }

      return succeed();
    } catch (error) {
      return fail({
        error: `[@lit-protocol/vincent-ability-sol-transaction-signer] Failed to decode Solana transaction: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },

  execute: async ({ abilityParams }, { succeed, fail, delegation: { delegatorPkpInfo } }) => {
    const {
      serializedTransaction,
      cluster,
      ciphertext,
      dataToEncryptHash,
      legacyTransactionOptions,
    } = abilityParams;
    const { tokenId } = delegatorPkpInfo;

    try {
      const solanaKeypair = await getSolanaKeyPairFromWrappedKey({
        agentWalletPkpTokenId: tokenId,
        ciphertext,
        dataToEncryptHash,
      });

      const transaction = deserializeTransaction(serializedTransaction);

      const litChainIdentifier = {
        devnet: 'solanaDevnet',
        testnet: 'solanaTestnet',
        'mainnet-beta': 'solana',
      };

      // Verify blockhash is still valid for the specified cluster before signing
      const verification = await verifyBlockhashForCluster({
        transaction,
        cluster,
        rpcUrl: await Lit.Actions.getRpcUrl({ chain: litChainIdentifier[cluster] }),
      });
      if (!verification.valid) {
        return fail({
          error: `[@lit-protocol/vincent-ability-sol-transaction-signer] ${verification.error}`,
        });
      }

      signSolanaTransaction({
        solanaKeypair,
        transaction,
      });

      let signedSerializedTransaction: string;
      if (transaction instanceof Transaction) {
        if (!transaction.feePayer) transaction.feePayer = solanaKeypair.publicKey;

        signedSerializedTransaction = Buffer.from(
          transaction.serialize({
            requireAllSignatures: legacyTransactionOptions?.requireAllSignatures ?? true,
            verifySignatures: legacyTransactionOptions?.verifySignatures ?? false,
          }),
        ).toString('base64');
      } else {
        signedSerializedTransaction = Buffer.from(transaction.serialize()).toString('base64');
      }

      return succeed({
        signedTransaction: signedSerializedTransaction,
      });
    } catch (error) {
      return fail({
        error: `[@lit-protocol/vincent-ability-sol-transaction-signer] Failed to sign Solana transaction: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
