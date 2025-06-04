import { ethers } from 'ethers';

import { getGasParams } from '.';

export const estimateGasForSwap = async (
  uniswapV3RouterContract: ethers.Contract,
  tokenInAddress: string,
  tokenOutAddress: string,
  uniswapV3PoolFee: number,
  pkpEthAddress: string,
  amountInSmallestUnit: ethers.BigNumber,
  amountOutMin: ethers.BigNumber,
) => {
  const [block, feeData, estimatedGas] = await Promise.all([
    uniswapV3RouterContract.provider.getBlock('latest'),
    uniswapV3RouterContract.provider.getFeeData(),
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
    ...(await getGasParams(uniswapV3RouterContract.provider, block, feeData, estimatedGas)),
  };
};
