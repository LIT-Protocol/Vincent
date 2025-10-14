import {
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl,
  type Cluster,
} from '@solana/web3.js';

import { TEST_SOLANA_FUNDER_PRIVATE_KEY } from '../../helpers';

export const fundIfNeeded = async ({
  solanaCluster,
  keypair,
  txSendAmount,
  faucetFundAmount,
}: {
  solanaCluster: Cluster;
  keypair: Keypair;
  txSendAmount: number;
  faucetFundAmount: number;
}) => {
  const connection = new Connection(clusterApiUrl(solanaCluster), 'confirmed');
  const balance = await connection.getBalance(keypair.publicKey);
  console.log('[fundIfNeeded] Current keypair balance:', balance / LAMPORTS_PER_SOL, 'SOL');

  // Calculate minimum required balance (TX_SEND_AMOUNT + estimated gas fees)
  const ESTIMATED_GAS_FEE = 0.000005 * LAMPORTS_PER_SOL; // ~0.000005 SOL for gas

  if (balance < txSendAmount + ESTIMATED_GAS_FEE) {
    console.log('[fundIfNeeded] Balance insufficient, funding from funder account...');
    const funderKeypair = Keypair.fromSecretKey(Buffer.from(TEST_SOLANA_FUNDER_PRIVATE_KEY, 'hex'));

    // Check funder balance
    const funderBalance = await connection.getBalance(funderKeypair.publicKey);
    console.log('[fundIfNeeded] Funder balance:', funderBalance / LAMPORTS_PER_SOL, 'SOL');
    if (funderBalance < faucetFundAmount) {
      throw new Error(
        `Funder account has insufficient balance: ${funderBalance / LAMPORTS_PER_SOL} SOL`,
      );
    }

    // Create transfer transaction from funder to keypair
    const transferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: funderKeypair.publicKey,
        toPubkey: keypair.publicKey,
        lamports: faucetFundAmount,
      }),
    );

    // Set recent blockhash and sign
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transferTx.recentBlockhash = blockhash;
    transferTx.feePayer = funderKeypair.publicKey;
    transferTx.sign(funderKeypair);

    // Send and confirm transaction
    const signature = await connection.sendRawTransaction(transferTx.serialize(), {
      skipPreflight: false,
    });

    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed',
    );
    console.log(
      '[fundIfNeeded] Funded keypair with',
      faucetFundAmount / LAMPORTS_PER_SOL,
      'SOL. Tx:',
      signature,
    );

    // Verify new balance
    const newBalance = await connection.getBalance(keypair.publicKey);
    console.log('[fundIfNeeded] New keypair balance:', newBalance / LAMPORTS_PER_SOL, 'SOL');
  } else {
    console.log('[fundIfNeeded] Balance sufficient, no funding needed');
  }
};
