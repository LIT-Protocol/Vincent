import { createPublicClient, http, getContract, parseAbi } from 'viem';
import { Token } from '@uniswap/sdk-core';
import { computePoolAddress, FeeAmount } from '@uniswap/v3-sdk';

const ETH_MAINNET_POOL_FACTORY_CONTRACT_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

const POOL_ABI = parseAbi([
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function fee() view returns (uint24)',
  'function liquidity() view returns (uint128)',
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
]);

export const getUniswapPoolMetadata = async ({
  ethRpcUrl,
  tokenInAddress,
  tokenInDecimals,
  tokenOutAddress,
  tokenOutDecimals,
  poolFee,
}: {
  ethRpcUrl: string;
  tokenInAddress: string;
  tokenInDecimals: number;
  tokenOutAddress: string;
  tokenOutDecimals: number;
  poolFee: FeeAmount;
}): Promise<{
  fee: number;
  liquidity: bigint;
  sqrtPriceX96: bigint;
  tick: number;
}> => {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: ETH_MAINNET_POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: new Token(1, tokenInAddress, tokenInDecimals),
    tokenB: new Token(1, tokenOutAddress, tokenOutDecimals),
    fee: poolFee ?? FeeAmount.MEDIUM,
  });

  const client = createPublicClient({
    transport: http(ethRpcUrl),
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
    `Uniswap pool data tokenInAddress: ${tokenInAddress}, tokenOutAddress: ${tokenOutAddress}, Fee: ${fee}, Liquidity: ${liquidity}, Slot0: ${slot0} (getUniswapQuote)`,
  );

  return {
    fee,
    liquidity,
    sqrtPriceX96: slot0[0],
    tick: slot0[1],
  };
};
