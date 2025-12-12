import { Transaction, VersionedTransaction } from '@solana/web3.js';

export function deserializeTransaction(
  serializedTransaction: string,
): Transaction | VersionedTransaction {
  const transactionBuffer = Buffer.from(serializedTransaction, 'base64');

  try {
    const versionedTransaction = VersionedTransaction.deserialize(transactionBuffer);
    console.log(
      `[deserializeTransaction] detected versioned transaction: ${versionedTransaction.version}`,
    );
    return versionedTransaction;
  } catch {
    // If VersionedTransaction.deserialize fails, try legacy format
    try {
      const legacyTransaction = Transaction.from(transactionBuffer);
      console.log(`[deserializeTransaction] detected legacy transaction`);
      return legacyTransaction;
    } catch (legacyError) {
      throw new Error(
        `Failed to deserialize transaction: ${legacyError instanceof Error ? legacyError.message : String(legacyError)}`,
      );
    }
  }
}
