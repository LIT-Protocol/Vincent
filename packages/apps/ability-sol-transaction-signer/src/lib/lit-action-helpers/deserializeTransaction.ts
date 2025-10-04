import { Transaction, VersionedTransaction } from '@solana/web3.js';

export function deserializeTransaction(
  serializedTransaction: string,
): Transaction | VersionedTransaction {
  const transactionBuffer = Buffer.from(serializedTransaction, 'base64');

  // Try legacy format first, as it's more restrictive and preserves intended behavior
  try {
    const legacyTransaction = Transaction.from(transactionBuffer);
    console.log(`[deserializeTransaction] detected legacy transaction`);
    return legacyTransaction;
  } catch {
    // If legacy Transaction.from fails, try versioned format
    try {
      const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer);
      console.log(
        `[deserializeTransaction] detected versioned transaction: ${versionedTransaction.version}`,
      );
      return versionedTransaction;
    } catch (versionedError) {
      throw new Error(
        `Failed to deserialize transaction: ${versionedError instanceof Error ? versionedError.message : String(versionedError)}`,
      );
    }
  }
}
