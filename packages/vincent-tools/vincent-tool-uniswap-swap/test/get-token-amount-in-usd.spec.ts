import { formatUnits } from 'viem';

import { getTokenAmountInUsd } from '../src/lib/tool-helpers/get-token-amount-in-usd';
import { getEnv } from './test-config';

const ETH_RPC_URL = getEnv('ETH_RPC_URL');
const RPC_URL_FOR_UNISWAP = getEnv('RPC_URL_FOR_UNISWAP');

describe('getTokenAmountInUsd', () => {
  it('should calculate WETH amount in USD using Chainlink', async () => {
    // Setup
    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const tokenDecimals = 18;
    const tokenAmount = 0.5; // 0.5 WETH

    // Execute
    const result = await getTokenAmountInUsd({
      ethRpcUrl: ETH_RPC_URL,
      rpcUrlForUniswap: RPC_URL_FOR_UNISWAP,
      chainIdForUniswap: 1,
      tokenAddress: WETH_ADDRESS,
      tokenAmount,
      tokenDecimals,
    });

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('bigint');
    expect(result).toBeGreaterThan(0n);

    // Log for human verification
    console.log(`0.5 WETH in USD: $${formatUnits(result, 8)}`);
  }, 15000); // Increased timeout for RPC call

  it('should calculate WBTC amount in USD using Uniswap', async () => {
    // Setup - using USDC as a real token
    const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
    const tokenDecimals = 8; // WBTC has 8 decimals
    const tokenAmount = 1; // 1 WBTC

    // Execute
    const result = await getTokenAmountInUsd({
      ethRpcUrl: ETH_RPC_URL,
      rpcUrlForUniswap: RPC_URL_FOR_UNISWAP,
      chainIdForUniswap: 1,
      tokenAddress: WBTC_ADDRESS,
      tokenDecimals,
      tokenAmount,
    });

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('bigint');
    expect(result).toBeGreaterThan(0n);
    console.log(`1 WBTC in USD: $${formatUnits(result, 8)}`);
  }, 30000); // Longer timeout for Uniswap quote
});
