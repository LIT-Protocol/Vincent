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
}): Promise<ethers.BigNumber> => {
  const contract = getErc20Contract(tokenAddress, provider);
  return await contract.allowance(owner, spender);
};
