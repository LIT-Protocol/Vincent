import { ethers } from 'ethers';
import { getErc20Contract } from '../helpers/getErc20Contract';

export const getCurrentAllowance = async ({
  provider,
  tokenAddress,
  owner,
  spender,
}: {
  provider: ethers.providers.JsonRpcProvider;
  tokenAddress: string;
  owner: string;
  spender: string;
}): Promise<bigint> => {
  const contract = getErc20Contract(tokenAddress, provider);
  const allowance = await contract.allowance(owner, spender);
  return allowance.toBigInt();
};
