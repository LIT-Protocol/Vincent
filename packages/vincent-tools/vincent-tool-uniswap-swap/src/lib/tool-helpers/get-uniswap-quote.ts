import { TradeType, CurrencyAmount, Token } from '@uniswap/sdk-core';
import { FeeAmount, Pool, Route, SwapQuoter } from '@uniswap/v3-sdk';
import { parseUnits, createPublicClient, decodeAbiParameters, http } from 'viem';

import { getUniswapPoolMetadata } from './get-uniswap-pool-metadata';

const ETH_MAINNET_CHAIN_ID = 1;
const ETH_MAINNET_QUOTER_CONTRACT_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

export const getUniswapQuote = async ({
  ethRpcUrl,
  tokenInAddress,
  tokenInDecimals,
  tokenInAmount,
  tokenOutAddress,
  tokenOutDecimals,
  poolFee,
}: {
  ethRpcUrl: string;
  tokenInAddress: string;
  tokenInDecimals: number;
  tokenInAmount: bigint;
  tokenOutAddress: string;
  tokenOutDecimals: number;
  poolFee: FeeAmount;
}): Promise<{
  swapQuote: bigint;
  uniswapSwapRoute: Route<Token, Token>;
  uniswapTokenIn: Token;
  uniswapTokenOut: Token;
}> => {
  const { fee, liquidity, sqrtPriceX96, tick } = await getUniswapPoolMetadata({
    ethRpcUrl,
    tokenInAddress,
    tokenInDecimals,
    tokenOutAddress,
    tokenOutDecimals,
    poolFee: poolFee ?? FeeAmount.MEDIUM,
  });

  const uniswapTokenIn = new Token(ETH_MAINNET_CHAIN_ID, tokenInAddress, tokenInDecimals);
  const uniswapTokenOut = new Token(ETH_MAINNET_CHAIN_ID, tokenOutAddress, tokenOutDecimals);

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
    transport: http(ethRpcUrl),
  });

  const quoteCallReturnData = await client.call({
    to: ETH_MAINNET_QUOTER_CONTRACT_ADDRESS as `0x${string}`,
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
