import { ethers } from 'ethers';

import { checkSpendLimit } from '../../src/lib/lit-actions/utils/check-spend-limit';

describe('checkSpendLimit', () => {
    it('should return true to show that the spend limit is not exceeded', async () => {
        const yellowstoneProvider = new ethers.providers.JsonRpcProvider(process.env.YELLOWSTONE_RPC_URL);
        const appId = '1';
        const amountInUsd = ethers.BigNumber.from('100000000');
        const maxSpendingLimitInUsdCents = ethers.BigNumber.from('1000000000');
        const spendingLimitDuration = ethers.BigNumber.from(86400);
        const pkpEthAddress = '0x7122eeed6472409d52eA93c16a25af28Ff69c3cE';

        const spendLimit = await checkSpendLimit(yellowstoneProvider, appId, amountInUsd, maxSpendingLimitInUsdCents, spendingLimitDuration, pkpEthAddress);
        expect(spendLimit).toBe(true);
    });

    it('should return false to show that the spend limit is exceeded', async () => {
        const yellowstoneProvider = new ethers.providers.JsonRpcProvider(process.env.YELLOWSTONE_RPC_URL);
        const appId = '1';
        const amountInUsd = ethers.BigNumber.from('1000000000');
        const maxSpendingLimitInUsdCents = ethers.BigNumber.from('100000000');
        const spendingLimitDuration = ethers.BigNumber.from(86400);
        const pkpEthAddress = '0x7122eeed6472409d52eA93c16a25af28Ff69c3cE';

        const spendLimit = await checkSpendLimit(yellowstoneProvider, appId, amountInUsd, maxSpendingLimitInUsdCents, spendingLimitDuration, pkpEthAddress);
        expect(spendLimit).toBe(false);
    });
});