import { clusterApiUrl, Connection, type Cluster } from '@solana/web3.js';

export const submitAndVerifyTransaction = async ({
  solanaCluster,
  signedTransactionBase64,
  testName,
}: {
  solanaCluster: Cluster;
  signedTransactionBase64: string;
  testName: string;
}) => {
  const connection = new Connection(clusterApiUrl(solanaCluster), 'confirmed');
  const signedTxBuffer = Buffer.from(signedTransactionBase64, 'base64');

  console.log(`[${testName}] Submitting transaction to Solana network`);
  const signature = await connection.sendRawTransaction(signedTxBuffer, {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  console.log(`[${testName}] Transaction signature:`, signature);

  const latestBlockhash = await connection.getLatestBlockhash('confirmed');
  const confirmation = await connection.confirmTransaction(
    {
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    },
    'confirmed',
  );
  expect(confirmation.value.err).toBeNull();
  console.log(`[${testName}] Transaction confirmed in block`);

  const txDetails = await connection.getTransaction(signature, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });
  expect(txDetails).toBeDefined();
  expect(txDetails?.slot).toBeGreaterThan(0);
  expect(txDetails?.blockTime).toBeDefined();

  console.log(`[${testName}] Transaction successfully included in block:`, {
    slot: txDetails?.slot,
    blockTime: txDetails?.blockTime,
    signature,
  });
};
