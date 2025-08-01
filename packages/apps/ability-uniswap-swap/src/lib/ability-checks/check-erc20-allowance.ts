import { ethers } from 'ethers';
import { getErc20Contract } from './getErc20Contract';

export const checkErc20Allowance = async ({
  provider,
  tokenAddress,
  owner,
  spender,
  tokenAmount,
}: {
  provider: ethers.providers.StaticJsonRpcProvider;
  tokenAddress: string;
  owner: string;
  spender: string;
  tokenAmount: bigint;
}): Promise<ethers.BigNumber> => {
  const contract = getErc20Contract(tokenAddress, provider);

  const currentAllowance = await contract.allowance(owner, spender);

  // Convert bigint to BigNumber for comparison
  const tokenAmountBN = ethers.BigNumber.from(tokenAmount.toString());

  if (currentAllowance.lt(tokenAmountBN)) {
    throw new Error(
      `Address ${owner} has insufficient ERC20 allowance for spender ${spender} for token ${tokenAddress} (checkErc20Allowance)`,
    );
  }

  return currentAllowance;
};
