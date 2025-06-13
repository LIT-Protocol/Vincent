import { ethers } from 'ethers';
import { JsonRpcProvider as v6provider } from 'ethers-v6';

export interface GasParams {
  estimatedGas: ethers.BigNumber;
  maxFeePerGas: ethers.BigNumber;
  maxPriorityFeePerGas: ethers.BigNumber;
}

export const getGasParams = async (
  provider: ethers.providers.Provider,
  estimatedGas: ethers.BigNumber,
): Promise<GasParams> => {
  const rpcUrl = (provider as any).connection?.url;

  if (!rpcUrl) {
    throw new Error('Could not extract RPC URL from provider for v6 operations');
  }

  const v6Provider = new v6provider(rpcUrl);
  const v6FeeData = await v6Provider.getFeeData();

  let maxFeePerGas: ethers.BigNumber;
  let maxPriorityFeePerGas: ethers.BigNumber;

  if (!v6FeeData || !v6FeeData.maxFeePerGas || !v6FeeData.maxPriorityFeePerGas) {
    // Fallback values, same as ethers v5
    maxPriorityFeePerGas = ethers.utils.parseUnits('1.5', 'gwei');

    // Try to get baseFeePerGas from the latest block, or use a reasonable default
    let baseFeePerGas: ethers.BigNumber;
    const latestBlock = await provider.getBlock('latest');
    if (latestBlock && latestBlock.baseFeePerGas) {
      baseFeePerGas = latestBlock.baseFeePerGas;
    } else {
      // Only use default if we can't get base fee
      baseFeePerGas = ethers.utils.parseUnits('1', 'gwei');
    }

    maxFeePerGas = baseFeePerGas.mul(2).add(maxPriorityFeePerGas);
  } else {
    maxFeePerGas = ethers.BigNumber.from(v6FeeData.maxFeePerGas.toString());
    maxPriorityFeePerGas = ethers.BigNumber.from(v6FeeData.maxPriorityFeePerGas.toString());
  }

  // Add a 20% buffer to the estimated gas limit
  const estimatedGasWithBuffer = estimatedGas.mul(120).div(100);

  return {
    estimatedGas: estimatedGasWithBuffer,
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
};
