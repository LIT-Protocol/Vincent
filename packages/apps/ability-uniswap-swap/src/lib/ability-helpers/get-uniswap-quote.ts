import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { AlphaRouter, SwapType, SwapRoute } from '@uniswap/smart-order-router';
import { ethers } from 'ethers';

export const getUniswapQuote = async ({
  rpcUrl,
  chainId,
  tokenInAddress,
  tokenInDecimals,
  tokenInAmount,
  tokenOutAddress,
  tokenOutDecimals,
  recipient,
}: {
  rpcUrl: string;
  chainId: number;
  tokenInAddress: string;
  tokenInDecimals: number;
  tokenInAmount: number;
  tokenOutAddress: string;
  tokenOutDecimals: number;
  recipient: string;
}): Promise<{
  bestQuote: ethers.BigNumber;
  bestFee: number;
  amountOutMin: ethers.BigNumber;
  route: SwapRoute;
}> => {
  console.log('Getting Uniswap Quote (getUniswapQuote)', {
    rpcUrl,
    chainId,
    tokenInAddress,
    tokenInDecimals,
    tokenInAmount,
    tokenOutAddress,
    tokenOutDecimals,
    recipient,
  });

  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
  const router = new AlphaRouter({ chainId, provider });

  // Create token instances
  const tokenIn = new Token(chainId, tokenInAddress, tokenInDecimals);
  const tokenOut = new Token(chainId, tokenOutAddress, tokenOutDecimals);

  // Convert amount to proper format
  const amountIn = CurrencyAmount.fromRawAmount(
    tokenIn,
    ethers.utils.parseUnits(tokenInAmount.toString(), tokenInDecimals).toString(),
  );

  console.log('Amount conversion:', {
    original: tokenInAmount,
    decimals: tokenInDecimals,
    wei: amountIn.quotient.toString(),
    formatted: amountIn.toExact(),
  });

  // Get quote from AlphaRouter (supports both single and multi-hop)
  const slippagePercent = new Percent(50, 10000); // 0.5% slippage

  console.log('Getting route from AlphaRouter...');
  const routeResult = await router.route(amountIn, tokenOut, TradeType.EXACT_INPUT, {
    recipient,
    slippageTolerance: slippagePercent,
    deadline: Math.floor(Date.now() / 1000 + 1800), // 30 minutes from now
    type: SwapType.SWAP_ROUTER_02,
  });

  if (!routeResult || !routeResult.quote) {
    throw new Error(
      'Failed to get quote from Uniswap. No valid route found for this token pair (getUniswapQuote)',
    );
  }

  const bestQuote = ethers.BigNumber.from(routeResult.quote.quotient.toString());

  // Calculate minimum output with slippage
  const amountOutMin = ethers.BigNumber.from(routeResult.quoteGasAdjusted.quotient.toString())
    .mul(10000 - 50)
    .div(10000); // 0.5% slippage

  console.log('Route details:', {
    route: routeResult.route.map((r) => ({
      protocol: r.protocol,
      pools:
        'pools' in r.route
          ? r.route.pools.map((p: any) => ({
              token0: p.token0.symbol || p.token0.address,
              token1: p.token1.symbol || p.token1.address,
              fee: 'fee' in p ? p.fee : 'N/A',
            }))
          : 'pairs' in r.route
            ? r.route.pairs.map((p: any) => ({
                token0: p.token0.symbol || p.token0.address,
                token1: p.token1.symbol || p.token1.address,
                fee: 'V2',
              }))
            : [],
    })),
    quote: {
      raw: bestQuote.toString(),
      formatted: ethers.utils.formatUnits(bestQuote, tokenOutDecimals),
    },
    minimumOutput: {
      raw: amountOutMin.toString(),
      formatted: ethers.utils.formatUnits(amountOutMin, tokenOutDecimals),
    },
    estimatedGasUsedUSD: routeResult.estimatedGasUsedUSD.toFixed(2),
  });

  // For compatibility, we'll use the first pool's fee as bestFee
  // In multi-hop scenarios, this represents the first hop's fee
  let bestFee = 3000; // Default to 0.3%
  if (routeResult.route.length > 0) {
    const firstRoute = routeResult.route[0].route;
    if ('pools' in firstRoute && firstRoute.pools.length > 0) {
      const firstPool = firstRoute.pools[0];
      if ('fee' in firstPool) {
        bestFee = firstPool.fee;
      }
    }
  }

  return {
    bestQuote,
    bestFee,
    amountOutMin,
    route: routeResult,
  };
};
