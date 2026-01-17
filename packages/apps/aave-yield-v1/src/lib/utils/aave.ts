import type { Address } from 'viem';

import { getAaveAddresses, getAvailableMarkets } from '@lit-protocol/vincent-ability-aave';

export const AAVE_POOL_RESERVE_ABI = [
  {
    name: 'getReserveData',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'asset', type: 'address' }],
    outputs: [
      { name: 'configuration', type: 'uint256' },
      { name: 'liquidityIndex', type: 'uint128' },
      { name: 'currentLiquidityRate', type: 'uint128' },
      { name: 'variableBorrowIndex', type: 'uint128' },
      { name: 'currentVariableBorrowRate', type: 'uint128' },
      { name: 'currentStableBorrowRate', type: 'uint128' },
      { name: 'lastUpdateTimestamp', type: 'uint40' },
      { name: 'aTokenAddress', type: 'address' },
      { name: 'stableDebtTokenAddress', type: 'address' },
      { name: 'variableDebtTokenAddress', type: 'address' },
      { name: 'interestRateStrategyAddress', type: 'address' },
      { name: 'id', type: 'uint8' },
    ],
  },
] as const;

export function getPoolAddress(chainId: number): Address {
  return getAaveAddresses(chainId).POOL as Address;
}

export function resolveAllowlistedMarkets(
  chainId: number,
  allowlistSymbols: string[],
): Array<{ symbol: string; address: Address }> {
  const markets = getAvailableMarkets(chainId);
  const allowlist = new Set(allowlistSymbols);

  return Object.entries(markets)
    .filter(([symbol]) => allowlist.has(symbol))
    .map(([symbol, address]) => ({ symbol, address: address as Address }));
}
