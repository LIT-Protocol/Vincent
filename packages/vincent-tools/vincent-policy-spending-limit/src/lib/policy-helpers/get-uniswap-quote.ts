import { computePoolAddress, FeeAmount } from '@uniswap/v3-sdk';
import { Token, CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core';
import * as IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import * as IUniswapV3QuoterABI from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';
import { getContract, http, parseUnits, createPublicClient } from 'viem';

export const getUniswapQuote = async ({
  tokenInAddress,
  tokenInDecimals,
  tokenInAmount,
  tokenOutAddress,
  tokenOutDecimals,
  poolFee,
  rpcUrl,
  chainId,
}: {
  tokenInAddress: string;
  tokenInDecimals: number;
  tokenInAmount: bigint;
  tokenOutAddress: string;
  tokenOutDecimals: number;
  poolFee?: number;
  rpcUrl: string;
  chainId: number;
}): Promise<bigint> => {
  if (CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP] === undefined) {
    throw new Error(`Unsupported chainId: ${chainId} (getUniswapQuote)`);
  }

  const v3CoreFactoryAddress = CHAIN_TO_ADDRESSES_MAP[
    chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP
  ].v3CoreFactoryAddress as `0x${string}`;
  const quoterAddress = CHAIN_TO_ADDRESSES_MAP[chainId as keyof typeof CHAIN_TO_ADDRESSES_MAP]
    .quoterAddress as `0x${string}`;

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
    abi: IUniswapV3PoolABI.abi,
    client,
  });

  const [token0, token1, fee, liquidity, slot0] = await Promise.all([
    poolContract.read.token0(),
    poolContract.read.token1(),
    poolContract.read.fee(),
    poolContract.read.liquidity(),
    poolContract.read.slot0(),
  ]);
  console.log(
    `Uniswap pool data Token0: ${token0}, Token1: ${token1}, Fee: ${fee}, Liquidity: ${liquidity}, Slot0: ${slot0} (getUniswapQuote)`,
  );

  const quoterContract = getContract({
    address: quoterAddress,
    abi: IUniswapV3QuoterABI.abi,
    client,
  });

  const quotedAmountOut = (await quoterContract.read.quoteExactInputSingle([
    token0,
    token1,
    fee,
    parseUnits(tokenInAmount.toString(), tokenInDecimals),
    0n,
  ])) as bigint;

  console.log(`Quoted amount out: ${quotedAmountOut} (getUniswapQuote)`);
  return quotedAmountOut;
};
