import { type PublicClient, type WalletClient, type Account } from 'viem';
import { type Address } from 'viem/accounts';

export async function ensureWalletHasTokens({
  address,
  funderWalletClient,
  publicClient,
  minAmount,
  dontFund = false,
}: {
  address: Address;
  funderWalletClient: WalletClient<any, any, Account>;
  publicClient: PublicClient;
  minAmount: bigint;
  dontFund?: boolean;
}): Promise<{ currentBalance: bigint; fundingTxHash?: `0x${string}` }> {
  const walletBalance = await publicClient.getBalance({ address });

  if (walletBalance >= minAmount || dontFund) return { currentBalance: walletBalance };

  const fundAmount = minAmount - walletBalance;
  const txHash = await funderWalletClient.sendTransaction({
    to: address,
    value: fundAmount,
    chain: funderWalletClient.chain,
  });

  const txReceipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  if (txReceipt.status !== 'success') {
    throw new Error(`Transaction failed. Tx hash: ${txHash}`);
  }

  return { currentBalance: walletBalance + fundAmount, fundingTxHash: txHash };
}
