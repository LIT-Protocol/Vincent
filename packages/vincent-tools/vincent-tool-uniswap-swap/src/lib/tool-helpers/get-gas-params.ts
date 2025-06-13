import { ethers } from 'ethers';

export interface GasParams {
  estimatedGas: ethers.BigNumber;
  maxFeePerGas: ethers.BigNumber;
  maxPriorityFeePerGas: ethers.BigNumber;
}

export const getGasParams = async (
  provider: ethers.providers.Provider,
  block: ethers.providers.Block,
  feeData: ethers.providers.FeeData,
  estimatedGas: ethers.BigNumber,
): Promise<GasParams> => {
  // Determine baseFeePerGas, with multiple fallbacks
  let baseFeePerGas = block.baseFeePerGas;
  if (baseFeePerGas == null) {
    // Fallback to feeData.gasPrice if available
    baseFeePerGas = feeData && feeData.gasPrice ? feeData.gasPrice : await provider.getGasPrice();
  }
  // Final fallback to a nominal value if still null
  if (baseFeePerGas == null) {
    baseFeePerGas = ethers.utils.parseUnits('0.005', 'gwei');
  }

  // Determine the maxPriorityFeePerGas, using a dynamic value if available; otherwise, fallback
  let maxPriorityFeePerGas =
    feeData && feeData.maxPriorityFeePerGas
      ? feeData.maxPriorityFeePerGas
      : ethers.utils.parseUnits('0.001', 'gwei');

  // Cap maxPriorityFeePerGas at 0.001 gwei if it exceeds this value
  const maxPriorityFeeCap = ethers.utils.parseUnits('0.001', 'gwei');
  if (maxPriorityFeePerGas.gt(maxPriorityFeeCap)) {
    maxPriorityFeePerGas = maxPriorityFeeCap;
  }

  // Calculate maxFeePerGas as the sum of baseFee and priority fee
  const maxFeePerGas = baseFeePerGas.mul(2).add(maxPriorityFeePerGas);

  // Add a 20% buffer to the estimated gas limit
  const estimatedGasWithBuffer = estimatedGas.mul(120).div(100);

  return {
    estimatedGas: estimatedGasWithBuffer,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
};
