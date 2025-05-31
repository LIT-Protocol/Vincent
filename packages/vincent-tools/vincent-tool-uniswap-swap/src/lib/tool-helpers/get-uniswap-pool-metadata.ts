import { createPublicClient, http, getContract, parseAbi } from 'viem';
import { CHAIN_TO_ADDRESSES_MAP, Token } from '@uniswap/sdk-core';
import { computePoolAddress, FeeAmount } from '@uniswap/v3-sdk';

const POOL_ABI = parseAbi([
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function fee() view returns (uint24)',
  'function liquidity() view returns (uint128)',
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
]);

export const getUniswapPoolMetadata = async ({
  rpcUrl,
  chainId,
  tokenInAddress,
  tokenInDecimals,
  tokenOutAddress,
  tokenOutDecimals,
  poolFee,
}: {
  rpcUrl: string;
  chainId: number;
  tokenInAddress: string;
  tokenInDecimals: number;
  tokenOutAddress: string;
  tokenOutDecimals: number;
  poolFee?: FeeAmount;
}): Promise<{
  fee: number;
  liquidity: bigint;
  sqrtPriceX96: bigint;
  tick: number;
}> => {
  if (CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP] === undefined) {
    throw new Error(`Unsupported chainId: ${chainId} (getUniswapPoolMetadata)`);
  }

  const v3CoreFactoryAddress = CHAIN_TO_ADDRESSES_MAP[
    chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP
  ].v3CoreFactoryAddress as `0x${string}`;

  const currentPoolAddress = computePoolAddress({
    factoryAddress: v3CoreFactoryAddress,
    tokenA: new Token(chainId, tokenInAddress, tokenInDecimals),
    tokenB: new Token(chainId, tokenOutAddress, tokenOutDecimals),
    fee: poolFee ?? FeeAmount.MEDIUM,
  });

  const client = createPublicClient({
    transport: http(rpcUrl),
  });
  const poolContract = getContract({
    address: currentPoolAddress as `0x${string}`,
    abi: POOL_ABI,
    client,
  });

  const [fee, liquidity, slot0] = await Promise.all([
    poolContract.read.fee(),
    poolContract.read.liquidity(),
    poolContract.read.slot0(),
  ]);
  console.log(
    `Uniswap pool data tokenInAddress: ${tokenInAddress}, tokenOutAddress: ${tokenOutAddress}, Fee: ${fee}, Liquidity: ${liquidity}, Slot0: ${slot0} (getUniswapPoolMetadata)`,
  );

  return {
    fee,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
};
