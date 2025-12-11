import {
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl,
  type Cluster,
  PublicKey,
} from '@solana/web3.js';
import bs58 from 'bs58';

export const fundIfNeeded = async ({
  solanaCluster,
  publicKey,
  txSendAmount,
  faucetFundAmount,
  funderPrivateKey,
}: {
  solanaCluster: Cluster;
  publicKey: PublicKey;
  txSendAmount: number;
  faucetFundAmount: number;
  funderPrivateKey: string;
}) => {
  const connection = new Connection(clusterApiUrl(solanaCluster), 'confirmed');
  const balance = await connection.getBalance(publicKey);
  console.log('[fundIfNeeded] Current address balance:', balance / LAMPORTS_PER_SOL, 'SOL');

  // Calculate minimum required balance (TX_SEND_AMOUNT + estimated gas fees)
  const ESTIMATED_GAS_FEE = 0.000005 * LAMPORTS_PER_SOL; // ~0.000005 SOL for gas

  if (balance < txSendAmount + ESTIMATED_GAS_FEE) {
    console.log('[fundIfNeeded] Balance insufficient, funding from funder account...');
    // Decode the base58 private key to bytes
    const funderKeypair = Keypair.fromSecretKey(bs58.decode(funderPrivateKey));

    // Check funder balance
    const funderBalance = await connection.getBalance(funderKeypair.publicKey);
    console.log('[fundIfNeeded] Funder balance:', funderBalance / LAMPORTS_PER_SOL, 'SOL');
    if (funderBalance < faucetFundAmount) {
      throw new Error(
        `Funder account has insufficient balance: ${funderBalance / LAMPORTS_PER_SOL} SOL`,
      );
    }

    // Create transfer transaction from funder to target public key
    const transferTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: funderKeypair.publicKey,
        toPubkey: publicKey,
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
      '[fundIfNeeded] Funded address with',
      faucetFundAmount / LAMPORTS_PER_SOL,
      'SOL. Tx:',
      signature,
    );

    // Verify new balance
    const newBalance = await connection.getBalance(publicKey);
    console.log('[fundIfNeeded] New address balance:', newBalance / LAMPORTS_PER_SOL, 'SOL');
  } else {
    console.log('[fundIfNeeded] Balance sufficient, no funding needed');
  }
};
