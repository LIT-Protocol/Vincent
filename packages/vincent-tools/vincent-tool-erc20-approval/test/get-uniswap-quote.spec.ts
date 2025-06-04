import { getUniswapQuote } from '../src/lib/tool-helpers/get-uniswap-quote';
import { getEnv } from './test-config';

describe('getUniswapQuote', () => {
  const rpcUrl = getEnv('RPC_URL_FOR_UNISWAP');
  const chainId = 1; // Ethereum mainnet

  // WETH/USDC pool
  const tokenInAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // WETH
  const tokenInDecimals = 18;
  const tokenOutAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC
  const tokenOutDecimals = 6;
  const tokenInAmount = 0.1; // 0.1 WETH

  it('should get quote for WETH to USDC swap', async () => {
    // Execute
    const result = await getUniswapQuote({
      rpcUrl,
      chainId,
      tokenInAddress,
      tokenInDecimals,
      tokenInAmount,
      tokenOutAddress,
      tokenOutDecimals,
    });

    // Log the result for manual verification
    console.log('Uniswap Quote Result:', {
      swapQuote: result.swapQuote.toString(),
      tokenInAddress: result.uniswapTokenIn.address,
      tokenOutAddress: result.uniswapTokenOut.address,
      route: result.uniswapSwapRoute,
    });

    // Basic assertions
    expect(result).toBeDefined();
    expect(result.swapQuote).toBeDefined();
    expect(result.uniswapTokenIn.address).toBe(tokenInAddress);
    expect(result.uniswapTokenOut.address).toBe(tokenOutAddress);
    expect(result.uniswapSwapRoute).toBeDefined();
  });
});
