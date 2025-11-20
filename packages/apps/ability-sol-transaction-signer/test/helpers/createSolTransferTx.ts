import {
  Cluster,
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';

export const createSolanaTransferTransaction = async ({
  solanaCluster,
  from,
  to,
  lamports,
}: {
  solanaCluster: Cluster;
  from: PublicKey;
  to: PublicKey;
  lamports: number;
}) => {
  const transaction = new Transaction();
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: from,
      toPubkey: to,
      lamports,
    }),
  );

  // Fetch recent blockhash from the network
  const connection = new Connection(clusterApiUrl(solanaCluster), 'confirmed');
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = from;

  return transaction;
};
