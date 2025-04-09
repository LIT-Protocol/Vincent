import { ethers } from "ethers";

import { type AddressesByChainIdResponse, getAddressesByChainId } from ".";
import { type VincentToolError } from "@lit-protocol/vincent-tool";

export interface UniswapQuoteResponse {
    bestQuote: ethers.BigNumber;
    bestFee: number;
    amountOutMin: ethers.BigNumber;
}

export const getUniswapQuote = async (
    userRpcProvider: ethers.providers.JsonRpcProvider,
    userChainId: string,
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: string,
    tokenInDecimals: string,
    tokenOutDecimals: string,
): Promise<UniswapQuoteResponse | VincentToolError> => {
    console.log('Starting Uniswap quote calculation...');
    const addressByChainIdResponse = getAddressesByChainId(userChainId);

    if ('status' in addressByChainIdResponse && addressByChainIdResponse.status === 'error') {
        return addressByChainIdResponse;
    }

    const { UNISWAP_V3_QUOTER } = addressByChainIdResponse as AddressesByChainIdResponse;
    console.log('Using Uniswap V3 Quoter address:', UNISWAP_V3_QUOTER);

    const uniswapV3QuoterInterface = new ethers.utils.Interface([
        'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
    ]);
    const FEE_TIERS = [3000, 500]; // Supported fee tiers (0.3% and 0.05%)
    console.log('Supported fee tiers:', FEE_TIERS.map(fee => `${fee / 10000}%`));

    // Convert amountIn to wei using provided decimals
    const amountInWei = ethers.utils.parseUnits(amountIn, tokenInDecimals);
    console.log('Amount conversion:', {
        original: amountIn,
        decimals: tokenInDecimals,
        wei: amountInWei.toString(),
        formatted: ethers.utils.formatUnits(amountInWei, tokenInDecimals)
    });

    let bestQuote = null;
    let bestFee = null;

    for (const fee of FEE_TIERS) {
        try {
            const quoteParams = {
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddress,
                amountIn: amountInWei.toString(),
                fee: fee,
                sqrtPriceLimitX96: 0,
            };

            console.log(`Attempting quote with fee tier ${fee / 10000}%...`);
            console.log('Quote parameters:', quoteParams);

            const quote = await userRpcProvider.call({
                to: UNISWAP_V3_QUOTER!,
                data: uniswapV3QuoterInterface.encodeFunctionData('quoteExactInputSingle', [
                    quoteParams,
                ]),
            });

            console.log('Raw quote response:', quote);

            const [amountOut] = uniswapV3QuoterInterface.decodeFunctionResult(
                'quoteExactInputSingle',
                quote
            );
            const currentQuote = ethers.BigNumber.from(amountOut);

            // Skip if quote is 0
            if (currentQuote.isZero()) {
                console.log(`Quote is 0 for fee tier ${fee / 10000}% - skipping`);
                continue;
            }

            const formattedQuote = ethers.utils.formatUnits(currentQuote, tokenOutDecimals);
            console.log(`Quote for fee tier ${fee / 10000}%:`, {
                raw: currentQuote.toString(),
                formatted: formattedQuote
            });

            if (!bestQuote || currentQuote.gt(bestQuote)) {
                bestQuote = currentQuote;
                bestFee = fee;
                console.log(
                    `New best quote found with fee tier ${fee / 10000
                    }%: ${formattedQuote}`
                );
            }
        } catch (error: unknown) {
            const err = error as { reason?: string; message?: string; code?: string };
            if (err.reason === 'Unexpected error') {
                console.log(`No pool found for fee tier ${fee / 10000}%`);
            } else {
                console.error('Debug: Quoter call failed for fee tier:', fee, error);
                console.error('Error details:', {
                    message: err.message,
                    reason: err.reason,
                    code: err.code
                });
            }
            continue;
        }
    }

    if (!bestQuote || !bestFee) {
        console.error('Failed to get any valid quotes');
        return {
            status: 'error',
            details: [
                'Failed to get quote from Uniswap V3. No valid pool found for this token pair or quote returned 0.'
            ]
        };
    }

    // Calculate minimum output with 0.5% slippage tolerance
    const slippageTolerance = 0.005;
    const amountOutMin = bestQuote.mul(1000 - slippageTolerance * 1000).div(1000);
    console.log('Final quote details:', {
        bestFee: `${bestFee / 10000}%`,
        bestQuote: {
            raw: bestQuote.toString(),
            formatted: ethers.utils.formatUnits(bestQuote, tokenOutDecimals)
        },
        minimumOutput: {
            raw: amountOutMin.toString(),
            formatted: ethers.utils.formatUnits(amountOutMin, tokenOutDecimals)
        },
        slippageTolerance: `${slippageTolerance * 100}%`
    });

    return { bestQuote, bestFee, amountOutMin };
}