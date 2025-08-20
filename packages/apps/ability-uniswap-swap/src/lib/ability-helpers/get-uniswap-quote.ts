import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { AlphaRouter, SwapType, SwapRoute } from '@uniswap/smart-order-router';
import { ethers } from 'ethers';

export async function getUniswapQuote({
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
}> {
  const activeTimeouts = new Set<any>();
  const realSetTimeout = global.setTimeout;
  const realClearTimeout = global.clearTimeout;

  global.setTimeout = ((fn: any, ms?: any, ...args: any[]) => {
    const id = realSetTimeout(fn, ms as any, ...args);
    activeTimeouts.add(id);
    return id;
  }) as unknown as typeof setTimeout;

  global.clearTimeout = ((id: any) => {
    activeTimeouts.delete(id);
    return realClearTimeout(id);
  }) as unknown as typeof clearTimeout;

  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
  const router = new AlphaRouter({ chainId, provider });
  try {
    const tokenIn = new Token(chainId, tokenInAddress, tokenInDecimals);
    const tokenOut = new Token(chainId, tokenOutAddress, tokenOutDecimals);
    const amountIn = CurrencyAmount.fromRawAmount(
      tokenIn,
      ethers.utils.parseUnits(tokenInAmount.toString(), tokenInDecimals).toString(),
    );
    const slippage = new Percent(50, 10_000); // 0.5%

    console.log('Amount conversion:', {
      original: tokenInAmount,
      decimals: tokenInDecimals,
      wei: amountIn.quotient.toString(),
      formatted: amountIn.toExact(),
    });

    console.log('Getting route from AlphaRouter...');
    const routeResult = await router.route(amountIn, tokenOut, TradeType.EXACT_INPUT, {
      recipient,
      slippageTolerance: slippage,
      deadline: Math.floor(Date.now() / 1000 + 1800),
      type: SwapType.SWAP_ROUTER_02,
    });

    if (!routeResult || !routeResult.quote) {
      throw new Error('Failed to get quote from Uniswap (no route)');
    }

    const bestQuote = ethers.BigNumber.from(routeResult.quote.quotient.toString());
    const amountOutMin = ethers.BigNumber.from(routeResult.quoteGasAdjusted.quotient.toString())
      .mul(10000 - 50)
      .div(10000);

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

    let bestFee = 3000;
    if (routeResult.route.length > 0) {
      const first = (routeResult.route[0] as any).route;
      if ('pools' in first && first.pools?.[0]?.fee) bestFee = first.pools[0].fee;
    }

    console.log('AlphaRouter completed successfully');

    return { bestQuote, bestFee, amountOutMin, route: routeResult };
  } finally {
    console.log('Performing cleanup of AlphaRouter resources...');

    provider.removeAllListeners();

    // Clear any timers created during this call
    console.log(`Clearing ${activeTimeouts.size} timeouts`);
    for (const id of Array.from(activeTimeouts)) {
      realClearTimeout(id);
    }
    activeTimeouts.clear();

    // Restore globals to avoid side effects
    global.setTimeout = realSetTimeout as any;
    global.clearTimeout = realClearTimeout as any;

    console.log('AlphaRouter cleanup completed');
  }
}
