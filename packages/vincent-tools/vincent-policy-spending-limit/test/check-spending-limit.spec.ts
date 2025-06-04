import { checkIfBuyAmountAllowed } from '../src/lib/policy-helpers/check-spending-limit';
import { getEnv } from './test-config';

const ethRpcUrl = getEnv('ETH_RPC_URL');
const rpcUrlForUniswap = getEnv('RPC_URL_FOR_UNISWAP');

const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const WBTC_DECIMALS = 8;
const AnvilAddress1 = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

describe('checkIfBuyAmountAllowed', () => {
  it('should allow buy amount when under spending limit', async () => {
    const result = await checkIfBuyAmountAllowed({
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap: 1,
      tokenAddress: WBTC_ADDRESS,
      tokenDecimals: WBTC_DECIMALS,
      buyAmount: 1,
      maxDailySpendAmountUsd: 200_000_00,
      pkpEthAddress: AnvilAddress1 as `0x${string}`,
      appId: 1,
    });

    expect(result.buyAmountAllowed).toBe(true);
  });

  it('should not allow buy amount when over spending limit', async () => {
    const result = await checkIfBuyAmountAllowed({
      ethRpcUrl,
      rpcUrlForUniswap,
      chainIdForUniswap: 1,
      tokenAddress: WBTC_ADDRESS,
      tokenDecimals: WBTC_DECIMALS,
      buyAmount: 1,
      maxDailySpendAmountUsd: 10_000_00,
      pkpEthAddress: AnvilAddress1 as `0x${string}`,
      appId: 1,
    });

    expect(result.buyAmountAllowed).toBe(false);
  });
});
