import type { Address, PublicClient } from 'viem';

import { formatUnits } from 'viem';

import { AAVE_POOL_RESERVE_ABI, getPoolAddress, resolveAllowlistedMarkets } from '../utils/aave';
import { ERC20_ABI } from '../utils/erc20';

export type PoolCandidate = {
  asset: Address;
  symbol: string;
  apr: number;
  totalSupply: number;
  decimals: number;
  aTokenAddress: Address;
};

export async function selectTopPool(params: {
  client: PublicClient;
  chainId: number;
  allowlistSymbols: string[];
}): Promise<PoolCandidate> {
  const { client, chainId, allowlistSymbols } = params;
  const pool = getPoolAddress(chainId);
  const allowlisted = resolveAllowlistedMarkets(chainId, allowlistSymbols);

  if (allowlisted.length === 0) {
    throw new Error('No allowlisted markets available on this chain.');
  }

  const candidates: PoolCandidate[] = [];

  for (const token of allowlisted) {
    const reserveData = (await client.readContract({
      address: pool,
      abi: AAVE_POOL_RESERVE_ABI,
      functionName: 'getReserveData',
      args: [token.address],
    })) as {
      currentLiquidityRate: bigint;
      aTokenAddress: Address;
    };

    const [totalSupply, decimals] = await Promise.all([
      client.readContract({
        address: reserveData.aTokenAddress,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      }) as Promise<bigint>,
      client.readContract({
        address: token.address,
        abi: ERC20_ABI,
        functionName: 'decimals',
      }) as Promise<number>,
    ]);

    const apr = Number(reserveData.currentLiquidityRate) / 1e27;
    const normalizedSupply = Number(formatUnits(totalSupply, decimals));

    if (normalizedSupply >= 1_000_000) {
      candidates.push({
        asset: token.address,
        symbol: token.symbol,
        apr,
        totalSupply: normalizedSupply,
        decimals,
        aTokenAddress: reserveData.aTokenAddress,
      });
    }
  }

  if (candidates.length === 0) {
    throw new Error('No pools meet the minimum liquidity threshold.');
  }

  candidates.sort((a, b) => b.apr - a.apr);
  return candidates[0];
}
