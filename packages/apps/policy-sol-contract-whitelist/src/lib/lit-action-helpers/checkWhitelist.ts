import { TransactionVersion } from '@solana/web3.js';

import { deserializeTransaction } from './deserializeTransaction';
import { extractProgramIds } from './extractProgramIds';

export function checkWhitelist({
  serializedTransaction,
  whitelist,
}: {
  serializedTransaction: string;
  whitelist: string[];
}):
  | {
      ok: true;
      programIds: string[];
      version: TransactionVersion;
    }
  | {
      ok: false;
      reason: string;
      programIds?: string[];
      version?: TransactionVersion;
    } {
  try {
    const { transaction, version } = deserializeTransaction(serializedTransaction);
    const programIds = extractProgramIds(transaction);

    // Use Set for O(1) whitelist lookups
    const whitelistSet = new Set(whitelist);
    const nonWhitelistedPrograms = programIds.filter((programId) => !whitelistSet.has(programId));

    if (nonWhitelistedPrograms.length > 0) {
      return {
        ok: false,
        reason: 'Program not whitelisted',
        programIds: nonWhitelistedPrograms,
        version,
      };
    }

    return {
      ok: true,
      programIds,
      version,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
