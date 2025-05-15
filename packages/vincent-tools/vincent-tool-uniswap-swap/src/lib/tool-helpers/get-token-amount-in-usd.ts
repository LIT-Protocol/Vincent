import { createPublicClient, http, parseUnits, parseAbi, formatUnits } from 'viem';
import { FeeAmount } from '@uniswap/v3-sdk';

import { getUniswapQuote } from './get-uniswap-quote';

const ETH_MAINNET_WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
/**
 * Source: https://docs.chain.link/data-feeds/price-feeds/addresses/?network=ethereum&page=1&search=ETH%2FUSD
 */
const ETH_MAINNET_ETH_USD_CHAINLINK_FEED = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';

const CHAINLINK_AGGREGATOR_ABI = parseAbi([
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
]);

export const getTokenAmountInUsd = async ({
  ethRpcUrl,
  tokenAddress,
  tokenAmount,
  tokenDecimals,
  poolFee,
}: {
  ethRpcUrl: string;
  tokenAddress: string;
  tokenDecimals: number;
  tokenAmount: bigint;
  poolFee: FeeAmount;
}): Promise<bigint> => {
  // Special case for WETH - no need to get a quote since it's already in ETH terms
  if (tokenAddress.toLowerCase() === ETH_MAINNET_WETH_ADDRESS.toLowerCase()) {
    console.log(`Token is WETH, using amount directly: ${tokenAmount} (getTokenAmountInUsd)`);
    const amountInWeth = parseUnits(tokenAmount.toString(), tokenDecimals);
    return calculateUsdValue({ ethRpcUrl, amountInWeth });
  }

  console.log(
    `Getting price in WETH from Uniswap for tokenAmount: ${tokenAmount} tokenAddress: ${tokenAddress} (getTokenAmountInUsd)`,
  );
  const { swapQuote: amountInWeth } = await getUniswapQuote({
    tokenInAddress: tokenAddress,
    tokenInDecimals: tokenDecimals,
    tokenInAmount: tokenAmount,
    tokenOutAddress: ETH_MAINNET_WETH_ADDRESS,
    tokenOutDecimals: 18,
    ethRpcUrl,
    poolFee,
  });

  // Convert WETH amount to USD
  console.log(`Amount in WETH: ${formatUnits(amountInWeth, 18)} (getTokenAmountInUsd)`);
  return calculateUsdValue({ ethRpcUrl, amountInWeth });
};

const getEthUsdPriceFromChainlink = async ({
  ethRpcUrl,
}: {
  ethRpcUrl: string;
}): Promise<bigint> => {
  const client = createPublicClient({
    transport: http(ethRpcUrl),
  });

  const [_, answer] = await client.readContract({
    address: ETH_MAINNET_ETH_USD_CHAINLINK_FEED,
    abi: CHAINLINK_AGGREGATOR_ABI,
    functionName: 'latestRoundData',
  });

  return answer;
};

const calculateUsdValue = async ({
  ethRpcUrl,
  amountInWeth,
}: {
  ethRpcUrl: string;
  amountInWeth: bigint;
}): Promise<bigint> => {
  const ethPriceInUsd = await getEthUsdPriceFromChainlink({ ethRpcUrl });
  console.log(`ETH price in USD 8 decimals (calculateUsdValue): ${ethPriceInUsd.toString()}`);

  // Calculate USD value (8 decimals precision)
  const CHAINLINK_DECIMALS = 8n;
  const WETH_DECIMALS = 18n; // WETH decimals
  const amountInUsd = (amountInWeth * ethPriceInUsd) / 10n ** WETH_DECIMALS;
  console.log(
    `Token amount in USD 8 decimals: $${formatUnits(amountInUsd, Number(CHAINLINK_DECIMALS))} (calculateUsdValue)`,
  );

  return amountInUsd;
};
