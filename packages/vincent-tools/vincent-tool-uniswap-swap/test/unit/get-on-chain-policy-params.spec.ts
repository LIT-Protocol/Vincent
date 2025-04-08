import { ethers } from "ethers";
import { VincentToolPolicyError } from "@lit-protocol/vincent-tool";

import { getOnChainPolicyParams } from "../../src/lib/lit-actions/utils/get-on-chain-policy-params";

describe('getOnChainPolicyParams', () => {
    it('should correctly parse the maxDailySpendingLimitInUsdCents policy parameter', async () => {
        const MAX_DAILY_SPENDING_LIMIT_IN_USD_CENTS = '1000000000'; // $10 USD (8 decimals)
        const mockMaxDailySpendingLimitInUsdCents = ethers.utils.defaultAbiCoder.encode(['uint256'], [MAX_DAILY_SPENDING_LIMIT_IN_USD_CENTS]);

        const getOnChainPolicyParamsResponse = getOnChainPolicyParams([{
            name: 'maxDailySpendingLimitInUsdCents',
            paramType: 2,
            value: mockMaxDailySpendingLimitInUsdCents,
        }]);

        if ('status' in getOnChainPolicyParamsResponse && getOnChainPolicyParamsResponse.status === 'error') {
            throw new Error(`❌ ${JSON.stringify(getOnChainPolicyParamsResponse)}`);
        }

        const { maxDailySpendingLimitInUsdCents } = getOnChainPolicyParamsResponse as {
            maxDailySpendingLimitInUsdCents?: ethers.BigNumber;
        };

        expect(maxDailySpendingLimitInUsdCents).toMatchObject(ethers.BigNumber.from(MAX_DAILY_SPENDING_LIMIT_IN_USD_CENTS));
    })

    it('should throw an Unexpected parameter type error if maxDailySpendingLimitInUsdCents policy parameter is not a uint256', async () => {
        const MAX_DAILY_SPENDING_LIMIT_IN_USD_CENTS = '1000000000'; // $10 USD (8 decimals)
        const mockMaxDailySpendingLimitInUsdCents = ethers.utils.defaultAbiCoder.encode(['string'], [MAX_DAILY_SPENDING_LIMIT_IN_USD_CENTS]);

        const getOnChainPolicyParamsResponse = getOnChainPolicyParams([{
            name: 'maxDailySpendingLimitInUsdCents',
            paramType: 8, // Parameter type 8 = STRING
            value: mockMaxDailySpendingLimitInUsdCents,
        }]);

        expect(getOnChainPolicyParamsResponse).toBeDefined();
        expect((getOnChainPolicyParamsResponse as VincentToolPolicyError).allow).toBe(false);
        expect((getOnChainPolicyParamsResponse as VincentToolPolicyError).details[0]).toBe('Unexpected parameter type for maxDailySpendingLimitInUsdCents: 8');
    })
});