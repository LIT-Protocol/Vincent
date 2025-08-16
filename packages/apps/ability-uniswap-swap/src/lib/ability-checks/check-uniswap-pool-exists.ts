// import { FeeAmount } from '@uniswap/v3-sdk';

import { getUniswapQuote } from '../ability-helpers/get-uniswap-quote';

export const checkUniswapPoolExists = async ({
  rpcUrl,
  chainId,
  tokenInAddress,
  tokenInDecimals,
  tokenInAmount,
  tokenOutAddress,
  tokenOutDecimals,
  pkpEthAddress,
}: {
  rpcUrl: string;
  chainId: number;
  tokenInAddress: `0x${string}`;
  tokenInDecimals: number;
  tokenInAmount: number;
  tokenOutAddress: `0x${string}`;
  tokenOutDecimals: number;
  pkpEthAddress: string;
}) => {
  try {
    await getUniswapQuote({
      rpcUrl,
      chainId,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
      recipient: pkpEthAddress,
    });
    return true;
  } catch (error) {
    throw new Error(
      `No valid Uniswap V3 pool found for token pair tokenInAddress: ${tokenInAddress}, tokenOutAddress: ${tokenOutAddress} with sufficient liquidity for amount tokenInAmount: ${tokenInAmount}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
