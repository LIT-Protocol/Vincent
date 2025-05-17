import { formatUnits } from 'viem';

import { getUniswapQuote } from '../src/lib/policy-helpers/get-uniswap-quote';
import { getEnv } from './test-config';

const RPC_URL_FOR_UNISWAP = getEnv('RPC_URL_FOR_UNISWAP');

describe('getUniswapQuote', () => {
  it('should get a quote for WBTC to WETH', async () => {
    // Setup
    const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const WBTC_DECIMALS = 8;
    const WETH_DECIMALS = 18;
    const WBTC_AMOUNT = 1; // 1 WBTC

    // Execute
    const result = await getUniswapQuote({
      tokenInAddress: WBTC_ADDRESS,
      tokenInDecimals: WBTC_DECIMALS,
      tokenInAmount: WBTC_AMOUNT,
      tokenOutAddress: WETH_ADDRESS,
      tokenOutDecimals: WETH_DECIMALS,
      rpcUrl: RPC_URL_FOR_UNISWAP,
      chainId: 1, // Ethereum mainnet
    });

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('bigint');
    expect(result).toBeGreaterThan(0n);

    // Log for human verification
    console.log(`1 WBTC in WETH: ${formatUnits(result, WETH_DECIMALS)} WETH`);
  }, 30000); // Longer timeout for Uniswap quote

  it('should throw error for unsupported chain', async () => {
    // Setup
    const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const WBTC_DECIMALS = 8;
    const WETH_DECIMALS = 18;
    const WBTC_AMOUNT = 1;

    // Execute and Assert
    await expect(
      getUniswapQuote({
        tokenInAddress: WBTC_ADDRESS,
        tokenInDecimals: WBTC_DECIMALS,
        tokenInAmount: WBTC_AMOUNT,
        tokenOutAddress: WETH_ADDRESS,
        tokenOutDecimals: WETH_DECIMALS,
        rpcUrl: RPC_URL_FOR_UNISWAP,
        chainId: 999999, // Unsupported chain
      }),
    ).rejects.toThrow('Unsupported chainId: 999999');
  });
});
