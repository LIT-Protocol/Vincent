import { ethers } from 'ethers';

const CHAINLINK_AGGREGATOR_ABI = [
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
];

export const getEthUsdPriceFromChainlink = async ({
  chainlinkPriceFeedAddress,
  ethRpcUrl,
}: {
  chainlinkPriceFeedAddress: string;
  ethRpcUrl: string;
}): Promise<ethers.BigNumber> => {
  console.log(`Getting ETH price in USD from Chainlink (getEthUsdPriceFromChainlink)`, {
    chainlinkPriceFeedAddress,
    ethRpcUrl,
  });

  const provider = new ethers.providers.StaticJsonRpcProvider(ethRpcUrl);
  const contract = new ethers.Contract(
    chainlinkPriceFeedAddress,
    CHAINLINK_AGGREGATOR_ABI,
    provider,
  );
  const [_, answer] = await contract.latestRoundData();
  console.log(`Got ETH price in USD (getEthUsdPriceFromChainlink)`, {
    ethPriceInUsd: ethers.utils.formatUnits(answer, 8),
  });
  return answer;
};
