import { ethers } from 'ethers';
import { WETH9 } from '@uniswap/sdk-core';

import { calculateUsdValue } from './calculate-usd-value';
import { getUniswapQuote } from './get-uniswap-quote';

/**
 * Source: https://docs.chain.link/data-feeds/price-feeds/addresses/?network=ethereum&page=1&search=ETH%2FUSD
 */
const ETH_MAINNET_ETH_USD_CHAINLINK_FEED = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';

export const getTokenAmountInUsd = async ({
  ethRpcUrl,
  rpcUrlForUniswap,
  chainIdForUniswap,
  tokenAddress,
  tokenAmount,
  tokenDecimals,
}: {
  ethRpcUrl: string;
  rpcUrlForUniswap: string;
  chainIdForUniswap: number;
  tokenAddress: string;
  tokenDecimals: number;
  tokenAmount: number;
}): Promise<ethers.BigNumber> => {
  console.log(`Getting token amount in USD (getTokenAmountInUsd)`, {
    ethRpcUrl,
    rpcUrlForUniswap,
    chainIdForUniswap,
    tokenAddress,
    tokenAmount,
    tokenDecimals,
    ethMainnetWethAddress: WETH9[1].address,
    ethMainnetEthUsdChainlinkFeed: ETH_MAINNET_ETH_USD_CHAINLINK_FEED,
  });

  const provider = new ethers.providers.JsonRpcProvider(rpcUrlForUniswap);
  const tokenInContract = new ethers.Contract(
    tokenAddress,
    ['function symbol() view returns (string)'],
    provider,
  );
  const tokenInSymbol = await tokenInContract.symbol();
  console.log(`tokenInSymbol: ${tokenInSymbol} (getTokenAmountInUsd)`);

  // Special case for WETH - no need to get a quote since it's already in ETH terms
  if (tokenInSymbol.toUpperCase() === 'WETH') {
    console.log(`Token is WETH, using amount directly: ${tokenAmount} (getTokenAmountInUsd)`);
    const amountInWeth = ethers.utils.parseUnits(tokenAmount.toString(), tokenDecimals);
    return calculateUsdValue({
      ethRpcUrl,
      chainlinkPriceFeedAddress: ETH_MAINNET_ETH_USD_CHAINLINK_FEED,
      amountInWeth,
    });
  }

  // Get WETH address for the specific chain
  const wethToken = WETH9[chainIdForUniswap];
  if (!wethToken) {
    throw new Error(`WETH not available on chain ${chainIdForUniswap}`);
  }

  console.log(`Getting price in WETH from Uniswap (getTokenAmountInUsd)`, {
    tokenInAddress: tokenAddress,
    tokenInDecimals: tokenDecimals,
    tokenInAmount: tokenAmount,
    tokenOutAddress: wethToken.address,
    tokenOutDecimals: 18,
    rpcUrl: rpcUrlForUniswap,
    chainId: chainIdForUniswap,
  });

  const amountInWeth = await getUniswapQuote({
    tokenInAddress: tokenAddress,
    tokenInDecimals: tokenDecimals,
    tokenInAmount: tokenAmount,
    tokenOutAddress: wethToken.address,
    tokenOutDecimals: 18,
    rpcUrl: rpcUrlForUniswap,
    chainId: chainIdForUniswap,
  });

  // Convert WETH amount to USD
  const amountInUsdc = await calculateUsdValue({
    ethRpcUrl,
    chainlinkPriceFeedAddress: ETH_MAINNET_ETH_USD_CHAINLINK_FEED,
    amountInWeth: amountInWeth.bestQuote,
  });

  console.log('Calculated token amount in USDC (getTokenAmountInUsd)', {
    amountInWeth: ethers.utils.formatUnits(amountInWeth.bestQuote, 18),
    amountInUsdc: ethers.utils.formatUnits(amountInUsdc, 8),
  });

  return amountInUsdc;
};
