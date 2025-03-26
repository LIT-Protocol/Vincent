import { getUniswapQuoterRouter } from './get-uniswap-quoter-router';

/**
 * Retrieves the best quote for a Uniswap V3 swap.
 * @param {JsonRpcProvider} provider - The Ethereum provider.
 * @param {string} chainId - The chain ID.
 * @param {string} tokenIn - The input token address.
 * @param {string} tokenOut - The output token address.
 * @param {ethers.BigNumber} amount - The amount of tokens to swap.
 * @param {number} decimalsOut - The decimals of the output token.
 * @returns {Promise<{ bestQuote: any, bestFee: number, amountOutMin: any }>} The best quote and fee tier.
 */
export const getBestQuote = async (
  // @ts-expect-error ethers is not defined in the global scope
  provider: ethers.providers.JsonRpcProvider,
  chainId: string,
  tokenIn: string,
  tokenOut: string,
  // @ts-expect-error ethers is not defined in the global scope
  amountIn: ethers.BigNumber,
  decimalsOut: number
) => {
  console.log('Getting best quote for swap...');
  const { UNISWAP_V3_QUOTER } = getUniswapQuoterRouter(chainId);
  const quoterInterface = new ethers.utils.Interface([
    'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  ]);

  const FEE_TIERS = [3000, 500]; // Supported fee tiers (0.3% and 0.05%)
  let bestQuote = null;
  let bestFee = null;

  for (const fee of FEE_TIERS) {
    try {
      const quoteParams = {
        tokenIn,
        tokenOut,
        amountIn,
        fee: fee,
        sqrtPriceLimitX96: 0,
      };

      console.log(`Trying fee tier ${fee / 10000}%...`);
      const quote = await provider.call({
        to: UNISWAP_V3_QUOTER,
        data: quoterInterface.encodeFunctionData('quoteExactInputSingle', [
          quoteParams,
        ]),
      });

      const [amountOut] = quoterInterface.decodeFunctionResult(
        'quoteExactInputSingle',
        quote
      );
      const currentQuote = ethers.BigNumber.from(amountOut);

      if (!bestQuote || currentQuote.gt(bestQuote)) {
        bestQuote = currentQuote;
        bestFee = fee;
        console.log(
          `New best quote found with fee tier ${fee / 10000
          }%: ${ethers.utils.formatUnits(currentQuote, decimalsOut)}`
        );
      }
    } catch (error) {
      if ((error as { reason?: string }).reason === 'Unexpected error') {
        console.log(`No pool found for fee tier ${fee / 10000}%`);
      } else {
        console.error('Debug: Quoter call failed for fee tier:', fee, error);
      }
      continue;
    }
  }

  if (!bestQuote || !bestFee) {
    throw new Error(
      'Failed to get quote from Uniswap V3. No valid pool found for this token pair.'
    );
  }

  // Calculate minimum output with 0.5% slippage tolerance
  const slippageTolerance = 0.005;
  const amountOutMin = bestQuote.mul(1000 - slippageTolerance * 1000).div(1000);
  console.log(
    'Minimum output:',
    ethers.utils.formatUnits(amountOutMin, decimalsOut)
  );

  return { bestQuote, bestFee, amountOutMin };
};