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
  console.log('Getting Uniswap Quote', {
    rpcUrl,
    chainId,
    tokenInAddress,
    tokenInDecimals,
    tokenInAmount,
    tokenOutAddress,
    tokenOutDecimals,
    poolFee,
  });

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

  console.log('Uniswap Pool', {
    uniswapPool,
  });

  const uniswapSwapRoute = new Route([uniswapPool], uniswapTokenIn, uniswapTokenOut);

  console.log('Uniswap Swap Route', {
    uniswapSwapRoute,
  });

  const { calldata } = SwapQuoter.quoteCallParameters(
    uniswapSwapRoute,
    CurrencyAmount.fromRawAmount(
      uniswapTokenIn,
      parseUnits(tokenInAmount.toString(), tokenInDecimals).toString(),
    ),
    TradeType.EXACT_INPUT,
    // TODO Don't think this is needed, we should be using v3,
    // but this was from the Uniswap docs
    // https://docs.uniswap.org/sdk/v3/guides/swaps/quoting
    // {
    //   useQuoterV2: true,
    // },
  );

  console.log('Uniswap Quote Call Parameters', {
    calldata,
  });

  const client = createPublicClient({
    transport: http(rpcUrl),
  });

  const quoteCallReturnData = await client.call({
    to: CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP]
      .quoterAddress as `0x${string}`,
    data: calldata as `0x${string}`,
  });

  console.log('Uniswap Quote Call Return Data', {
    quoteCallReturnData,
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
