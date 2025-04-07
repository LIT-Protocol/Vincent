import { ethers } from "ethers";

import { getTokenAmountInUsd } from "../../src/lib/lit-actions/utils/get-token-amount-in-usd";

// Mock Lit.Actions interface
interface LitActions {
    getRpcUrl: jest.Mock;
}

// Mock the global Lit object
const mockLitActions: LitActions = {
    getRpcUrl: jest.fn(),
};

// Assign to global
const mockLit = { Actions: mockLitActions };
(global as any).Lit = mockLit;

describe('getTokenAmountInUsd', () => {
    const ETH_RPC_URL = process.env.ETH_RPC_URL;
    const BASE_RPC_URL = process.env.BASE_RPC_URL;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLitActions.getRpcUrl.mockResolvedValue(ETH_RPC_URL);
    });

    it('should calculate the USD price of DEGEN token on Base Mainnet', async () => {
        const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
        const chainId = '8453';
        const amountIn = '1';
        const tokenInAddress = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'; // DEGEN
        const tokenInDecimals = '18';

        const amountInUsd = await getTokenAmountInUsd(provider, chainId, amountIn, tokenInAddress, tokenInDecimals);

        expect(amountInUsd).toBeDefined();
        expect(amountInUsd._isBigNumber).toBe(true);
        expect(amountInUsd.toString()).toMatch(/^[0-9]+$/);
        expect(amountInUsd.gt(0)).toBe(true);
    });
});