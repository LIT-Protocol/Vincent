import { ethers } from 'ethers';

/**
 * Fix ethers.js fee calculation when it's obviously wrong (L2 networks)
 */
export function fixFeeData(feeData: ethers.providers.FeeData) {
  // Ensure we have EIP-1559 data
  if (!feeData.maxFeePerGas || !feeData.gasPrice) {
    throw new Error('Network does not support EIP-1559 transactions');
  }

  // If maxFeePerGas is more than 10x gasPrice, ethers.js calculated it wrong
  if (feeData.maxFeePerGas.gt(feeData.gasPrice.mul(10))) {
    return {
      ...feeData,
      maxFeePerGas: feeData.gasPrice.mul(110).div(100), // gasPrice + 10%
      maxPriorityFeePerGas: ethers.utils.parseUnits('0.001', 'gwei'), // tiny tip
    };
  }

  return feeData;
}
