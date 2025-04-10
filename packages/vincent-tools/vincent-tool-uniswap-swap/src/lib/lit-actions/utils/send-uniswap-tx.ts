import { ethers } from 'ethers';
import { type VincentToolResponse } from '@lit-protocol/vincent-tool';

import { BASE_MAINNET_UNISWAP_V3_ROUTER, getGasParams, getUniswapQuote, signTx, type UniswapQuoteResponse } from '.';

const estimateGasForSwap = async (
    uniswapV3RouterContract: ethers.Contract,
    tokenInAddress: string,
    tokenOutAddress: string,
    uniswapV3PoolFee: number,
    pkpEthAddress: string,
    amountInSmallestUnit: ethers.BigNumber,
    amountOutMin: ethers.BigNumber
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
                0
            ],
            { from: pkpEthAddress }
        )
    ]);

    return {
        ...await getGasParams(uniswapV3RouterContract.provider, block, feeData, estimatedGas),
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
    console.log('Estimating gas for Swap transaction...');
    const partialSwapTxStringified = await Lit.Actions.runOnce(
        { waitForResponse: true, name: 'send swap tx gas estimation' },
        async () => {
            // Convert amountIn to token's smallest unit using input token's decimals
            const amountInSmallestUnit = ethers.utils.parseUnits(amountIn, tokenInDecimals);

            const uniswapV3RouterContract = new ethers.Contract(
                BASE_MAINNET_UNISWAP_V3_ROUTER,
                ['function exactInputSingle((address,address,uint24,address,uint256,uint256,uint160)) external payable returns (uint256)'],
                userRpcProvider
            );

            console.log('Getting Uniswap quote for swap...');
            const uniswapQuoteResponse = await getUniswapQuote(
                userRpcProvider,
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
        to: BASE_MAINNET_UNISWAP_V3_ROUTER,
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
            try {
                const receipt = await userRpcProvider.sendTransaction(signedSwapTx);
                return JSON.stringify({
                    status: 'success',
                    details: [
                        receipt.hash,
                    ]
                });
            } catch (error) {
                return JSON.stringify({
                    status: 'error',
                    details: [
                        (error as Error).message || JSON.stringify(error)
                    ]
                });
            }
        }
    );

    return JSON.parse(swapTxHash);
}