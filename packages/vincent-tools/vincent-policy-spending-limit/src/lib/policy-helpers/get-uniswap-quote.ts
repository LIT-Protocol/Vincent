import { TradeType, CurrencyAmount, Token, CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core';
import { FeeAmount, Pool, Route, SwapQuoter } from '@uniswap/v3-sdk';
import { parseUnits, createPublicClient, decodeAbiParameters, http } from 'viem';

import { getUniswapPoolMetadata } from './get-uniswap-pool-metadata';

export const getUniswapQuote = async ({
  rpcUrl,
  chainId,
  tokenInAddress,
  tokenInDecimals,
  tokenInAmount,
  tokenOutAddress,
  tokenOutDecimals,
  poolFee,
}: {
  rpcUrl: string;
  chainId: number;
  tokenInAddress: string;
  tokenInDecimals: number;
  tokenInAmount: number;
  tokenOutAddress: string;
  tokenOutDecimals: number;
  poolFee?: FeeAmount;
}): Promise<{
  swapQuote: bigint;
  uniswapSwapRoute: Route<Token, Token>;
  uniswapTokenIn: Token;
  uniswapTokenOut: Token;
}> => {
  if (CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP] === undefined) {
    throw new Error(`Unsupported chainId: ${chainId} (getUniswapQuote)`);
  }

  const { fee, liquidity, sqrtPriceX96, tick } = await getUniswapPoolMetadata({
    rpcUrl,
    chainId,
    tokenInAddress,
    tokenInDecimals,
    tokenOutAddress,
    tokenOutDecimals,
    poolFee,
  });

  const uniswapTokenIn = new Token(chainId, tokenInAddress, tokenInDecimals);
  const uniswapTokenOut = new Token(chainId, tokenOutAddress, tokenOutDecimals);

  const uniswapPool = new Pool(
    uniswapTokenIn,
    uniswapTokenOut,
    fee,
    sqrtPriceX96.toString(),
    liquidity.toString(),
    tick,
  );

  const uniswapSwapRoute = new Route([uniswapPool], uniswapTokenIn, uniswapTokenOut);

  const { calldata } = SwapQuoter.quoteCallParameters(
    uniswapSwapRoute,
    CurrencyAmount.fromRawAmount(
      uniswapTokenIn,
      parseUnits(tokenInAmount.toString(), tokenInDecimals).toString(),
    ),
    TradeType.EXACT_INPUT,
    {
      useQuoterV2: true,
    },
  );

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  const quoteCallReturnData = await client.call({
    to: CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP]
      .quoterAddress as `0x${string}`,
    data: calldata as `0x${string}`,
  });

  if (!quoteCallReturnData.data) {
    throw new Error('No data returned from uniswap quote call (getUniswapQuote)');
  }

  const [swapQuote] = decodeAbiParameters([{ type: 'uint256' }], quoteCallReturnData.data);

  console.log(`Uniswap quote: ${swapQuote} (getUniswapQuote)`);

  return {
    swapQuote,
    uniswapSwapRoute,
    uniswapTokenIn,
    uniswapTokenOut,
  };
};
