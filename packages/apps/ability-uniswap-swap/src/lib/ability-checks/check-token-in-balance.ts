import { ethers } from 'ethers';
import { getErc20Contract } from './getErc20Contract';

export const checkTokenInBalance = async ({
  provider,
  pkpEthAddress,
  tokenInAddress,
  tokenInAmount,
}: {
  provider: ethers.providers.StaticJsonRpcProvider;
  pkpEthAddress: string;
  tokenInAddress: string;
  tokenInAmount: bigint;
}) => {
  const contract = getErc20Contract(tokenInAddress, provider);

  const tokenInBalance: ethers.BigNumber = await contract.balanceOf(pkpEthAddress);

  // Convert bigint to BigNumber for comparison
  const tokenInAmountBN = ethers.BigNumber.from(tokenInAmount.toString());

  if (tokenInBalance.lt(tokenInAmountBN)) {
    throw new Error(
      `pkpEthAddress (${pkpEthAddress}) has insufficient balance of tokenIn (${tokenInAddress}). Wanted ${tokenInAmount}, but only have ${tokenInBalance} (checkTokenInBalance)`,
    );
  }

  return tokenInBalance;
};
