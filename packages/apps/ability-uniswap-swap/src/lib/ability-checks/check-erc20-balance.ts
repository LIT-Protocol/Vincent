import { ethers } from 'ethers';

import { getErc20Contract } from '../ability-helpers/get-erc20-contract';
import { CheckErc20BalanceResult } from '../types';

export const checkErc20Balance = async ({
  provider,
  pkpEthAddress,
  tokenAddress,
  requiredTokenAmount,
}: {
  provider: ethers.providers.StaticJsonRpcProvider;
  pkpEthAddress: string;
  tokenAddress: string;
  requiredTokenAmount: ethers.BigNumber;
}): Promise<CheckErc20BalanceResult> => {
  const contract = getErc20Contract(tokenAddress, provider);

  const tokenBalance: ethers.BigNumber = await contract.balanceOf(pkpEthAddress);

  if (tokenBalance.lt(requiredTokenAmount)) {
    return {
      success: false,
      reason: `pkpEthAddress (${pkpEthAddress}) has insufficient balance of tokenIn (${tokenAddress}). Wanted ${requiredTokenAmount}, but only have ${tokenBalance}`,
      tokenAddress,
      requiredTokenAmount,
      tokenBalance,
    };
  }

  return {
    success: true,
    tokenAddress,
    requiredTokenAmount,
    tokenBalance,
  };
};
