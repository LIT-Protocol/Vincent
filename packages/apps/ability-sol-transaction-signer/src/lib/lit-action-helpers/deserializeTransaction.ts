import { Transaction, VersionedTransaction } from '@solana/web3.js';

export function deserializeTransaction(
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
