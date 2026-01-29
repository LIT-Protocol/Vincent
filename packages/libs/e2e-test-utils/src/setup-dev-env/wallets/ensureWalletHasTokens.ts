import type { PublicClient, WalletClient, Account } from 'viem';
import type { Address } from 'viem/accounts';

import { formatEther } from 'viem';

export async function ensureWalletHasTokens({
  address,
  funderWalletClient,
  publicClient,
  minAmount,
  dontFund = false,
  numberOfConfirmations = 2,
}: {
  address: Address;
  funderWalletClient: WalletClient<any, any, Account>;
  publicClient: PublicClient;
  minAmount: bigint;
  dontFund?: boolean;
  numberOfConfirmations?: number;
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

  if (numberOfConfirmations > 0) {
    console.log(
      `Funded ${address} with ${formatEther(fundAmount)} tokens. Waiting for transaction confirmations...`,
    );
    await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: numberOfConfirmations,
    });
  }

  return { currentBalance: walletBalance + fundAmount, fundingTxHash: txHash };
}
