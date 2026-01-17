import { type PublicClient, type WalletClient, type Account } from 'viem';

/**
 * Submit app installation transaction directly from user EOA (user pays gas).
 *
 * This function submits the permitAppVersion transaction directly from the user's EOA
 * instead of using Gelato's gas sponsorship. This is useful for development environments
 * or when gas sponsorship is not desired.
 *
 * @param params - Direct submission parameters
 * @returns Transaction hash of the permitAppVersion transaction
 *
 * @example
 * ```typescript
 * const txHash = await installAppUsingUserEoa({
 *   userEoaWalletClient,
 *   publicClient,
 *   transactionData: installData.transaction,
 * });
 *
 * console.log('Permit transaction hash:', txHash);
 * ```
 */
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
  // Submit the transaction from the user's EOA
  const txHash = await userEoaWalletClient.sendTransaction({
    to: transactionData.to,
    data: transactionData.data,
    chain: userEoaWalletClient.chain,
  });

  // Wait for transaction receipt to ensure it was successful
  const receipt = await vincentRegistryPublicClient.waitForTransactionReceipt({ hash: txHash });

  if (receipt.status !== 'success') {
    throw new Error(`Transaction failed. Tx hash: ${txHash}`);
  }

  return txHash;
}
