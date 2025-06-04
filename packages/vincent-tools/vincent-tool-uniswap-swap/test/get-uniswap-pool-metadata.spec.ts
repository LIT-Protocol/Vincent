import { getUniswapPoolMetadata } from '../src/lib/tool-helpers/get-uniswap-pool-metadata';
import { getEnv } from './test-config';

describe('getUniswapPoolMetadata', () => {
  const rpcUrl = getEnv('RPC_URL_FOR_UNISWAP');
  const chainId = 1; // Ethereum mainnet

  // WETH/USDC pool
  const tokenInAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH
  const tokenInDecimals = 18;
  const tokenOutAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC
  const tokenOutDecimals = 6;

  it('should get pool metadata for WETH/USDC pool', async () => {
    // Execute
    const result = await getUniswapPoolMetadata({
      rpcUrl,
      chainId,
      tokenInAddress,
      tokenInDecimals,
      tokenOutAddress,
      tokenOutDecimals,
    });

    // Log the result for manual verification
    console.log('Pool Metadata Result:', {
      fee: result.fee,
      liquidity: result.liquidity.toString(),
      sqrtPriceX96: result.sqrtPriceX96.toString(),
      tick: result.tick,
    });

    // Basic assertions
    expect(result).toBeDefined();
    expect(result.fee).toBeDefined();
    expect(result.liquidity).toBeDefined();
    expect(result.sqrtPriceX96).toBeDefined();
    expect(result.tick).toBeDefined();
  });
});
