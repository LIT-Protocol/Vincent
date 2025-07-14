import { getUniswapQuote } from '../tool-helpers/get-uniswap-quote';

export const checkUniswapMultihopPoolsExist = async ({
  rpcUrl,
  chainId,
  tokenInAddress,
  tokenInDecimals,
  tokenInAmount,
  tokenOutAddress,
  tokenOutDecimals,
  path,
}: {
  rpcUrl: string;
  chainId: number;
  tokenInAddress: `0x${string}`;
  tokenInDecimals: number;
  tokenInAmount: number;
  tokenOutAddress: `0x${string}`;
  tokenOutDecimals: number;
  path: Array<{ tokenAddress: string; fee: number }>;
}) => {
  try {
    // Build the full token chain for validation
    const tokens: string[] = [tokenInAddress];
    for (const hop of path) {
      tokens.push(hop.tokenAddress);
    }
    tokens.push(tokenOutAddress);

    // Check each consecutive pair has a valid pool
    for (let i = 0; i < tokens.length - 1; i++) {
      const tokenA = tokens[i] as `0x${string}`;
      const tokenB = tokens[i + 1] as `0x${string}`;

      // Use a small amount for testing pool existence
      const testAmount = i === 0 ? tokenInAmount : 1;
      const decimalsA = i === 0 ? tokenInDecimals : 18; // Default to 18 for intermediate tokens
      const decimalsB = i === tokens.length - 2 ? tokenOutDecimals : 18;

      await getUniswapQuote({
        rpcUrl,
        chainId,
        tokenInAddress: tokenA,
        tokenInDecimals: decimalsA,
        tokenInAmount: testAmount,
        tokenOutAddress: tokenB,
        tokenOutDecimals: decimalsB,
      });
    }
    return true;
  } catch (error) {
    throw new Error(
      `No valid Uniswap V3 pools found for multihop path with sufficient liquidity: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
