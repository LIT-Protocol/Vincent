import { formatUnits } from 'viem';

import { getTokenAmountInUsd } from '../src/lib/policy-helpers/get-token-amount-in-usd';
import { getEnv } from './test-config';

const ETH_RPC_URL = getEnv('ETH_RPC_URL');

describe('getTokenAmountInUsd', () => {
  it('should calculate WETH amount in USD using Chainlink', async () => {
    // Setup
    const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
    const tokenAmount = '0.5'; // 0.5 WETH
    const tokenDecimals = 18;

    // Execute
    const result = await getTokenAmountInUsd({
      ethRpcUrl: ETH_RPC_URL,
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
    const tokenAmount = '1'; // 1 WBTC
    const tokenDecimals = 8; // WBTC has 8 decimals

    // Execute
    const result = await getTokenAmountInUsd({
      ethRpcUrl: ETH_RPC_URL,
      tokenAddress: WBTC_ADDRESS,
      tokenAmount,
      tokenDecimals,
    });

    // Assert
    expect(result).toBeDefined();
    expect(typeof result).toBe('bigint');

    expect(result).toBeGreaterThan(0n);
    console.log(`1 WBTC in USD: $${formatUnits(result, 8)}`);
  }, 30000); // Longer timeout for Uniswap quote
});
