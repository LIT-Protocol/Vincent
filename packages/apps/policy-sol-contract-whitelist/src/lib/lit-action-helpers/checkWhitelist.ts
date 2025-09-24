import { Transaction, VersionedTransaction } from '@solana/web3.js';

import { extractProgramIds } from './extractProgramIds';

type AllowedClusters = 'devnet' | 'testnet' | 'mainnet-beta';

export function checkWhitelist({
  cluster,
  transaction,
  whitelist,
}: {
  cluster: AllowedClusters;
  transaction: Transaction | VersionedTransaction;
  whitelist: Partial<Record<AllowedClusters, string[]>>;
}):
  | {
      ok: true;
      whitelistedProgramIds: string[];
    }
  | {
      ok: false;
      reason: string;
      nonWhitelistedProgramIds?: string[];
    } {
  try {
    const clusterWhitelist = whitelist[cluster];
    if (!clusterWhitelist) {
      return {
        ok: false,
        reason: `Cluster: ${cluster} has no whitelisted program IDs`,
      };
    }

    const programIds = extractProgramIds(transaction);
    const nonWhitelistedProgramIds = programIds.filter(
      (programId) => !clusterWhitelist.includes(programId),
    );

    if (nonWhitelistedProgramIds.length > 0) {
      return {
        ok: false,
        reason: 'Transaction includes non-whitelisted program IDs',
        nonWhitelistedProgramIds,
      };
    }

    return {
      ok: true,
      whitelistedProgramIds: programIds,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
