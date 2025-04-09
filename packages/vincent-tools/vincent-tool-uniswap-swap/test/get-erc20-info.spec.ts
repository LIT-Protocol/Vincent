import { ethers } from 'ethers';

import { getErc20Info } from '../src/lib/lit-actions/utils/get-erc20-info';

describe('getErc20Info', () => {
    const BASE_RPC_URL = process.env.BASE_RPC_URL;
    const userRpcProvider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
    const BASE_WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

    it('should return the correct ERC20 info', async () => {
        const erc20Info = await getErc20Info(userRpcProvider, BASE_WETH_ADDRESS);
        expect(erc20Info).toEqual(expect.objectContaining({ decimals: 18 }));
    });
});