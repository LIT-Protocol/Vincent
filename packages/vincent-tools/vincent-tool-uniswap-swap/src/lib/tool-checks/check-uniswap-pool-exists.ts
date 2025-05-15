import { getUniswapQuote } from '../tool-helpers/get-uniswap-quote';

export const checkUniswapPoolExists = async ({
  ethRpcUrl,
  tokenInAddress,
  tokenInDecimals,
  tokenInAmount,
  tokenOutAddress,
  tokenOutDecimals,
}: {
  ethRpcUrl: string;
  tokenInAddress: `0x${string}`;
  tokenInDecimals: number;
  tokenInAmount: bigint;
  tokenOutAddress: `0x${string}`;
  tokenOutDecimals: number;
}) => {
  try {
    await getUniswapQuote({
      ethRpcUrl,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
    });
    return true;
  } catch (error) {
    throw new Error(
      `No valid Uniswap V3 pool found for token pair tokenInAddress: ${tokenInAddress}, tokenOutAddress: ${tokenOutAddress} with sufficient liquidity for amount tokenInAmount: ${tokenInAmount}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
