import { ethers } from 'ethers';

import { type AddressesByChainIdResponse, getAddressesByChainId } from '.';
import { type VincentToolError } from '@lit-protocol/vincent-tool';

export const getEthUsdPrice = async (): Promise<{ ethPriceInUsd: ethers.BigNumber } | VincentToolError> => {
    const provider = new ethers.providers.JsonRpcProvider(
        await Lit.Actions.getRpcUrl({ chain: 'ethereum' })
    );

    const addressByChainIdResponse = getAddressesByChainId('1');

    if ('status' in addressByChainIdResponse && addressByChainIdResponse.status === 'error') {
        return addressByChainIdResponse;
    }

    const { ETH_USD_CHAINLINK_FEED } = addressByChainIdResponse as AddressesByChainIdResponse;

    const CHAINLINK_AGGREGATOR_ABI = [
        'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
    ];

    const aggregator = new ethers.Contract(ETH_USD_CHAINLINK_FEED!, CHAINLINK_AGGREGATOR_ABI, provider);
    const roundData = await aggregator.latestRoundData();
    const price = ethers.BigNumber.from(roundData.answer);

    return { ethPriceInUsd: price };
}; 