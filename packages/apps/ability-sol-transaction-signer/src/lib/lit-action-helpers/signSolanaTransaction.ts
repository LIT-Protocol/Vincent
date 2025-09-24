import { Transaction, VersionedTransaction, Keypair, TransactionVersion } from '@solana/web3.js';
import { ethers } from 'ethers';

export function signSolanaTransaction({
  solanaKeypair,
  transaction,
  version,
}: {
  solanaKeypair: Keypair;
  transaction: Transaction | VersionedTransaction;
  version: TransactionVersion;
}): string {
  try {
    if (version === 'legacy') {
      if (!(transaction instanceof Transaction)) {
        throw new Error('Expected Transaction for legacy transaction');
      }
      // Sign legacy transaction
      transaction.sign(solanaKeypair);

      if (!transaction.signature) {
        throw new Error('Transaction signature is null');
      }

      return ethers.utils.base58.encode(transaction.signature);
    } else if (version === 0) {
      if (!(transaction instanceof VersionedTransaction)) {
        throw new Error('Expected VersionedTransaction for v0 transaction');
      }
      // Sign versioned transaction
      transaction.sign([solanaKeypair]);

      if (!transaction.signatures.length) {
        throw new Error('Transaction signature is null');
      }

      return ethers.utils.base58.encode(transaction.signatures[0]);
    } else {
      throw new Error(
        `Unsupported transaction version: ${version}. Only legacy and v0 transactions are supported`,
      );
    }
  } catch (err: unknown) {
    const txTypeDesc = version !== 'legacy' ? `versioned v${version}` : 'legacy';
    throw new Error(`When signing ${txTypeDesc} transaction - ${(err as Error).message}`);
  }
}
