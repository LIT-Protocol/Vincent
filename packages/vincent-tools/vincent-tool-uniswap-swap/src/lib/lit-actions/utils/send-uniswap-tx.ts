import { ethers } from 'ethers';
import { type VincentToolResponse } from '@lit-protocol/vincent-tool';

import { type AddressesByChainIdResponse, getAddressesByChainId, getUniswapQuote, signTx, type UniswapQuoteResponse } from '.';

const estimateGasForSwap = async (
    uniswapV3RouterContract: ethers.Contract,
    tokenInAddress: string,
    tokenOutAddress: string,
    uniswapV3PoolFee: number,
    pkpEthAddress: string,
    amountInSmallestUnit: ethers.BigNumber,
    amountOutMin: ethers.BigNumber
) => {
    let estimatedGas = await uniswapV3RouterContract.estimateGas.exactInputSingle(
        [
            tokenInAddress,
            tokenOutAddress,
            uniswapV3PoolFee,
            pkpEthAddress,
            amountInSmallestUnit,
            amountOutMin,
            0
        ],
        { from: pkpEthAddress }
    );

    // Add 10% buffer to estimated gas
    estimatedGas = estimatedGas.mul(110).div(100);

    // Get current gas data
    const [block, gasPrice] = await Promise.all([
        uniswapV3RouterContract.provider.getBlock('latest'),
        uniswapV3RouterContract.provider.getGasPrice()
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

export const sendUniswapTx = async (
    userRpcProvider: ethers.providers.JsonRpcProvider,
    userChainId: string,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: string,
    tokenInDecimals: string,
    tokenOutDecimals: string,
    pkpEthAddress: string,
    pkpPubKey: string,
): Promise<VincentToolResponse> => {
    const addressByChainIdResponse = getAddressesByChainId(userChainId);

    if ('status' in addressByChainIdResponse && addressByChainIdResponse.status === 'error') {
        return addressByChainIdResponse;
    }

    const { UNISWAP_V3_ROUTER } = addressByChainIdResponse as AddressesByChainIdResponse;

    console.log('Estimating gas for Swap transaction...');
    const partialSwapTxStringified = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'send swap tx gas estimation' },
        async () => {
            // Convert amountIn to token's smallest unit using input token's decimals
            const amountInSmallestUnit = ethers.utils.parseUnits(amountIn, tokenInDecimals);

            const uniswapV3RouterContract = new ethers.Contract(
                UNISWAP_V3_ROUTER!,
                ['function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) external payable returns (uint256)'],
                userRpcProvider
            );

            console.log('Getting Uniswap quote for swap...');
            const uniswapQuoteResponse = await getUniswapQuote(
                userRpcProvider,
                userChainId,
                tokenInAddress,
                tokenOutAddress,
                amountIn,
                tokenInDecimals,
                tokenOutDecimals
            );

            if ('status' in uniswapQuoteResponse && uniswapQuoteResponse.status === 'error') {
                return uniswapQuoteResponse;
            }

            const { bestFee, amountOutMin } = uniswapQuoteResponse as UniswapQuoteResponse;

            const { estimatedGas, maxFeePerGas, maxPriorityFeePerGas } = await estimateGasForSwap(
                uniswapV3RouterContract,
                tokenInAddress,
                tokenOutAddress,
                bestFee,
                pkpEthAddress,
                amountInSmallestUnit,
                amountOutMin
            );

            console.log(`Encoding swap transaction data...`);
            const swapTxData = uniswapV3RouterContract.interface.encodeFunctionData('exactInputSingle', [
                [
                    tokenInAddress,
                    tokenOutAddress,
                    bestFee,
                    pkpEthAddress,
                    amountInSmallestUnit,
                    amountOutMin,
                    0,
                ],
            ]);

            console.log(`Creating swap transaction object...`);
            const partialSwapTx = {
                data: swapTxData,
                gasLimit: estimatedGas,
                maxFeePerGas: maxFeePerGas,
                maxPriorityFeePerGas: maxPriorityFeePerGas,
                nonce: await userRpcProvider.getTransactionCount(pkpEthAddress),
            };

            return JSON.stringify(partialSwapTx);
        }
    );

    const partialSwapTxObject = JSON.parse(partialSwapTxStringified);
    const unsignedSwapTx = {
        to: UNISWAP_V3_ROUTER!,
        data: partialSwapTxObject.data,
        value: ethers.BigNumber.from(0),
        gasLimit: ethers.BigNumber.from(partialSwapTxObject.gasLimit),
        maxFeePerGas: ethers.BigNumber.from(partialSwapTxObject.maxFeePerGas),
        maxPriorityFeePerGas: ethers.BigNumber.from(partialSwapTxObject.maxPriorityFeePerGas),
        nonce: parseInt(partialSwapTxObject.nonce),
        chainId: ethers.BigNumber.from(userChainId).toNumber(),
        type: 2,
    };

    console.log(`Signing swap transaction...`);
    const signedSwapTx = await signTx(pkpPubKey, unsignedSwapTx, 'spendingLimitSig');

    console.log(`Broadcasting swap transaction...`);
    const swapTxHash = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'swapTxSender' },
        async () => {
            const receipt = await userRpcProvider.sendTransaction(signedSwapTx);
            return receipt.hash;
        }
    );

    console.log(`Swap transaction hash: ${swapTxHash}`);

    return {
        status: 'success',
        details: [
            swapTxHash
        ]
    };
}