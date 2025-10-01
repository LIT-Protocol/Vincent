import { ethers } from 'ethers';

import { getCurrentAllowance } from '../ability-helpers/get-current-allowance';
import { CheckErc20AllowanceResult } from '../types';

export const checkErc20Allowance = async ({
  provider,
  tokenAddress,
  owner,
  spender,
  requiredAllowance,
}: {
  provider: ethers.providers.StaticJsonRpcProvider;
  tokenAddress: string;
  owner: string;
  spender: string;
  requiredAllowance: ethers.BigNumber;
}): Promise<CheckErc20AllowanceResult> => {
  const currentAllowance = await getCurrentAllowance({
    provider,
    tokenAddress,
    owner,
    spender,
  });

  if (currentAllowance.lt(requiredAllowance)) {
    return {
      success: false,
      reason: `[checkErc20Allowance] Address ${owner} has insufficient ERC20 allowance for spender ${spender} for token ${tokenAddress}`,
      spenderAddress: spender,
      tokenAddress: tokenAddress,
      requiredAllowance,
      currentAllowance,
    };
  }

  return {
    success: true,
    spenderAddress: spender,
    tokenAddress: tokenAddress,
    requiredAllowance,
    currentAllowance,
  };
};
