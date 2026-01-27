import { type PublicClient, type WalletClient, type Account } from 'viem';

export async function installAppUsingUserEoa({
  userEoaWalletClient,
  vincentRegistryPublicClient,
  transactionData,
}: {
  userEoaWalletClient: WalletClient<any, any, Account>;
  vincentRegistryPublicClient: PublicClient;
  transactionData: {
    to: `0x${string}`;
    data: `0x${string}`;
  };
}): Promise<`0x${string}`> {
  console.log('=== Installing app using user EOA (direct submission from user EOA) ===');

  const txHash = await userEoaWalletClient.sendTransaction({
    to: transactionData.to,
    data: transactionData.data,
    chain: userEoaWalletClient.chain,
  });

  const receipt = await vincentRegistryPublicClient.waitForTransactionReceipt({ hash: txHash });

  if (receipt.status !== 'success') {
    throw new Error(`Transaction failed. Tx hash: ${txHash}`);
  }

  return txHash;
}
