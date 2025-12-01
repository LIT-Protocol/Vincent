import {
  Cluster,
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

export const createSolanaVersionedTransferTransaction = async ({
  solanaCluster,
  from,
  to,
  lamports,
}: {
  from: PublicKey;
  to: PublicKey;
  lamports: number;
  solanaCluster: Cluster;
}) => {
  const connection = new Connection(clusterApiUrl(solanaCluster), 'confirmed');
  const { blockhash } = await connection.getLatestBlockhash();

  const instructions = [
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    }),
  ];

  const messageV0 = new TransactionMessage({
    payerKey: from,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
};
