import { ethers } from 'ethers';

import { getChainHelpers } from '../chain';

const FUND_AMOUNT = ethers.utils.parseEther('0.01');
const MIN_AMOUNT = ethers.utils.parseEther('0.005');

// Note that _outside of this test framework_, the agent wallet owner will have funded their own wallet / agent wallets with test tokens,
// but because we create the agent wallet owner, its agent PKP, and the appManager as part of this e2e test, this code is responsible for funding them with test tokens.
export const ensureWalletHasTestTokens = async ({ address }: { address: string }) => {
  const {
    wallets: { funder },
  } = await getChainHelpers();

  const walletBalance = await funder.provider.getBalance(address);

  if (walletBalance.gt(MIN_AMOUNT)) {
    console.log(`ℹ️  ${address} has ${ethers.utils.formatEther(walletBalance)} Lit test tokens`);
    return;
  } else {
    console.log(`ℹ️  ${address} has less than ${ethers.utils.formatEther(MIN_AMOUNT)}`);
    console.log(
      `ℹ️  Minimum of ${ethers.utils.formatEther(MIN_AMOUNT)} Lit test tokens are required`,
    );
    console.log(
      `ℹ️  Funding ${address} with ${ethers.utils.formatEther(FUND_AMOUNT)} Lit test tokens from funder account: ${funder.address}...`,
    );

    const tx = await funder.sendTransaction({
      to: address,
      value: FUND_AMOUNT,
    });

    const txReceipt = await tx.wait();
    if (txReceipt.status !== 1) {
      throw new Error(`Transaction failed. Tx hash: ${txReceipt.transactionHash}`);
    }

    console.log(
      `ℹ️  Funded ${address} with 0.01 Lit test tokens\nTx hash: ${txReceipt.transactionHash}`,
    );
  }
};
