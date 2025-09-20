import { Transaction, VersionedTransaction, Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';

export function signSolanaTransaction({
  solanaKeypair,
  transaction,
  versionedTransaction,
}: {
  solanaKeypair: Keypair;
  transaction: Transaction | VersionedTransaction;
  versionedTransaction?: boolean;
}): string {
  try {
    if (versionedTransaction && transaction instanceof VersionedTransaction) {
      // Sign versioned transaction
      transaction.sign([solanaKeypair]);

      if (!transaction.signatures.length) {
        throw new Error('Transaction signature is null');
      }

      return ethers.utils.base58.encode(transaction.signatures[0]);
    } else if (transaction instanceof Transaction) {
      // Sign legacy transaction
      transaction.sign(solanaKeypair);

      if (!transaction.signature) {
        throw new Error('Transaction signature is null');
      }

      return ethers.utils.base58.encode(transaction.signature);
    } else {
      throw new Error('Invalid transaction type');
    }
  } catch (err: unknown) {
    const transactionType = versionedTransaction ? 'versioned' : 'legacy';
    throw new Error(`When signing ${transactionType} transaction - ${(err as Error).message}`);
  }
}
