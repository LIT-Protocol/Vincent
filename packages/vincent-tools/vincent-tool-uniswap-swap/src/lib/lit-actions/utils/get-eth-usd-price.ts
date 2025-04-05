import { ethers } from 'ethers';

import { getAddressesByChainId } from '.';

export const getEthUsdPrice = async (): Promise<ethers.BigNumber> => {
    const provider = new ethers.providers.JsonRpcProvider(
        await Lit.Actions.getRpcUrl({ chain: 'ethereum' })
    );

    const { ETH_USD_CHAINLINK_FEED } = getAddressesByChainId('1');

    const CHAINLINK_AGGREGATOR_ABI = [
        'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
    ];

    const aggregator = new ethers.Contract(ETH_USD_CHAINLINK_FEED!, CHAINLINK_AGGREGATOR_ABI, provider);
    const roundData = await aggregator.latestRoundData();
    const price = ethers.BigNumber.from(roundData.answer);

    return price;
}; 