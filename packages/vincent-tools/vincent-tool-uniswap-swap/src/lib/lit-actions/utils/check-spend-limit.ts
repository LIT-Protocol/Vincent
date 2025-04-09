import { ethers } from 'ethers';
import type { VincentToolError } from '@lit-protocol/vincent-tool';

import { type AddressesByChainIdResponse, getAddressesByChainId } from '.';

export const checkSpendLimit = async (
    yellowstoneProvider: ethers.providers.JsonRpcProvider,
    appId: string,
    amountInUsd: ethers.BigNumber,
    maxSpendingLimitInUsdCents: ethers.BigNumber,
    spendingLimitDuration: ethers.BigNumber,
    pkpEthAddress: string,
): Promise<{ exceedsLimit: boolean } | VincentToolError> => {
    const addressByChainIdResponse = getAddressesByChainId('175188'); // Yellowstone

    if ('status' in addressByChainIdResponse && addressByChainIdResponse.status === 'error') {
        return addressByChainIdResponse;
    }

    const { SPENDING_LIMIT_ADDRESS } = addressByChainIdResponse as AddressesByChainIdResponse;

    const SPENDING_LIMIT_ABI = [
        `function checkLimit(address user, uint256 appId, uint256 amountToSpend, uint256 userMaxSpendLimit, uint256 duration) view returns (bool)`,
        `error SpendLimitExceeded(address user, uint256 appId, uint256 amount, uint256 limit)`,
        `error ZeroAppIdNotAllowed(address user)`,
        `error ZeroDurationQuery(address user)`
    ];

    const spendingLimitContract = new ethers.Contract(
        SPENDING_LIMIT_ADDRESS!,
        SPENDING_LIMIT_ABI,
        yellowstoneProvider
    );

    return {
        exceedsLimit: await spendingLimitContract.checkLimit(
            pkpEthAddress,
            appId,
            amountInUsd,
            maxSpendingLimitInUsdCents,
            spendingLimitDuration
        )
    };
}