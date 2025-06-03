import { TradeType, CurrencyAmount, Token, CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core';
import { FeeAmount, Pool, Route, SwapQuoter } from '@uniswap/v3-sdk';
import { parseUnits, createPublicClient, decodeAbiParameters, http } from 'viem';

import { getUniswapPoolMetadata } from './get-uniswap-pool-metadata';

declare const Lit: {
  Actions: {
    runOnce: (
      params: {
        waitForResponse: boolean;
        name: string;
      },
      callback: () => Promise<unknown>,
    ) => Promise<unknown>;
  };
};

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
    {
      useQuoterV2: true,
    },
  );
  console.log('Uniswap Quote Call Parameters', {
    calldata,
  });

  const quoteCallReturnDataResponse = await Lit.Actions.runOnce(
    { waitForResponse: true, name: 'getUniswapQuote' },
    async () => {
      try {
        const client = createPublicClient({
          transport: http(rpcUrl),
        });

        const quoterAddress = CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP]
          .quoterAddress as `0x${string}`;
        console.log(`Using Quoter Address: ${quoterAddress} (getUniswapQuote)`);

        const quoteCallReturnData = await client.call({
          to: quoterAddress,
          data: calldata as `0x${string}`,
        });

        return JSON.stringify({
          status: 'success',
          quoteCallReturnData,
        });
      } catch (error) {
        return JSON.stringify({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  const parsedQuoteCallReturnData = JSON.parse(quoteCallReturnDataResponse as string);
  if (parsedQuoteCallReturnData.status === 'error') {
    throw new Error(
      `Error getting Uniswap quote: ${parsedQuoteCallReturnData.error} (getUniswapQuote)`,
    );
  }
  console.log('Uniswap Quote Call Return Data', {
    parsedQuoteCallReturnData,
  });
  const { quoteCallReturnData } = parsedQuoteCallReturnData;

  if (!quoteCallReturnData) {
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
