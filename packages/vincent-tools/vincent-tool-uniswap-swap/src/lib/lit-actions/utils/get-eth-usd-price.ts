import { ethers } from 'ethers';

import { ETH_MAINNET_ETH_USD_CHAINLINK_FEED } from '.';

export const getEthUsdPrice = async (): Promise<{ ethPriceInUsd: ethers.BigNumber }> => {
    const provider = new ethers.providers.JsonRpcProvider(
        await Lit.Actions.getRpcUrl({ chain: 'ethereum' })
    );

    const CHAINLINK_AGGREGATOR_ABI = [
        'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
    ];

    const aggregator = new ethers.Contract(ETH_MAINNET_ETH_USD_CHAINLINK_FEED, CHAINLINK_AGGREGATOR_ABI, provider);
    const roundData = await aggregator.latestRoundData();
    const price = ethers.BigNumber.from(roundData.answer);

    return { ethPriceInUsd: price };
}; 