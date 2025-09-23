import { createVincentPolicy } from '@lit-protocol/vincent-ability-sdk';
import { Transaction, VersionedTransaction } from '@solana/web3.js';

import {
  evalAllowResultSchema,
  evalDenyResultSchema,
  precheckAllowResultSchema,
  precheckDenyResultSchema,
  abilityParamsSchema,
  userParamsSchema,
} from './schemas';

function deserializeTransaction(
  serializedTransaction: string,
  versionedTransaction?: boolean,
): Transaction | VersionedTransaction {
  const transactionBuffer = Buffer.from(serializedTransaction, 'base64');

  if (versionedTransaction) {
    return VersionedTransaction.deserialize(transactionBuffer);
  } else {
    return Transaction.from(transactionBuffer);
  }
}

function extractProgramIds(transaction: Transaction | VersionedTransaction): {
  programIds: string[];
  requiresLookups: boolean;
} {
  const programIds = new Set<string>();

  if (transaction instanceof Transaction) {
    // Legacy transaction
    transaction.instructions.forEach((instruction) => {
      programIds.add(instruction.programId.toBase58());
    });
    return { programIds: Array.from(programIds), requiresLookups: false };
  }

  // Versioned transaction (v0)
  const message = transaction.message;
  const staticKeys = message.staticAccountKeys.map((key) => key.toBase58());
  let requiresLookups = false;

  message.compiledInstructions.forEach((instruction) => {
    const programIdIndex = instruction.programIdIndex;

    // In v0, programIdIndex is into the *combined* key space (static + looked-up).
    // If index exceeds staticKeys length, the programId came from a lookup table.
    if (programIdIndex >= staticKeys.length) {
      requiresLookups = true;
      return; // We can't resolve it without lookups
    }

    programIds.add(staticKeys[programIdIndex]);
  });

  return { programIds: Array.from(programIds), requiresLookups };
}

export const vincentPolicy = createVincentPolicy({
  packageName: '@lit-protocol/vincent-policy-sol-contract-whitelist' as const,

  abilityParamsSchema,
  userParamsSchema,

  precheckAllowResultSchema,
  precheckDenyResultSchema,

  evalAllowResultSchema,
  evalDenyResultSchema,

  precheck: async ({ abilityParams, userParams }, { allow, deny }) => {
    try {
      const { serializedTransaction, versionedTransaction } = abilityParams;
      const { whitelist } = userParams;

      const transaction = deserializeTransaction(serializedTransaction, versionedTransaction);
      const { programIds, requiresLookups } = extractProgramIds(transaction);

      // Fail closed if transaction requires address lookup tables
      if (requiresLookups) {
        return deny({
          reason: 'Address table lookups present; cannot validate program IDs offline',
        });
      }

      // Check if all program IDs are whitelisted
      const nonWhitelistedPrograms = programIds.filter(
        (programId) => !whitelist.includes(programId),
      );

      if (nonWhitelistedPrograms.length > 0) {
        return deny({
          reason: 'Program not whitelisted',
          programIds: nonWhitelistedPrograms,
        });
      }

      return allow({
        programIds,
      });
    } catch (error) {
      console.error('Precheck error:', error);
      return deny({
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },

  evaluate: async ({ abilityParams, userParams }, { allow, deny }) => {
    try {
      const { serializedTransaction, versionedTransaction } = abilityParams;
      const { whitelist } = userParams;

      const transaction = deserializeTransaction(serializedTransaction, versionedTransaction);
      const { programIds, requiresLookups } = extractProgramIds(transaction);

      // Fail closed if transaction requires address lookup tables
      if (requiresLookups) {
        return deny({
          reason: 'Address table lookups present; cannot validate program IDs offline',
        });
      }

      // Check if all program IDs are whitelisted
      const nonWhitelistedPrograms = programIds.filter(
        (programId) => !whitelist.includes(programId),
      );

      if (nonWhitelistedPrograms.length > 0) {
        return deny({
          reason: 'Program not whitelisted',
          programIds: nonWhitelistedPrograms,
        });
      }

      return allow({
        programIds,
      });
    } catch (error) {
      console.error('Evaluate error:', error);
      return deny({
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
});
