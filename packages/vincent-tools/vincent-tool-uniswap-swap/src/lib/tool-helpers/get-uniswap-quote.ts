import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core';
import { ethers } from 'ethers';

const UNISWAP_V3_QUOTER_INTERFACE = new ethers.utils.Interface([
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
]);

export const getUniswapQuote = async ({
  rpcUrl,
  chainId,
  tokenInAddress,
  tokenInDecimals,
  tokenInAmount,
  tokenOutAddress,
  tokenOutDecimals,
}: {
  rpcUrl: string;
  chainId: number;
  tokenInAddress: string;
  tokenInDecimals: number;
  tokenInAmount: number;
  tokenOutAddress: string;
  tokenOutDecimals: number;
}): Promise<{
  bestQuote: ethers.BigNumber;
  bestFee: number;
  amountOutMin: ethers.BigNumber;
}> => {
  console.log('Getting Uniswap Quote (getUniswapQuote)', {
    rpcUrl,
    chainId,
    tokenInAddress,
    tokenInDecimals,
    tokenInAmount,
    tokenOutAddress,
    tokenOutDecimals,
  });

  const chainAddressMap = CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP];
  if (chainAddressMap === undefined)
    throw new Error(`Unsupported chainId: ${chainId} (getUniswapQuote)`);
  if (chainAddressMap.quoterAddress === undefined)
    throw new Error(`No Uniswap V3 Quoter Address found for chainId: ${chainId} (getUniswapQuote)`);
  const quoterAddress = chainAddressMap.quoterAddress as `0x${string}`;
  console.log(`Using Quoter Address: ${quoterAddress} (getUniswapQuote)`);

  const uniswapRpcProvider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);

  const formattedTokenInAmount = ethers.utils.parseUnits(tokenInAmount.toString(), tokenInDecimals);
  console.log('Amount conversion:', {
    original: tokenInAmount,
    decimals: tokenInDecimals,
    wei: formattedTokenInAmount.toString(),
    formatted: ethers.utils.formatUnits(formattedTokenInAmount, tokenInDecimals),
  });

  let bestQuote = null;
  let bestFee = null;

  const feeTiers = [3000, 500]; // Supported fee tiers (0.3% and 0.05%)
  for (const fee of feeTiers) {
    try {
      const quoteParams = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: formattedTokenInAmount.toString(),
        fee,
        sqrtPriceLimitX96: 0,
      };

      console.log(`Attempting quote with fee tier ${fee / 10000}% (getUniswapQuote)`);
      console.log('Quote parameters (getUniswapQuote):', quoteParams);

      const quote = await uniswapRpcProvider.call({
        to: quoterAddress,
        data: UNISWAP_V3_QUOTER_INTERFACE.encodeFunctionData('quoteExactInputSingle', [
          quoteParams,
        ]),
      });
      console.log('Raw quote response (getUniswapQuote):', quote);

      const [amountOut] = UNISWAP_V3_QUOTER_INTERFACE.decodeFunctionResult(
        'quoteExactInputSingle',
        quote,
      );

      const currentQuote = ethers.BigNumber.from(amountOut);
      if (currentQuote.isZero()) {
        console.log(`Quote is 0 for fee tier ${fee / 10000}% - skipping (getUniswapQuote)`);
        continue;
      }

      const formattedQuote = ethers.utils.formatUnits(currentQuote, tokenOutDecimals);
      console.log(`Quote for fee tier ${fee / 10000}% (getUniswapQuote):`, {
        raw: currentQuote.toString(),
        formatted: formattedQuote,
      });

      if (!bestQuote || currentQuote.gt(bestQuote)) {
        bestQuote = currentQuote;
        bestFee = fee;
        console.log(
          `New best quote found with fee tier ${fee / 10000}% (getUniswapQuote): ${formattedQuote}`,
        );
      }
    } catch (error: unknown) {
      const err = error as { reason?: string; message?: string; code?: string };

      // Check if this is an ethers contract error with expected properties
      if ('reason' in err && 'message' in err && 'code' in err) {
        if (err.reason === 'Unexpected error') {
          console.log(
            `Unexpected error thrown, probably no pool found for fee tier ${fee / 10000}% (getUniswapQuote)`,
            err,
          );
        } else {
          console.log(`Quoter call failed for fee tier ${fee / 10000}% (getUniswapQuote)`, {
            message: err.message,
            reason: err.reason,
            code: err.code,
          });
        }

        continue;
      } else {
        throw error;
      }
    }
  }

  if (!bestQuote || !bestFee) {
    throw new Error(
      'Failed to get quote from Uniswap V3. No valid pool found for this token pair or quote returned 0 (getUniswapQuote)',
    );
  }

  // Calculate minimum output with 0.5% slippage tolerance
  const slippageTolerance = 0.005;
  const amountOutMin = bestQuote.mul(1000 - slippageTolerance * 1000).div(1000);
  console.log('Final quote details:', {
    bestFee: `${bestFee / 10000}%`,
    bestQuote: {
      raw: bestQuote.toString(),
      formatted: ethers.utils.formatUnits(bestQuote, tokenOutDecimals),
    },
    minimumOutput: {
      raw: amountOutMin.toString(),
      formatted: ethers.utils.formatUnits(amountOutMin, tokenOutDecimals),
    },
    slippageTolerance: `${slippageTolerance * 100}%`,
  });

  return { bestQuote, bestFee, amountOutMin };
};
