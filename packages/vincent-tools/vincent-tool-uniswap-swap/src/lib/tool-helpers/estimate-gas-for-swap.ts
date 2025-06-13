import { ethers } from 'ethers';

import { getGasParams } from './get-gas-params';

export const estimateGasForSwap = async (
  uniswapV3RouterContract: ethers.Contract,
  tokenInAddress: string,
  tokenOutAddress: string,
  uniswapV3PoolFee: number,
  pkpEthAddress: string,
  amountInSmallestUnit: ethers.BigNumber,
  amountOutMin: ethers.BigNumber,
) => {
  const [estimatedGas] = await Promise.all([
    uniswapV3RouterContract.estimateGas.exactInputSingle(
      [
        tokenInAddress,
        tokenOutAddress,
        uniswapV3PoolFee,
        pkpEthAddress,
        amountInSmallestUnit,
        amountOutMin,
        0,
      ],
      { from: pkpEthAddress },
    ),
  ]);

  return {
    ...(await getGasParams(uniswapV3RouterContract.provider, estimatedGas)),
  };
};
