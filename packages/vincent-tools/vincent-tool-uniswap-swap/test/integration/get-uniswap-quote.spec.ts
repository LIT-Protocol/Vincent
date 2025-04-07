import { ethers } from "ethers";

import { getUniswapQuote } from "../../src/lib/lit-actions/utils/get-uniswap-quote";

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

interface UniswapQuote {
    bestQuote: ethers.BigNumber;
    bestFee: number;
    amountOutMin: ethers.BigNumber;
}

describe('getUniswapQuote', () => {
    const BASE_RPC_URL = process.env.BASE_RPC_URL;

    beforeEach(() => {
        jest.clearAllMocks();
        mockLitActions.getRpcUrl.mockResolvedValue(BASE_RPC_URL);
    });

    it('should get a valid quote for swapping USDC to WETH on Base Mainnet', async () => {
        const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
        const chainId = '8453';
        const tokenInAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC
        const tokenOutAddress = '0x4200000000000000000000000000000000000006'; // WETH
        const amountIn = '10';
        const tokenInDecimals = '6'; // USDC has 6 decimals
        const tokenOutDecimals = '18'; // WETH has 18 decimals

        const quote = await getUniswapQuote(
            provider,
            chainId,
            tokenInAddress,
            tokenOutAddress,
            amountIn,
            tokenInDecimals,
            tokenOutDecimals
        ) as UniswapQuote;

        expect(quote).toBeDefined();
        expect(quote.bestQuote).toBeDefined();
        expect(quote.bestFee).toBeDefined();
        expect(quote.amountOutMin).toBeDefined();

        // Verify the quote values are valid
        expect(quote.bestQuote._isBigNumber).toBe(true);
        expect(quote.bestQuote.gt(0)).toBe(true);
        expect(quote.amountOutMin._isBigNumber).toBe(true);
        expect(quote.amountOutMin.gt(0)).toBe(true);

        // Verify the fee is one of the supported tiers
        expect([3000, 500]).toContain(quote.bestFee);
    });
});
