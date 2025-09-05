import { ethers } from 'ethers';

export interface GasParams {
  estimatedGas: ethers.BigNumber;
  maxFeePerGas: ethers.BigNumber;
  maxPriorityFeePerGas: ethers.BigNumber;
}

export const getGasParams = async (
  provider: ethers.providers.Provider,
  estimatedGas: ethers.BigNumber,
): Promise<GasParams> => {
  // Fetch block and fee data
  const [block, feeData] = await Promise.all([provider.getBlock('latest'), provider.getFeeData()]);
  // Determine baseFeePerGas, with multiple fallbacks
  let baseFeePerGas = block.baseFeePerGas;
  if (baseFeePerGas == null) {
    // Fallback to feeData.gasPrice if available
    baseFeePerGas = feeData && feeData.gasPrice ? feeData.gasPrice : await provider.getGasPrice();
  }
  // Final fallback to a nominal value if still null
  if (baseFeePerGas == null) {
    baseFeePerGas = ethers.utils.parseUnits('1', 'gwei');
  }

  // Determine the maxPriorityFeePerGas, using a dynamic value if available; otherwise, fallback
  const maxPriorityFeePerGas =
    feeData && feeData.maxPriorityFeePerGas
      ? feeData.maxPriorityFeePerGas
      : ethers.utils.parseUnits('1.5', 'gwei');

  // Calculate maxFeePerGas as the sum of baseFee and priority fee
  const maxFeePerGas = baseFeePerGas.add(maxPriorityFeePerGas);

  // Add a 50% buffer to the estimated gas limit for complex swaps
  const estimatedGasWithBuffer = estimatedGas.mul(150).div(100);

  return {
    estimatedGas: estimatedGasWithBuffer,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
};
