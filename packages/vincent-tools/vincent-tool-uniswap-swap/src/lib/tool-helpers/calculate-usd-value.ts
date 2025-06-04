import { ethers } from 'ethers';

import { getEthUsdPriceFromChainlink } from '.';

export const calculateUsdValue = async ({
  ethRpcUrl,
  chainlinkPriceFeedAddress,
  amountInWeth,
}: {
  ethRpcUrl: string;
  chainlinkPriceFeedAddress: string;
  amountInWeth: ethers.BigNumber;
}): Promise<ethers.BigNumber> => {
  const ethPriceInUsd = await getEthUsdPriceFromChainlink({ ethRpcUrl, chainlinkPriceFeedAddress });

  // Calculate USD value (8 decimals precision)
  const CHAINLINK_DECIMALS = 8;
  const WETH_DECIMALS = 18; // WETH decimals
  const amountInUsd = amountInWeth
    .mul(ethPriceInUsd)
    .div(ethers.utils.parseUnits('1', WETH_DECIMALS));
  console.log(`Calculate token amount in USDC (calculateUsdValue)`, {
    tokenAmountInWeth: ethers.utils.formatUnits(amountInWeth, WETH_DECIMALS),
    ethPriceInUsd: ethers.utils.formatUnits(ethPriceInUsd, CHAINLINK_DECIMALS),
    tokenAmountInUsd: ethers.utils.formatUnits(amountInUsd, CHAINLINK_DECIMALS),
  });

  return amountInUsd;
};
