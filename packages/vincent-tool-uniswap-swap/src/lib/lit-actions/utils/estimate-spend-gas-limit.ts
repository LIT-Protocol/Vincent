import { getSpendingLimitContract } from '.';

export const estimateSpendGasLimit = async (
    spendingLimitAddress: string,
    pkpEthAddress: string,
    appId: string,
    // @ts-expect-error ethers is not defined in the global scope
    amountInUsd: ethers.BigNumber,
    // @ts-expect-error ethers is not defined in the global scope
    maxSpendingLimit: ethers.BigNumber,
    // @ts-expect-error ethers is not defined in the global scope
    spendingLimitDuration: ethers.BigNumber,
    // @ts-expect-error ethers is not defined in the global scope
    provider: ethers.providers.JsonRpcProvider
): Promise<{
    // @ts-expect-error ethers is not defined in the global scope
    estimatedGas: ethers.BigNumber;
    // @ts-expect-error ethers is not defined in the global scope
    maxFeePerGas: ethers.BigNumber;
    // @ts-expect-error ethers is not defined in the global scope
    maxPriorityFeePerGas: ethers.BigNumber;
    nonce: number;
}> => {
    const spendingLimitContract = await getSpendingLimitContract(spendingLimitAddress);

    // Estimate gas
    console.log(`Estimating gas limit for spend function...`);

    let estimatedGas = await spendingLimitContract.estimateGas.spend(
        appId,
        amountInUsd,
        maxSpendingLimit,
        spendingLimitDuration,
        { from: pkpEthAddress }
    );
    // Add 10% buffer to estimated gas (reduced from 20%)
    estimatedGas = estimatedGas.mul(110).div(100);

    // Get current gas data
    const [block, gasPrice] = await Promise.all([
        provider.getBlock('latest'),
        provider.getGasPrice()
    ]);

    // Use a more conservative max fee per gas calculation
    const baseFeePerGas = block.baseFeePerGas || gasPrice;
    const maxFeePerGas = baseFeePerGas.mul(150).div(100); // 1.5x base fee
    const maxPriorityFeePerGas = gasPrice.div(10); // 0.1x gas price

    const nonce = await provider.getTransactionCount(pkpEthAddress);

    console.log('Gas estimation details:', {
        estimatedGas: estimatedGas.toString(),
        maxFeePerGas: maxFeePerGas.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        nonce,
        baseFeePerGas: baseFeePerGas.toString(),
        gasPrice: gasPrice.toString()
    });

    return {
        estimatedGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce
    };
}; 