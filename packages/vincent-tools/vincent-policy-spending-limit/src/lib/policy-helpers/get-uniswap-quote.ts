import { computePoolAddress, FeeAmount } from '@uniswap/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import * as IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json';
import * as IUniswapV3QuoterABI from '@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json';
import { getContract, http, parseUnits } from 'viem';
import { createPublicClient } from 'viem';

const ETH_MAINNET_POOL_FACTORY_CONTRACT_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
const ETH_MAINNET_QUOTER_CONTRACT_ADDRESS = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

export const getUniswapQuote = async ({
  tokenInAddress,
  tokenInDecimals,
  tokenInAmount,
  tokenOutAddress,
  tokenOutDecimals,
  poolFee,
  ethRpcUrl,
}: {
  tokenInAddress: string;
  tokenInDecimals: number;
  tokenInAmount: bigint;
  tokenOutAddress: string;
  tokenOutDecimals: number;
  poolFee?: number;
  ethRpcUrl: string;
}): Promise<bigint> => {
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
    address: ETH_MAINNET_QUOTER_CONTRACT_ADDRESS as `0x${string}`,
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
