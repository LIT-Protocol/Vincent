import { Transaction, VersionedTransaction, Connection } from '@solana/web3.js';

export async function verifyBlockhashForCluster({
  transaction,
  cluster,
  rpcUrl,
}: {
  transaction: Transaction | VersionedTransaction;
  cluster: string;
  rpcUrl: string;
}): Promise<{ valid: true } | { valid: false; error: string }> {
  // Extract blockhash from the transaction based on version
  let blockhash: string | undefined;

  if (transaction instanceof Transaction) {
    blockhash = transaction.recentBlockhash ?? transaction.compileMessage().recentBlockhash;
  } else {
    blockhash = (transaction as VersionedTransaction).message.recentBlockhash;
  }

  if (!blockhash) {
    return {
      valid: false,
      error: 'Transaction does not contain a blockhash',
    };
  }

  // Verify the blockhash is valid for the specified cluster
  const connection = new Connection(rpcUrl, 'confirmed');
  try {
    const isValid = await connection.isBlockhashValid(blockhash);
    if (!isValid.value) {
      return {
        valid: false,
        error: `Blockhash is not valid for cluster ${cluster}. The transaction may be for a different cluster or the blockhash may have expired.`,
      };
    }
    return { valid: true };
  } catch (err) {
    // If we can't verify the blockhash, it's likely invalid for this cluster
    return {
      valid: false,
      error: `Unable to verify blockhash on cluster ${cluster}: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
