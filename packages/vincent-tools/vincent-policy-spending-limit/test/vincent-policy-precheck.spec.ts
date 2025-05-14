import { PolicyContext } from '@lit-protocol/vincent-tool-sdk/src/lib/types';

import { spendingLimitPolicyPrecheck } from '../src/lib/vincent-policy-precheck';
import * as tokenUsdModule from '../src/lib/policy-helpers/get-token-amount-in-usd';
import { getEnv } from './test-config';

describe('spendingLimitPolicyPrecheck', () => {
  // Setup test variables
  const ETH_RPC_URL = getEnv('ETH_RPC_URL');
  const PKP_ETH_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'; // Example address
  const APP_ID = 123;
  const TOKEN_DECIMALS = 18;
  const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

  // Mock contract instance
  const mockContractRead = {
    read: {
      checkLimit: jest.fn(),
    },
  };

  it('should allow spending when under the daily limit', async () => {
    // Arrange
    const buyAmount = 1_00000000n; // 1.0 tokens with 8 decimals
    const maxDailySpendAmountUsd = 5_00n; // $5.00 with 2 decimals

    const toolParams = {
      pkpEthAddress: PKP_ETH_ADDRESS,
      appId: APP_ID,
      buyAmount,
      ethRpcUrl: ETH_RPC_URL,
      tokenAddress: WETH_ADDRESS,
      tokenDecimals: TOKEN_DECIMALS,
    };

    const userParams = {
      maxDailySpendAmountUsd,
    };

    const context = {} as PolicyContext;

    await spendingLimitPolicyPrecheck({ toolParams, userParams }, context);
  });

  xit('should fail when spending exceeds the daily limit', async () => {
    // Arrange
    const buyAmount = 1000000000n; // 10.0 tokens with 8 decimals
    const maxDailySpendAmountUsd = 50n; // $0.50 with 2 decimals

    // Mock that the amount exceeds the limit
    mockContractRead.read.checkLimit.mockRejectedValue(new Error('SpendLimitExceeded'));

    const toolParams = {
      pkpEthAddress: PKP_ETH_ADDRESS,
      appId: APP_ID,
      ethRpcUrl: ETH_RPC_URL,
      tokenAddress: WETH_ADDRESS,
      tokenDecimals: TOKEN_DECIMALS,
      buyAmount,
    };

    const userParams = {
      maxDailySpendAmountUsd,
    };

    const context = {} as PolicyContext;

    // Act & Assert
    await expect(spendingLimitPolicyPrecheck({ toolParams, userParams }, context)).rejects.toThrow(
      'SpendLimitExceeded',
    );

    expect(tokenUsdModule.getTokenAmountInUsd).toHaveBeenCalledWith({
      ethRpcUrl: ETH_RPC_URL,
      tokenAddress: WETH_ADDRESS,
      tokenDecimals: TOKEN_DECIMALS,
      tokenAmount: buyAmount,
    });

    expect(mockContractRead.read.checkLimit).toHaveBeenCalledWith([
      PKP_ETH_ADDRESS,
      APP_ID,
      buyAmount,
      50000000n, // Adjusted to 8 decimals (50 * 10^6)
    ]);
  });

  xit('should handle different token types and decimals', async () => {
    // Arrange
    const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const USDC_DECIMALS = 6;
    const buyAmount = 5000000n; // 5.0 USDC with 6 decimals
    const maxDailySpendAmountUsd = 1000n; // $10.00 with 2 decimals

    // Mock USD conversion for USDC
    jest.spyOn(tokenUsdModule, 'getTokenAmountInUsd').mockResolvedValue(5000000000n); // $50 with 8 decimals

    const toolParams = {
      pkpEthAddress: PKP_ETH_ADDRESS,
      appId: APP_ID,
      ethRpcUrl: ETH_RPC_URL,
      tokenAddress: USDC_ADDRESS,
      tokenDecimals: USDC_DECIMALS,
      buyAmount,
    };

    const userParams = {
      maxDailySpendAmountUsd,
    };

    const context = {} as PolicyContext;

    // Act
    await spendingLimitPolicyPrecheck({ toolParams, userParams }, context);

    // Assert
    expect(tokenUsdModule.getTokenAmountInUsd).toHaveBeenCalledWith({
      ethRpcUrl: ETH_RPC_URL,
      tokenAddress: USDC_ADDRESS,
      tokenDecimals: USDC_DECIMALS,
      tokenAmount: buyAmount,
    });

    expect(mockContractRead.read.checkLimit).toHaveBeenCalledWith([
      PKP_ETH_ADDRESS,
      APP_ID,
      buyAmount,
      1000000000n, // Adjusted to 8 decimals (1000 * 10^6)
    ]);
  });
});
