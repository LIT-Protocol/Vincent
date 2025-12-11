import { ethers } from 'ethers';

import { getChainHelpers } from '../chain';

const FUND_AMOUNT = ethers.utils.parseEther('0.01');
const MIN_AMOUNT = ethers.utils.parseEther('0.005');

// Note that _outside of this test framework_, the agent wallet owner will have funded their own wallet / agent wallets with test tokens,
// but because we create the agent wallet owner, its agent PKP, and the appManager as part of this e2e test, this code is responsible for funding them with test tokens.
export const ensureWalletHasTestTokens = async ({
  address,
  minAmountEther,
}: {
  address: string;
  minAmountEther?: string;
}) => {
  const minAmount = minAmountEther ? ethers.utils.parseEther(minAmountEther) : MIN_AMOUNT;
  const {
    wallets: { funder },
  } = await getChainHelpers();

  const walletBalance = await funder.provider.getBalance(address);
  const fundAmount = minAmount.gt(FUND_AMOUNT) ? minAmount.sub(walletBalance) : FUND_AMOUNT;

  if (walletBalance.gte(minAmount)) {
    console.log(`ℹ️  ${address} has ${ethers.utils.formatEther(walletBalance)} Lit test tokens`);
    return;
  } else {
    console.log(`ℹ️  ${address} has less than ${ethers.utils.formatEther(minAmount)}`);
    console.log(
      `ℹ️  Minimum of ${ethers.utils.formatEther(minAmount)} Lit test tokens are required`,
    );
    console.log(
      `ℹ️  Funding ${address} with ${ethers.utils.formatEther(fundAmount)} Lit test tokens from funder account: ${funder.address}...`,
    );

    const tx = await funder.sendTransaction({
      to: address,
      value: fundAmount,
    });

    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Transaction failed. Tx hash: ${txReceipt.transactionHash}`);
    }

    console.log(
      `ℹ️  Funded ${address} with ${ethers.utils.formatEther(fundAmount)} Lit test tokens\nTx hash: ${txReceipt.transactionHash}`,
    );
  }
};
