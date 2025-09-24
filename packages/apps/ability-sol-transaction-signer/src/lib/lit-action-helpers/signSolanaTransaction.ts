import { Transaction, VersionedTransaction, Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';

export function signSolanaTransaction({
  solanaKeypair,
  transaction,
}: {
  solanaKeypair: Keypair;
  transaction: Transaction | VersionedTransaction;
}): string {
  try {
    if (transaction instanceof Transaction) {
      // Sign legacy transaction
      transaction.sign(solanaKeypair);

      if (!transaction.signature) {
        throw new Error('Transaction signature is null');
      }

      return ethers.utils.base58.encode(transaction.signature);
    } else {
      // Sign versioned transaction
      transaction.sign([solanaKeypair]);

      if (!transaction.signatures.length) {
        throw new Error('Transaction signature is null');
      }

      return ethers.utils.base58.encode(transaction.signatures[0]);
    }
  } catch (err: unknown) {
    const txTypeDesc =
      transaction instanceof Transaction ? 'legacy' : `versioned v${transaction.version}`;
    throw new Error(`When signing ${txTypeDesc} transaction - ${(err as Error).message}`);
  }
}
