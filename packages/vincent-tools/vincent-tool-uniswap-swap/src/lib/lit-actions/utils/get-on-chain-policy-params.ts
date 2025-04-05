/* eslint-disable */
import { type PolicyParameter } from '@lit-protocol/vincent-tool';
import { ethers } from 'ethers';

export const getOnChainPolicyParams = (parameters: PolicyParameter[]) => {
    let maxDailySpendingLimitInUsdCents: ethers.BigNumber | undefined;

    for (const parameter of parameters) {
        switch (parameter.name) {
            case 'maxDailySpendingLimitInUsdCents':
                // Parameter type 2 = UINT256
                if (parameter.paramType === 2) {
                    maxDailySpendingLimitInUsdCents = ethers.utils.defaultAbiCoder.decode(['uint256'], parameter.value)[0];
                } else {
                    throw new Error(`Unexpected parameter type for maxDailySpendingLimitInUsdCents: ${parameter.paramType}`);
                }
                break;
        }
    }

    return { maxDailySpendingLimitInUsdCents };
};