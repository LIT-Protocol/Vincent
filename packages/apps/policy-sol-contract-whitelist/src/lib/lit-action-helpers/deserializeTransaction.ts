import { Transaction, VersionedTransaction, TransactionVersion } from '@solana/web3.js';

export function deserializeTransaction(serializedTransaction: string): {
  transaction: Transaction | VersionedTransaction;
  version: TransactionVersion;
} {
  const transactionBuffer = Buffer.from(serializedTransaction, 'base64');

  try {
    const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer);
    console.log(
      `[deserializeTransaction] detected versioned transaction: ${versionedTransaction.version}`,
    );
    return { transaction: versionedTransaction, version: versionedTransaction.version };
  } catch {
    // If VersionedTransaction.deserialize fails, try legacy format
    try {
      const legacyTransaction = Transaction.from(transactionBuffer);
      console.log(`[deserializeTransaction] detected legacy transaction`);
      return { transaction: legacyTransaction, version: 'legacy' };
    } catch (legacyError) {
      throw new Error(
        `Failed to deserialize transaction: ${legacyError instanceof Error ? legacyError.message : String(legacyError)}`,
      );
    }
  }
}
