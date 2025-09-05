import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { AlphaRouter, SwapType, SwapRoute } from '@uniswap/smart-order-router';
import { ethers } from 'ethers';

export async function getUniswapQuote({
  rpcUrl,
  tokenInAddress,
  tokenInAmount,
  tokenOutAddress,
  recipient,
  slippageTolerance,
}: {
  rpcUrl: string;
  tokenInAddress: string;
  tokenInAmount: string;
  tokenOutAddress: string;
  recipient: string;
  slippageTolerance?: number;
}): Promise<SwapRoute> {
  const activeTimeouts = new Set<NodeJS.Timeout>();
  const realSetTimeout = global.setTimeout;
  const realClearTimeout = global.clearTimeout;

  global.setTimeout = ((fn: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => {
    const id = realSetTimeout(fn, ms as number, ...args);
    activeTimeouts.add(id);
    return id;
  }) as typeof setTimeout;

  global.clearTimeout = ((id: NodeJS.Timeout) => {
    activeTimeouts.delete(id);
    return realClearTimeout(id);
  }) as typeof clearTimeout;

  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl);
  const [network, tokenInDecimals, tokenOutDecimals] = await Promise.all([
    provider.getNetwork(),
    new ethers.Contract(
      tokenInAddress,
      ['function decimals() view returns (uint8)'],
      provider,
    ).decimals(),
    new ethers.Contract(
      tokenOutAddress,
      ['function decimals() view returns (uint8)'],
      provider,
    ).decimals(),
  ]);
  const chainId = network.chainId;

  const router = new AlphaRouter({ chainId, provider });
  try {
    const tokenIn = new Token(chainId, tokenInAddress, tokenInDecimals);
    const tokenOut = new Token(chainId, tokenOutAddress, tokenOutDecimals);
    const amountIn = CurrencyAmount.fromRawAmount(
      tokenIn,
      ethers.utils.parseUnits(tokenInAmount.toString(), tokenInDecimals).toString(),
    );
    // User provides slippage in basis points (e.g., 50 for 0.5%, 100 for 1%)
    // Default to 50 basis points (0.5%) if not provided
    const slippage = new Percent(slippageTolerance ?? 50, 10_000);

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
    console.log('AlphaRouter completed successfully');
    return routeResult;
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
    global.setTimeout = realSetTimeout;
    global.clearTimeout = realClearTimeout;

    console.log('AlphaRouter cleanup completed');
  }
}
