import { ethers } from 'ethers';

import { getAddressesByChainId, signTx } from '.';

const estimateGas = async (
    spendingLimitContract: ethers.Contract,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxSpendingLimitInUsdCents: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber,
    pkpEthAddress: string,
) => {
    console.log(`Making gas estimation call...`);
    let estimatedGas = await spendingLimitContract.estimateGas.spend(
        appId,
        amountInUsd,
        maxSpendingLimitInUsdCents,
        spendingLimitDuration,
        { from: pkpEthAddress }
    );
    // Add 10% buffer to estimated gas
    estimatedGas = estimatedGas.mul(110).div(100);

    console.log('Getting block and gas price...');
    const [block, gasPrice] = await Promise.all([
        spendingLimitContract.provider.getBlock('latest'),
        spendingLimitContract.provider.getGasPrice()
    ]);

    // Use a more conservative max fee per gas calculation
    const baseFeePerGas = block.baseFeePerGas || gasPrice;
    const maxFeePerGas = baseFeePerGas.mul(150).div(100); // 1.5x base fee
    const maxPriorityFeePerGas = gasPrice.div(10); // 0.1x gas price

    return {
        estimatedGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
    };
}

export const sendSpendTx = async (
    yellowstoneProvider: ethers.providers.JsonRpcProvider,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxSpendingLimitInUsdCents: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber,
    pkpEthAddress: string,
    pkpPubKey: string,
) => {
    const { SPENDING_LIMIT_ADDRESS } = getAddressesByChainId('175188'); // Yellowstone

    const partialSpendTxStringified = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'send spend tx gas estimation' },
        async () => {
            const SPENDING_LIMIT_ABI = [
                `function checkLimit(address user, uint256 appId, uint256 amountToSpend, uint256 userMaxSpendLimit, uint256 duration) view returns (bool)`,
                `function spend(uint256 appId, uint256 amount, uint256 userMaxSpendLimit, uint256 duration)`,
                `error SpendLimitExceeded(address user, uint256 appId, uint256 amount, uint256 limit)`,
                `error ZeroAppIdNotAllowed(address user)`,
                `error ZeroDurationQuery(address user)`
            ];

            console.log(`Preparing transaction to send to Spending Limit Contract: ${SPENDING_LIMIT_ADDRESS}`);

            const spendingLimitContract = new ethers.Contract(
                SPENDING_LIMIT_ADDRESS!,
                SPENDING_LIMIT_ABI,
                yellowstoneProvider
            );

            console.log(`Estimating gas for spending limit transaction...`);
            const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGas(
                spendingLimitContract,
                appId,
                amountInUsd,
                maxSpendingLimitInUsdCents,
                spendingLimitDuration,
                pkpEthAddress
            );

            console.log(`Encoding transaction data...`);
            const txData = spendingLimitContract.interface.encodeFunctionData('spend', [
                appId,
                amountInUsd,
                maxSpendingLimitInUsdCents,
                spendingLimitDuration,
            ]);

            console.log(`Creating transaction object...`);
            const partialSpendTx = {
                data: txData,
                gasLimit: estimatedGas,
                maxFeePerGas,
                maxPriorityFeePerGas,
                nonce: await yellowstoneProvider.getTransactionCount(pkpEthAddress),
            };

            return JSON.stringify(partialSpendTx);
        }
    );

    const partialSpendTxObject = JSON.parse(partialSpendTxStringified);
    const unsignedSpendTx = {
        to: SPENDING_LIMIT_ADDRESS as string,
        data: partialSpendTxObject.data,
        value: ethers.BigNumber.from(0),
        gasLimit: ethers.BigNumber.from(partialSpendTxObject.gasLimit),
        maxFeePerGas: ethers.BigNumber.from(partialSpendTxObject.maxFeePerGas),
        maxPriorityFeePerGas: ethers.BigNumber.from(partialSpendTxObject.maxPriorityFeePerGas),
        nonce: parseInt(partialSpendTxObject.nonce),
        chainId: ethers.BigNumber.from(175188).toNumber(),
        type: 2,
    };

    console.log(`Signing spend transaction...`);
    const signedSpendTx = await signTx(pkpPubKey, unsignedSpendTx, 'spendingLimitSig');

    console.log(`Broadcasting spend transaction...`);
    const spendTxHash = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'spendTxSender' },
        async () => {
            const receipt = await yellowstoneProvider.sendTransaction(signedSpendTx);
            return receipt.hash;
        }
    );

    console.log(`Spend transaction hash: ${spendTxHash}`);

    return spendTxHash;
}